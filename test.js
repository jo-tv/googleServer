const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();

// 🟢 الروابط المتاحة للبث
const streamSources = [
  "http://sansat.cc:88/angmagloire/3OSUOQZYT5K8SEN/",
  "http://mo3ad.xyz/U9pXkj6ZCG/KZXN37xjz7/"
];

// تأكد من أن مجلد cache موجود
const cacheDirectory = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDirectory)) {
  fs.mkdirSync(cacheDirectory, { recursive: true });
  console.log('✅ تم إنشاء مجلد التخزين المؤقت.');
}

// 🔹 مسار بث القناة
app.get('/josef/stream/:channel', async (req, res) => {
  const channel = req.params.channel;

  let currentPart = 0;  // تتبع الجزء الحالي
  let isStreaming = false;  // متابعة حالة البث

  // تحقق من إتاحة الرابط
  for (let i = 0; i < streamSources.length; i++) {
    const originalUrl = `${streamSources[i]}${channel}`;

    try {
      console.log(`🔄 تجربة الرابط: ${originalUrl}`);

      // تحميل الجزء الأول
      const tempFilePath = path.join(cacheDirectory, `${channel}-${currentPart}.ts`);

      // التحقق من وجود الملف المؤقت
      if (fs.existsSync(tempFilePath)) {
        console.log(`✅ البث موجود في الذاكرة المؤقتة.`);
        const stream = fs.createReadStream(tempFilePath);
        stream.pipe(res, { end: false });

        // بمجرد البث، نبدأ في تحميل الجزء التالي
        currentPart++;
        setTimeout(() => {
          downloadNextPart(channel, currentPart);  // تحميل الجزء التالي في الخلفية
        }, 1000); // تأخير قليل قبل تحميل الجزء التالي

        return; // نوقف العملية بمجرد العثور على الجزء الأول
      }

      // تحميل جزء من البث
      const response = await axios({
        method: 'get',
        url: originalUrl,
        responseType: 'stream',
        headers: {
          'Accept-Encoding': 'gzip, deflate, br', // ضغط البيانات
          'Range': `bytes=${currentPart * 1048576}-${(currentPart + 1) * 1048576 - 1}`, // طلب جزء من البيانات
        },
        timeout: 30000, // زيادة المهلة إلى 30 ثانية
      });

      console.log(`✅ البث يعمل من المصدر ${i + 1}`);

      // حفظ البث في الذاكرة المؤقتة
      const writer = fs.createWriteStream(tempFilePath);
      response.data.pipe(writer);

      writer.on('finish', () => {
        console.log('✅ تم حفظ الجزء في الذاكرة المؤقتة');
        const stream = fs.createReadStream(tempFilePath);
        stream.pipe(res, { end: false });

        // تحميل الجزء التالي في الخلفية
        currentPart++;
        setTimeout(() => {
          downloadNextPart(channel, currentPart);  // تحميل الجزء التالي في الخلفية
        }, 1000); // تأخير قليل قبل تحميل الجزء التالي
      });

      writer.on('error', (err) => {
        console.error('❌ حدث خطأ أثناء حفظ الملف المؤقت:', err);
      });

    } catch (err) {
      console.error(`❌ المصدر ${i + 1} لا يعمل:`, err.message);
      if (err.response && err.response.status === 404) {
        console.log('❌ حدث خطأ 404: الجزء غير موجود.');
        // إعادة المحاولة بعد 5 ثوانٍ
        setTimeout(() => {
          console.log(`🔄 إعادة المحاولة لتحميل الجزء من المصدر ${i + 1}`);
          downloadNextPart(channel, currentPart); // إعادة المحاولة
        }, 5000);
      } else if (err.response) {
        console.log(`🔴 رمز الاستجابة: ${err.response.status}`);
      } else {
        console.log(`🔴 حدث خطأ غير متوقع: ${err.message}`);
      }
    }
  }

  res.status(500).send("⚠️ جميع المصادر غير متاحة حاليًا");
});

// دالة تحميل الجزء التالي في الخلفية
async function downloadNextPart(channel, partNumber) {
  try {
    const tempFilePath = path.join(cacheDirectory, `${channel}-${partNumber}.ts`);
    const originalUrl = `http://mo3ad.xyz/U9pXkj6ZCG/KZXN37xjz7/${channel}`;  // تحديث الرابط حسب الحاجة

    const response = await axios({
      method: 'get',
      url: originalUrl,
      responseType: 'stream',
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'Range': `bytes=${partNumber * 1048576}-${(partNumber + 1) * 1048576 - 1}`,
      },
      timeout: 30000,
    });

    console.log(`🔄 تحميل الجزء ${partNumber}`);

    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      console.log(`✅ تم حفظ الجزء ${partNumber} في الذاكرة المؤقتة`);
      // مسح الجزء السابق
      const previousPartFilePath = path.join(cacheDirectory, `${channel}-${partNumber - 1}.ts`);
      if (fs.existsSync(previousPartFilePath)) {
        fs.unlinkSync(previousPartFilePath);
        console.log(`✅ تم مسح الجزء السابق (${partNumber - 1})`);
      }
    });

    writer.on('error', (err) => {
      console.error(`❌ حدث خطأ أثناء حفظ الجزء ${partNumber}:`, err);
    });

  } catch (err) {
    console.error(`❌ حدث خطأ أثناء تحميل الجزء التالي:`, err.message);
    if (err.response && err.response.status === 404) {
      console.log(`❌ خطأ 404: الجزء غير موجود.`);
    } else {
      console.log(`❌ حدث خطأ غير متوقع: ${err.message}`);
    }
  }
}

// تشغيل الخادم على المنفذ 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ الخادم يعمل على http://localhost:${PORT}`));
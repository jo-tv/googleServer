const express = require('express');
const axios = require('axios');

const app = express();

// 🟢 قائمة الروابط المتاحة للبث
const streamSources = [
 "http://mo3ad.xyz/5ffwT4Jtdz/p9VfzRvdxK/",
 "http://mutant.arrox.top:80/live/oWg8mm2z2/C1LwyPEFOj/",
 "http://asterix-iptv.club:25461/24SuadViberRazmjena50/SPfbtyeepaup/",
 "http://173.212.193.243:8080/wAfWlqYhLp/vDIyvgtHHf/"
];

// دالة لإعادة تشغيل البث عندما يتوقف
const startStream = async (channel, res) => {
 for (let i = 0; i < streamSources.length; i++) {
  const originalUrl = `${streamSources[i]}${channel}`;

  try {
   console.log(`🔄 تجربة الرابط: ${originalUrl}`);

   const response = await axios({
    method: 'get',
    url: originalUrl,
    responseType: 'stream',
    timeout: 60000, // زيادة المهلة لتكون أكبر (60 ثانية)
   });

   console.log(`✅ البث يعمل من المصدر ${i + 1}`);
   res.setHeader('Content-Type', 'video/mp2t'); // HLS أو TS

   let buffer = [];
   let segmentTime = 15 * 1000; // التحميل المسبق لمدة 15 ثانية
   let lastLoadedTime = Date.now();

   // تابع لتحميل الأجزاء القادمة مسبقًا
   const preBufferSegment = async (nextUrl) => {
    try {
     const preBuffer = await axios({
      method: 'get',
      url: nextUrl,
      responseType: 'stream',
     });

     preBuffer.data.on('data', chunk => {
      console.log(`🟢 جزء جديد قيد التحميل (مسبقًا)...`);
      buffer.push(chunk); // تخزين الأجزاء القادمة في الذاكرة
     });

    } catch (err) {
     console.error(`❌ فشل تحميل الجزء التالي: ${nextUrl}`);
    }
   };

   // إرسال الأجزاء بشكل مستمر
   response.data.on('data', chunk => {
    console.log(`🟢 جزء جديد قيد التحميل...`);
    buffer.push(chunk); // تخزين البيانات بشكل مؤقت

    const currentTime = Date.now();
    if (currentTime - lastLoadedTime > segmentTime) {
     console.log(`🔄 إرسال البيانات المحملة: ${buffer.length} bytes`);
     res.write(Buffer.concat(buffer)); // إرسال البيانات جزئيًا
     buffer = []; // إعادة تعيين البيانات المؤقتة
     lastLoadedTime = currentTime;

     // تحميل الجزء التالي بشكل مسبق
     const nextSegmentUrl = `${originalUrl}${parseInt(channel) + 1}.ts`;
     preBufferSegment(nextSegmentUrl);
    }
   });

   response.data.on('end', () => {
    if (buffer.length > 0) {
     console.log(`🔚 إرسال البيانات المتبقية.`);
     res.write(Buffer.concat(buffer)); // إرسال البيانات المتبقية
    }
    res.end(); // إغلاق البث
    console.log(`📡 انتهى البث`);
   });

   return; // ⬅️ إيقاف البحث بعد العثور على رابط صالح
  } catch (err) {
   console.error(`❌ المصدر ${i + 1} لا يعمل، المحاولة التالية...`);
  }
 }

 res.status(500).send("⚠️ جميع المصادر غير متاحة حاليًا");
};

// مسار بث القناة
app.get('/stream/:channel', async (req, res) => {
 const channel = req.params.channel;
 await startStream(channel, res); // بدء البث من رابط متاح
});

// ✅ تشغيل السيرفر على المنفذ 3000
app.listen(3000, () => {
 console.log("✅ الخادم يعمل على http://localhost:3000");
});
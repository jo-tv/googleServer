const express = require('express');
const axios = require('axios');
const app = express();

// 🟢 الروابط المتاحة للبث
const streamSources = [
  "http://mo3ad.xyz/U9pXkj6ZCG/KZXN37xjz7/",
 "http://line.din-ott.com/mrwxkx98rt/1h12aju532/"
];

app.get('/ping', (req, res) => {
 res.send('pong'); // استجابة سريعة وخفيفة
});

// 🔹 مسار بث القناة
app.get('/josef/stream/:channel', async (req, res) => {
  const channel = req.params.channel;

  // تحقق من إتاحة الرابط
  for (let i = 0; i < streamSources.length; i++) {
    const originalUrl = `${streamSources[i]}${channel}`;

    try {
      console.log(`🔄 تجربة الرابط: ${originalUrl}`);

      // قم بتحديد رؤوس الطلب لتقليل استهلاك البيانات عبر دعم الضغط
      const response = await axios({
        method: 'get',
        url: originalUrl,
        responseType: 'stream',
        headers: {
          'Accept-Encoding': 'gzip, deflate, br', // ضغط البيانات
        },
        timeout: 30000, // زيادة المهلة إلى 30 ثانية
      });

      console.log(`✅ البث يعمل من المصدر ${i + 1}`);
      
      // إرسال البيانات المضغوطة إلى المستخدم
      response.data.pipe(res);
      return; // نوقف العملية بمجرد العثور على رابط شغال
    } catch (err) {
      console.error(`❌ المصدر ${i + 1} لا يعمل، المحاولة التالية...`);
    }
  }

  res.status(500).send("⚠️ جميع المصادر غير متاحة حاليًا");
});

setInterval(() => {
 axios.get('https://googleserver-d4w5.onrender.com/ping')
  .then(() => console.log('🔄 Keep-Alive Ping Sent'))
  .catch(() => console.log('⚠️ Keep-Alive Failed'));
}, 5 * 60 * 1000); // كل 5 دقائق



// تشغيل الخادم على المنفذ 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ الخادم يعمل على http://localhost:${PORT}`));
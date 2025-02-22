const express = require('express');
const axios = require('axios');
const { Throttle } = require('stream-throttle');

const app = express();

// 🟢 قائمة الروابط المتاحة للبث
const streamSources = [
 "http://mo3ad.xyz/5ffwT4Jtdz/p9VfzRvdxK/",
 "http://xtream-ie.com/mo3ad7756/mo3ad7756/",
];

// 🔹 مسار بث القناة
app.get('/josef/stream/:channel', async (req, res) => {
 const channel = req.params.channel;

 for (let i = 0; i < streamSources.length; i++) {
  const originalUrl = `${streamSources[i]}${channel}`;

  try {
   console.log(`🔄 تجربة الرابط: ${originalUrl}`);

   const response = await axios({
    method: 'get',
    url: originalUrl,
    responseType: 'stream',
    timeout: 30000, // زيادة المهلة إلى 30 ثانية
   });

   console.log(`✅ البث يعمل من المصدر ${i + 1}`);

   // تقليل معدل البت (Bitrate) إلى 300 كيلوبت في الثانية (جودة منخفضة)
   const throttle = new Throttle({ rate: 300 * 480 }); // 300 كيلوبت في الثانية
   response.data.pipe(throttle).pipe(res);

   return; // ⬅️ نوقف العملية بمجرد العثور على رابط شغال
  } catch (err) {
   console.error(`❌ المصدر ${i + 1} لا يعمل، المحاولة التالية...`);
  }
 }

 res.status(500).send("⚠️ جميع المصادر غير متاحة حاليًا");
});

// ✅ تشغيل السيرفر على المنفذ 3000
app.listen(3000, () => {
 console.log("✅ الخادم يعمل على http://localhost:3000");
});
const express = require('express');
const axios = require('axios');

const app = express();

// 🟢 قائمة الروابط المتاحة للبث
const streamSources = [
 "http://mo3ad.xyz/VJ5sPbGpvw/PjuDatRDQm/",
 "http://mutant.arrox.top:80/live/oWg8mm2z2/C1LwyPEFOj/"
];

app.get('/ping', (req, res) => {
 res.send('pong'); // استجابة سريعة وخفيفة
});

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
   response.data.pipe(res);
   return; // ⬅️ نوقف العملية بمجرد العثور على رابط شغال
  } catch (err) {
   console.error(`❌ المصدر ${i + 1} لا يعمل، المحاولة التالية...`);
  }
 }

 res.status(500).send("⚠️ جميع المصادر غير متاحة حاليًا");
});

setInterval(() => {
 axios.get('https://google-com-cookies-9zq4.onrender.com/ping')
  .then(() => console.log('🔄 Keep-Alive Ping Sent'))
  .catch(() => console.log('⚠️ Keep-Alive Failed'));
}, 5 * 60 * 1000); // كل 5 دقائق

// ✅ تشغيل السيرفر على المنفذ 3000
app.listen(3000, () => {
 console.log("✅ الخادم يعمل على http://localhost:3000");
});
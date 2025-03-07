const express = require('express');
const { spawn } = require('child_process');
const axios = require('axios');
const app = express();

// ✅ الروابط المتاحة للبث
const streamSources = [
  "http://mo3ad.xyz/U9pXkj6ZCG/KZXN37xjz7/",
  "http://sansat.cc:88/angmagloire/3OSUOQZYT5K8SEN/"
];

// ✅ مسار اختبار الخادم (Keep-Alive)
app.get('/ping', (req, res) => {
  res.send('pong');
});

// ✅ مسار بث القناة مع Streamlink
app.get('/josef/stream/:channel', async (req, res) => {
  const channel = req.params.channel;
  let streamFound = false;

  for (const [index, baseUrl] of streamSources.entries()) {
    const originalUrl = `${baseUrl}${channel}`;

    try {
      console.log(`🔄 تجربة المصدر ${index + 1}: ${originalUrl}`);

      // التحقق من توفر الرابط
      await axios.head(originalUrl, { timeout: 10000 });

      console.log(`✅ البث يعمل من المصدر ${index + 1}, بدأ Streamlink...`);

      // تشغيل Streamlink لتحسين البث
      const streamProcess = spawn('streamlink', [
        originalUrl,
        'best',
        '--stdout', // استخراج البث إلى الإخراج المباشر
        '--player-args', '--hls-segment-threads=4' // تحسين التخزين المؤقت
      ]);

      // تمرير البيانات إلى العميل
      streamProcess.stdout.pipe(res);
      streamFound = true;

      // تسجيل أي خطأ في Streamlink
      streamProcess.stderr.on('data', (data) => {
        console.error(`❌ خطأ Streamlink: ${data.toString()}`);
      });

      streamProcess.on('close', (code) => {
        console.log(`📌 تم إنهاء Streamlink برمز: ${code}`);
      });

      break; // التوقف عند أول رابط ناجح
    } catch (err) {
      console.error(`❌ المصدر ${index + 1} فشل: ${err.message}`);
    }
  }

  if (!streamFound) {
    res.status(502).send("⚠️ جميع مصادر البث غير متاحة حاليًا");
  }
});

// ✅ إبقاء الخادم نشطًا عبر Keep-Alive
setInterval(async () => {
  try {
    await axios.get('https://googleserver-lga6.onrender.com/ping');
    console.log('🔄 Keep-Alive: Ping ناجح');
  } catch (err) {
    console.error('⚠️ Keep-Alive: فشل الاتصال', err.message);
  }
}, 5 * 60 * 1000); // كل 5 دقائق

// ✅ تشغيل الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`));
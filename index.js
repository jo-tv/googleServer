const express = require('express');
const axios = require('axios');


const app = express();

// 🟢 مصادر البث
const streamSources = [
  "http://no0rqpwo9qdbar.shurty.me:25461/93p6E6b0OG/918311183993/",
  "http://xtream-ie.com:80/mo3ad7791/mo3ad7791/"
];

const { LRUCache } = require('lru-cache');
const streamCache = new LRUCache({ max: 50, ttl: 60000 });
// 🔹 مسار اختبار الاتصال
app.get('/ping', (req, res) => res.send('pong'));

// 🔹 مسار البث
app.get('/josef/stream/:channel', async (req, res) => {
  const channel = req.params.channel;
  
  // 🔸 التحقق من الكاش أولاً
  if (streamCache.has(channel)) {
    console.log(`♻️ استرجاع من الكاش: ${streamCache.get(channel)}`);
    return proxyStream(streamCache.get(channel), res);
  }

  // 🔸 البحث عن مصدر متاح
  for (let source of streamSources) {
    const originalUrl = `${source}${channel}`;
    
    try {
      console.log(`🔄 تجربة الرابط: ${originalUrl}`);
      
      // 🔹 التأكد من استجابة الرابط قبل إعادة البث
      const response = await axios.head(originalUrl, { timeout: 5000 });

      if (response.status === 200) {
        console.log(`✅ المصدر شغال: ${originalUrl}`);
        
        // حفظ الرابط في الكاش
        streamCache.set(channel, originalUrl);

        return proxyStream(originalUrl, res);
      }
    } catch (err) {
      console.error(`❌ المصدر لا يعمل: ${originalUrl}`);
    }
  }

  res.status(500).send("⚠️ جميع المصادر غير متاحة حاليًا");
});

// 🔹 إعادة بث الفيديو من المصدر
function proxyStream(url, res) {
  axios({
    method: 'get',
    url: url,
    responseType: 'stream',
    headers: {
      'Accept-Encoding': 'gzip, deflate, br',
    },
    timeout: 30000, // مهلة الطلب 30 ثانية
  })
  .then(response => {
    res.setHeader('Content-Type', response.headers['content-type']);
    response.data.pipe(res);
  })
  .catch(err => {
    console.error(`❌ فشل في البث من ${url}`);
    res.status(500).send("⚠️ تعذر تحميل البث");
  });
}

// 🔄 إرسال Keep-Alive كل 5 دقائق
setInterval(() => {
  axios.get('https://googleserver-d4w5.onrender.com/ping')
    .then(() => console.log('🔄 Keep-Alive Ping Sent'))
    .catch(() => console.log('⚠️ Keep-Alive Failed'));
}, 5 * 60 * 1000);

// 🚀 تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ الخادم يعمل على http://localhost:${PORT}`));
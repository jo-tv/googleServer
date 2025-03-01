const express = require('express');
const axios = require('axios');

const app = express();

// 🟢 قائمة الروابط المتاحة للبث
const streamSources = [
  "http://mo3ad.xyz/U9pXkj6ZCG/KZXN37xjz7/",
  "http://pro.ipcover.lol:8080/T3H2XcMqmt7A/jjShbfJwzhV6/",
  "http://mutant.arrox.top:80/live/oWg8mm2z2/C1LwyPEFOj/"
];

// 🔹 رابط الشعار (استبدله برابط الشعار الخاص بك)
const logoUrl = "https://i.postimg.cc/d0w5hXdb/watch-Arri-re-plan-virtuel-de-Zoom.gif";

// 🔸 توجيه المستخدم إلى Xpola Player
app.get('/josef/xpola/:channel', async (req, res) => {
  const channel = req.params.channel;

  for (let i = 0; i < streamSources.length; i++) {
    const streamUrl = `${streamSources[i]}${channel}`;

    try {
      console.log(`🔄 تجربة الرابط: ${streamUrl}`);

      // التحقق من عمل الرابط
      await axios.head(streamUrl, { timeout: 10000 });

      console.log(`✅ البث يعمل من المصدر ${i + 1}`);

      // تمرير الرابط إلى مشغل Xpola مع الشعار
      const xpolaLink = `intent://play?url=${encodeURIComponent(streamUrl)}&logo=${encodeURIComponent(logoUrl)}#Intent;package=com.xpola.player;end`;
      
      return res.redirect(xpolaLink);
    } catch (err) {
      console.error(`❌ المصدر ${i + 1} لا يعمل، المحاولة التالية...`);
    }
  }

  res.status(500).send("⚠️ جميع المصادر غير متاحة حاليًا");
});

// ✅ تشغيل الخادم
app.listen(3000, () => {
  console.log("✅ الخادم يعمل على http://localhost:3000");
});
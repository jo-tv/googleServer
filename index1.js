const express = require("express");
const axios = require("axios");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// 🟢 قائمة الروابط المتاحة للبث
const streamSources = [
 "http://mo3ad.xyz/5ffwT4Jtdz/p9VfzRvdxK/",
 "http://mutant.arrox.top:80/live/oWg8mm2z2/C1LwyPEFOj/",
 "http://asterix-iptv.club:25461/24SuadViberRazmjena50/SPfbtyeepaup/",
 "http://173.212.193.243:8080/wAfWlqYhLp/vDIyvgtHHf/"
];

// 🔹 مجلد تخزين ملفات MPD المؤقتة
const OUTPUT_DIR = path.join(__dirname, "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

// 🔹 مسار البث بصيغة MPD (DASH)
app.get("/stream/:channel", async (req, res) => {
    const channel = req.params.channel;
    let selectedUrl = null;

    // 🔄 تجربة الروابط المتاحة
    for (let i = 0; i < streamSources.length; i++) {
        const originalUrl = `${streamSources[i]}${channel}`;

        try {
            console.log(`🔄 تجربة الرابط: ${originalUrl}`);
            const response = await axios.head(originalUrl, { timeout: 5000 });

            if (response.status === 200) {
                console.log(`✅ المصدر ${i + 1} يعمل!`);
                selectedUrl = originalUrl;
                break;
            }
        } catch (err) {
            console.error(`❌ المصدر ${i + 1} لا يعمل، المحاولة التالية...`);
        }
    }

    if (!selectedUrl) {
        return res.status(500).send("⚠️ جميع المصادر غير متاحة حاليًا");
    }

    // 🔹 إنشاء مسار ملف MPD
    const outputMPD = path.join(OUTPUT_DIR, `${channel}.mpd`);

    // 🛑 حذف الملفات القديمة قبل إعادة البث
    if (fs.existsSync(outputMPD)) fs.unlinkSync(outputMPD);

    // 🚀 تشغيل FFmpeg لتحويل M3U8 إلى MPD
    const ffmpegArgs = [
        "-i", selectedUrl,
        "-map", "0",
        "-c:v", "libx264",
        "-c:a", "aac",
        "-b:v", "2500k",
        "-b:a", "128k",
        "-f", "dash",
        "-seg_duration", "4",
        "-use_template", "1",
        "-use_timeline", "1",
        outputMPD
    ];

    const ffmpegProcess = spawn("ffmpeg", ffmpegArgs);

    ffmpegProcess.stderr.on("data", (data) => {
        console.log(`FFmpeg: ${data}`);
    });

    ffmpegProcess.on("close", (code) => {
        if (code === 0) {
            console.log(`✅ التحويل ناجح!`);
        } else {
            console.error(`❌ فشل التحويل!`);
        }
    });

    res.json({ message: "✅ البث بدأ!", mpd_url: `/output/${channel}.mpd` });
});

// 🔹 تقديم ملفات البث المحولة
app.use("/output", express.static(OUTPUT_DIR));

// ✅ تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`✅ الخادم يعمل على http://localhost:${PORT}`);
});
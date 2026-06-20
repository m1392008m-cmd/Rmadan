const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

// إعداد مكتبة الواتساب مع تفعيل ميزة حفظ الجلسة عشان ما تفصلش
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // ضرورية جداً للتشغيل على الاستضافات المفتوحة
    }
});

// توليد رمز الـ QR Code في الـ Logs لتسجيل الدخول أول مرة
client.on('qr', (qr) => {
    console.log('=== ارفع الشاشة لفوق وانسح الـ QR Code ده بتليفونك ===');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('🚀 سيرفر الواتساب جاهز الآن لإرسال الرسائل!');
});

// الـ Endpoint اللي موقع الـ PHP هيكلمه
app.post('/send-message', async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ status: 'error', message: 'Missing parameters' });
    }

    try {
        // تهيئة الرقم بالصيغة الدولية التي تفهمها المكتبة
        const formattedNumber = `${number}@c.us`;
        await client.sendMessage(formattedNumber, message);
        
        res.status(200).json({ status: 'success', message: 'OTP Sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

client.initialize();

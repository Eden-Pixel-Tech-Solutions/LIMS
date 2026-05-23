import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode-terminal';
import db from './config/db.js';
import axios from 'axios';
import dotenv from 'dotenv';
import express from 'express';
dotenv.config();

const app = express();
app.use(express.json());
const PORT = process.env.BOT_PORT || 3005;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- this one can help on some systems
            '--disable-gpu'
        ],
    }
});

client.on('qr', (qr) => {
    console.log('SCAN THIS QR CODE TO LOGIN:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Meril LIS Chatbot is READY!');
    app.listen(PORT, () => {
        console.log(`Chatbot API listening on port ${PORT}`);
    });
});

app.post('/send-report', async (req, res) => {
    const { phone, sampleId, patientName, testName } = req.body;
    if (!phone || !sampleId) return res.status(400).json({ success: false, message: 'Phone and SampleID required' });
    try {
        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.length === 10) formattedPhone = '91' + formattedPhone;
        const chatId = formattedPhone + '@c.us';
        const reportUrl = `${process.env.API_BASE_URL || 'http://localhost:7005'}/api/lab/generate-report-pdf/${sampleId}`;
        const message = `🏥 *JHARKHAND STATE DIAGNOSTIC SERVICES*\n\n✅ *Report Ready!*\n👤 *Patient:* ${patientName || 'Valued Patient'}\n🔬 *Test:* ${testName || 'Laboratory Test'}\n🆔 *Sample ID:* ${sampleId}\n\n🔗 *Download Link:* \n${reportUrl}\n\n_Thank you for choosing Meril HIMS._`;
        await client.sendMessage(chatId, message);
        res.json({ success: true, message: 'Report sent to WhatsApp' });
    } catch (error) {
        console.error('Error sending WhatsApp:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Main Bot Logic
client.on('message', async msg => {
    const chat = await msg.getChat();
    const contact = await msg.getContact();
    const body = msg.body.toLowerCase();

    // Normalization Logic for Indian Phone Numbers
    let sender = contact.number || msg.from.split('@')[0];

    // Remove any non-numeric characters (like +)
    sender = sender.replace(/\D/g, '');

    // If it's a 12-digit number starting with 91, take the last 10
    if (sender.length === 12 && sender.startsWith('91')) {
        sender = sender.slice(-10);
    }
    // If it's 10 digits, keep it. If it's something else, we log it.

    console.log('--- NEW MESSAGE ---');
    console.log(`From: ${msg.from}`);
    console.log(`Normalized Sender: ${sender}`);
    console.log(`Body: ${msg.body}`);
    console.log('-------------------');

    if (body === 'hi' || body === 'hello' || body === 'menu') {
        const welcome = `🏥 *JHARKHAND STATE DIAGNOSTIC SERVICES*
Powered by *Merilyzer LIS Technology*
________________________________

👋 *Hello!* I am your automated Health Assistant.

I can help you access your diagnostic reports and manage your profile 24/7 without waiting in line.

📌 *How can I assist you today?*
Please reply with the number:

1️⃣ *Download Latest Report*
(Get your most recent approved test)

2️⃣ *View All Previous Reports*
(See your full history &  3️⃣ *My Profile Details*
(Check your registration info)

4️⃣ *Test Preparation & FAQ*
(Fasting info, Report timings, etc.)

________________________________
💡 *Tip:* You can always type *MENU* to return to this screen.
🏥 *Stay Healthy, Stay Informed!*`;
        client.sendMessage(msg.from, welcome);
    }

    else if (body === '1') {
        client.sendMessage(msg.from, '🔍 *Searching for your latest report...*');
        try {
            const [rows] = await db.query(`
                SELECT tr.sample_id, tr.status, p.first_name, p.last_name
                FROM lab_test_result tr
                JOIN patients p ON tr.patient_id = p.id
                WHERE p.telephone = ? AND tr.status = 'Approved'
                ORDER BY tr.tested_at DESC LIMIT 1
            `, [sender]);

            if (rows.length > 0) {
                const report = rows[0];
                const reportUrl = `${process.env.API_BASE_URL || 'http://localhost:7005'}/api/lab/generate-report-pdf/${report.sample_id}`;

                const responseMsg = `✅ *Latest Report Found!*
👤 *Patient:* ${report.first_name} ${report.last_name}
🆔 *Sample ID:* ${report.sample_id}

🔗 *Download Link:*
${reportUrl}`;
                client.sendMessage(msg.from, responseMsg);
            } else {
                client.sendMessage(msg.from, '❌ *No approved reports found for your number.*');
            }
        } catch (err) {
            client.sendMessage(msg.from, '⚠️ Error accessing database.');
        }
    }

    else if (body === '2') {
        client.sendMessage(msg.from, '📋 *Fetching your report history...*');
        try {
            const [rows] = await db.query(`
                SELECT tr.sample_id, tr.test_name, tr.tested_at
                FROM lab_test_result tr
                JOIN patients p ON tr.patient_id = p.id
                WHERE p.telephone = ? AND tr.status = 'Approved'
                ORDER BY tr.tested_at DESC LIMIT 10
            `, [sender]);

            if (rows.length > 0) {
                let historyMsg = `📚 *Your Recent Reports (Last 10)*\n\n`;
                rows.forEach((r, idx) => {
                    const date = new Date(r.tested_at).toLocaleDateString();
                    historyMsg += `${idx + 1}. *${r.test_name}*\n📅 ${date} | 🆔 ${r.sample_id}\n🔗 ${process.env.API_BASE_URL || 'http://localhost:7005'}/api/lab/generate-report-pdf/${r.sample_id}\n\n`;
                });
                historyMsg += `_You can click the links above to download any report._`;
                client.sendMessage(msg.from, historyMsg);
            } else {
                client.sendMessage(msg.from, '❌ *No report history found.*');
            }
        } catch (err) {
            client.sendMessage(msg.from, '⚠️ Error fetching history.');
        }
    }

    else if (body === '3') {
        try {
            const [rows] = await db.query('SELECT * FROM patients WHERE telephone = ?', [sender]);
            if (rows.length > 0) {
                const p = rows[0];
                const details = `📋 *Your Patient Profile*
👤 *Name:* ${p.first_name} ${p.last_name}
🎂 *DOB:* ${p.dob ? new Date(p.dob).toLocaleDateString() : 'N/A'}
🚻 *Gender:* ${p.gender}
📱 *Phone:* ${p.telephone}
🏥 *Registered Branch:* ${p.branch_id || 'Main Lab'}`;
                client.sendMessage(msg.from, details);
            } else {
                client.sendMessage(msg.from, '❌ *You are not registered in our system.* Please visit the laboratory for registration.');
            }
        } catch (err) {
            client.sendMessage(msg.from, '⚠️ Error fetching details.');
        }
    }

    else if (body === '4') {
        const faq = `💡 *Patient Preparation & Info*

🧪 *Fasting Requirements:*
• *Blood Sugar (Fasting):* 8-10 hours of fasting required.
• *Lipid Profile:* 10-12 hours of fasting required.
• *Thyroid/KFT/LFT:* No fasting required.

🕒 *Report Turnaround Time:*
• Most Biochemistry tests: 2-4 Hours.
• Hematology (CBC): 1-2 Hours.
• Specialized tests: 24-48 Hours.

📝 *Note:*
Please carry your Doctor's Prescription and Patient ID during your visit.`;
        client.sendMessage(msg.from, faq);
    }
});

console.log('🚀 Starting Meril LIS Bot...');
console.log('📅 Date:', new Date().toLocaleString());
console.log('🔧 Initializing WhatsApp Client...');

client.initialize();

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});

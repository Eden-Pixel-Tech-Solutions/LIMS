const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const fs = require('fs');

const app = express();
const port = process.env.BOT_PORT || 3005;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Add CORS support
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    if ('OPTIONS' === req.method) {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Auto-detect Chrome path — prioritizes PUPPETEER_EXECUTABLE_PATH env var (set in Docker)
function getChromePath() {
    // If running in Docker, this env var is already set in the Dockerfile
    if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
        return process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    const paths = [
        // Linux (Docker / Ubuntu)
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        // Windows
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
        // Mac
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ];

    const found = paths.find(p => fs.existsSync(p));
    if (!found) throw new Error('Chrome not found! Install Google Chrome or set PUPPETEER_EXECUTABLE_PATH.');
    return found;
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,                          // MUST be true in Docker (no display server)
        executablePath: getChromePath(),
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

// Scan QR Code
client.on('qr', qr => {
    console.log('SCAN THIS QR CODE TO LOGIN:');
    qrcode.generate(qr, { small: true });
});

// On successful login
client.on('ready', () => {
    console.log('✅ WhatsApp bot is READY!');
});

client.on('loading_screen', (percent, message) => {
    console.log(`⏳ Loading: ${percent}% - ${message}`);
});

client.on('authenticated', () => {
    console.log('🔐 AUTHENTICATED');
});

client.on('auth_failure', msg => {
    console.error('❌ AUTHENTICATION FAILURE:', msg);
});

client.on('disconnected', reason => {
    console.warn('⚠️ Client disconnected:', reason);
});

// Handle incoming messages
client.on('message', message => {
    console.log(`📩 Received: "${message.body}" from ${message.from}`);
    if (message.body.toLowerCase().includes('help')) {
        message.reply("Hey! 👋 How can I assist you? Please describe your issue, and we'll get back to you shortly.");
    }
});

// API endpoint to send WhatsApp messages (with optional media)
app.post('/send-message', async (req, res) => {
    const { phone, text, media, filename } = req.body;

    if (!phone) {
        return res.status(400).send('Phone number is required!');
    }

    // Check if client is ready
    if (!client.info) {
        return res.status(503).send('WhatsApp bot is not ready. Please wait for initialization or re-scan QR.');
    }

    const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;

    try {
        if (media) {
            const messageMedia = new MessageMedia('application/pdf', media, filename || 'document.pdf');
            await client.sendMessage(chatId, messageMedia, { caption: text });
        } else {
            await client.sendMessage(chatId, text);
        }
        res.send('Message sent successfully!');
    } catch (err) {
        console.error('WhatsApp send error:', err);

        if (err.message.includes('detached Frame') || err.message.includes('Session closed')) {
            res.status(503).send('WhatsApp connection lost. Please restart the bot.');
        } else {
            res.status(500).send('Failed to send message: ' + err.message);
        }
    }
});

// Health check endpoint
app.get('/status', (req, res) => {
    res.json({
        ready: !!client.info,
        phone: client.info?.wid?.user || null,
        uptime: process.uptime()
    });
});

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});

console.log('🔧 Initializing WhatsApp Client...');
client.initialize();
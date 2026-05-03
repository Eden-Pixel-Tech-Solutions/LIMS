const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const fs = require('fs');

const app = express();
const port = 3000;

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

// Auto-detect Chrome path across platforms
function getChromePath() {
    const paths = [
        // Windows
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
        // Linux
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        // Mac
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ];
    const found = paths.find(p => fs.existsSync(p));
    if (!found) throw new Error('Chrome not found! Install Google Chrome or set executablePath manually.');
    return found;
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: getChromePath(),
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    }
});

// Scan QR Code
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('Scan the QR code to connect WhatsApp!');
});

// On successful login
client.on('ready', () => {
    console.log('WhatsApp bot is ready!');
});

// Handle incoming messages
client.on('message', message => {
    console.log(`Received: ${message.body} from ${message.from}`);
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

    // Check if client is initialized and ready
    if (!client.pupPage || client.pupPage.isClosed()) {
        return res.status(503).send('WhatsApp bot browser is closed or detached. Please restart the bot.');
    }

    const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;

    try {
        if (media) {
            const { MessageMedia } = require('whatsapp-web.js');
            const messageMedia = new MessageMedia('application/pdf', media, filename || 'document.pdf');
            await client.sendMessage(chatId, messageMedia, { caption: text });
        } else {
            await client.sendMessage(chatId, text);
        }
        res.send('Message sent successfully!');
    } catch (err) {
        console.error('WhatsApp send error:', err);
        
        // Specific handling for common Puppeteer/WWebJS errors
        if (err.message.includes('detached Frame') || err.message.includes('Session closed')) {
            res.status(503).send('WhatsApp connection lost (Detached Frame). Please restart the bot command (npm start).');
        } else {
            res.status(500).send('Failed to send message: ' + err.message);
        }
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

client.initialize();
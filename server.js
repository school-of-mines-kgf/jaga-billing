const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATABASE_FILE = path.join(__dirname, 'database.json');

// Initialize database if it doesn't exist
if (!fs.existsSync(DATABASE_FILE)) {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify({
        lastBillNumber: 0,
        customers: [],
        bills: []
    }, null, 2));
}

// Read database
function readDatabase() {
    try {
        const data = fs.readFileSync(DATABASE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { lastBillNumber: 0, customers: [], bills: [] };
    }
}

// Write database
function writeDatabase(data) {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(data, null, 2));
}

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png'
};

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // API endpoints
    if (req.url === '/api/database' && req.method === 'GET') {
        const db = readDatabase();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db));
        return;
    }

    if (req.url === '/api/save-bill' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const billData = JSON.parse(body);
                const db = readDatabase();

                // Add customer if not exists
                const existingCustomer = db.customers.find(c =>
                    c.phone === billData.customerPhone
                );

                if (!existingCustomer) {
                    db.customers.push({
                        name: billData.customerName,
                        phone: billData.customerPhone,
                        address: billData.customerAddress,
                        addedAt: new Date().toISOString()
                    });
                }

                // Add bill
                db.bills.unshift(billData);
                db.lastBillNumber = parseInt(billData.billNumber) || db.lastBillNumber;

                writeDatabase(db);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Bill saved!' }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return;
    }

    if (req.url === '/api/get-next-bill-number' && req.method === 'GET') {
        const db = readDatabase();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ billNumber: db.lastBillNumber + 1 }));
        return;
    }

    // Get all history (for syncing across devices)
    if (req.url === '/api/get-history' && req.method === 'GET') {
        const db = readDatabase();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            bills: db.bills || [],
            lastBillNumber: db.lastBillNumber || 0
        }));
        return;
    }

    // Save full history (for syncing from client)
    if (req.url === '/api/save-history' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { bills, lastBillNumber } = JSON.parse(body);
                const db = readDatabase();

                // Merge histories - add any bills not already in server
                const existingBillNumbers = new Set(db.bills.map(b => b.billNumber));
                const newBills = bills.filter(b => !existingBillNumbers.has(b.billNumber));

                db.bills = [...newBills, ...db.bills];
                db.lastBillNumber = Math.max(db.lastBillNumber || 0, lastBillNumber || 0);

                writeDatabase(db);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'History synced!',
                    totalBills: db.bills.length
                }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return;
    }

    // Serve static files
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

// Get local IP address for network access
const os = require('os');
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const localIP = getLocalIP();

server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('='.repeat(60));
    console.log('  JAGA SILK PRODUCTS - Billing System Server');
    console.log('='.repeat(60));
    console.log('');
    console.log(`  📱 FOR PHONES/OTHER DEVICES: http://${localIP}:${PORT}`);
    console.log(`  💻 FOR THIS LAPTOP: http://localhost:${PORT}`);
    console.log('');
    console.log('  ✅ All devices using the same URL will share history!');
    console.log('  💾 All bills are saved to database.json');
    console.log('');
    console.log('  Press Ctrl+C to stop the server');
    console.log('='.repeat(60));
});

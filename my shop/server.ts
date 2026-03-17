import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3000;
const SECRET_KEY = 'super-secret-admin-key-change-me';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure data directory exists for persistent storage
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite DB in the data directory
const dbPath = process.env.NODE_ENV === 'production' ? path.join(dataDir, 'shop.db') : 'shop.db';
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    site_title TEXT,
    logo_url TEXT,
    bg_image_url TEXT,
    upi_id TEXT,
    qr_image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    price TEXT,
    image_url TEXT,
    payment_link TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    customer_upi_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id)
  );
`);

// Add columns if they don't exist (for existing databases)
try {
  db.exec('ALTER TABLE settings ADD COLUMN upi_id TEXT;');
  db.exec('ALTER TABLE settings ADD COLUMN qr_image_url TEXT;');
} catch (e) {
  // Columns likely already exist
}

// Insert default settings
const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
if (settingsCount.count === 0) {
  db.prepare(`
    INSERT INTO settings (id, site_title, logo_url, bg_image_url)
    VALUES (1, 'My Professional Shop', 'https://picsum.photos/seed/logo/100/100', 'https://picsum.photos/seed/bg/1920/1080?blur=2')
  `).run();
}

// Insert default admin
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  // In a real app, hash the password!
  db.prepare(`
    INSERT INTO users (username, password)
    VALUES ('karl90', 'karl906284151703')
  `).run();
} else {
  // Update existing admin credentials
  db.prepare(`
    UPDATE users 
    SET username = 'karl90', password = 'karl906284151703'
    WHERE id = 1 OR username = 'admin'
  `).run();
}

// Insert default products
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
if (productCount.count === 0) {
  const insertProduct = db.prepare(`
    INSERT INTO products (title, price, image_url, payment_link)
    VALUES (?, ?, ?, ?)
  `);
  
  insertProduct.run('Premium Wireless Headphones', '₹2,499', 'https://picsum.photos/seed/headphones/400/400', 'https://example.com/pay/1');
  insertProduct.run('Mechanical Keyboard', '₹1,299', 'https://picsum.photos/seed/keyboard/400/400', 'https://example.com/pay/2');
  insertProduct.run('Ergonomic Mouse', '₹799', 'https://picsum.photos/seed/mouse/400/400', 'https://example.com/pay/3');
  insertProduct.run('4K Monitor', '₹14,999', 'https://picsum.photos/seed/monitor/400/400', 'https://example.com/pay/4');
} else {
  // Update existing products to use INR if they have $
  try {
    db.exec(`UPDATE products SET price = REPLACE(price, '$', '₹') WHERE price LIKE '%$%';`);
  } catch (e) {
    console.error(e);
  }
}

// Middleware to verify token
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// API Routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  
  if (user) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/settings', (req, res) => {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(settings);
});

app.put('/api/settings', authenticate, (req, res) => {
  const { site_title, logo_url, bg_image_url, upi_id, qr_image_url } = req.body;
  db.prepare(`
    UPDATE settings 
    SET site_title = ?, logo_url = ?, bg_image_url = ?, upi_id = ?, qr_image_url = ?
    WHERE id = 1
  `).run(site_title, logo_url, bg_image_url, upi_id, qr_image_url);
  res.json({ success: true });
});

app.get('/api/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products').all();
  res.json(products);
});

app.post('/api/products', authenticate, (req, res) => {
  const { title, price, image_url, payment_link } = req.body;
  const result = db.prepare(`
    INSERT INTO products (title, price, image_url, payment_link)
    VALUES (?, ?, ?, ?)
  `).run(title, price, image_url, payment_link);
  res.json({ id: result.lastInsertRowid });
});

app.delete('/api/products/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.post('/api/orders', (req, res) => {
  const { product_id, customer_upi_id } = req.body;
  const result = db.prepare(`
    INSERT INTO orders (product_id, customer_upi_id)
    VALUES (?, ?)
  `).run(product_id, customer_upi_id);
  res.json({ id: result.lastInsertRowid, success: true });
});

app.get('/api/orders', authenticate, (req, res) => {
  const orders = db.prepare(`
    SELECT orders.*, products.title as product_title, products.price as product_price 
    FROM orders 
    LEFT JOIN products ON orders.product_id = products.id
    ORDER BY created_at DESC
  `).all();
  res.json(orders);
});

app.put('/api/orders/:id', authenticate, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

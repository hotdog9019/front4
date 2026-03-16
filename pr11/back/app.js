const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());

const port = Number(process.env.PORT) || 3000;
const ACCESS_SECRET = process.env.ACCESS_SECRET || 'dev_access_secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev_refresh_secret';
const ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';

const refreshTokens = new Set();
const roles = ['user', 'seller', 'admin'];

let users = [];
let products = [];
let nextUserId = 1;
let nextProductId = 1;

const corsAllowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next();

  const allowAny = corsAllowedOrigins.length === 0;
  const isAllowed = allowAny || corsAllowedOrigins.includes(origin);

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', allowAny ? '*' : origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(isAllowed ? 204 : 403);
  }

  return next();
});

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    blocked: user.blocked,
  };
}

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

function findUserById(id) {
  return users.find((u) => u.id === id);
}

function findUserByEmail(email) {
  return users.find((u) => u.email === email);
}

function requireBodyFields(body, fields) {
  for (const field of fields) {
    if (!body[field]) return field;
  }
  return null;
}

function validateRole(value) {
  return roles.includes(value);
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  let payload;
  try {
    payload = jwt.verify(token, ACCESS_SECRET);
  } catch (_e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = findUserById(String(payload.sub));
  if (!user || user.blocked) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.auth = payload;
  req.currentUser = user;
  return next();
}

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.currentUser || !allowedRoles.includes(req.currentUser.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  };
}

function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
  const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
  const adminLastName = process.env.ADMIN_LAST_NAME || 'Admin';

  if (findUserByEmail(adminEmail)) return;

  const user = {
    id: String(nextUserId++),
    email: adminEmail,
    first_name: adminFirstName,
    last_name: adminLastName,
    passwordHash: bcrypt.hashSync(adminPassword, 10),
    role: 'admin',
    blocked: false,
  };

  users.push(user);
}

seedAdmin();

app.post('/api/auth/register', async (req, res) => {
  const missing = requireBodyFields(req.body || {}, ['email', 'first_name', 'last_name', 'password']);
  if (missing) return res.status(400).json({ error: `${missing} is required` });

  const email = String(req.body.email).trim().toLowerCase();
  const first_name = String(req.body.first_name).trim();
  const last_name = String(req.body.last_name).trim();
  const password = String(req.body.password);

  if (password.length < 6) return res.status(400).json({ error: 'password must be at least 6 characters' });
  if (findUserByEmail(email)) return res.status(409).json({ error: 'email already exists' });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    id: String(nextUserId++),
    email,
    first_name,
    last_name,
    passwordHash,
    role: 'user',
    blocked: false,
  };

  users.push(user);
  return res.status(201).json(toPublicUser(user));
});

app.post('/api/auth/login', async (req, res) => {
  const missing = requireBodyFields(req.body || {}, ['email', 'password']);
  if (missing) return res.status(400).json({ error: `${missing} is required` });

  const email = String(req.body.email).trim().toLowerCase();
  const password = String(req.body.password);

  const user = findUserByEmail(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.blocked) return res.status(403).json({ error: 'User is blocked' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  refreshTokens.add(refreshToken);

  return res.json({ accessToken, refreshToken });
});

app.post('/api/auth/refresh', (req, res) => {
  const missing = requireBodyFields(req.body || {}, ['refreshToken']);
  if (missing) return res.status(400).json({ error: `${missing} is required` });

  const token = String(req.body.refreshToken);
  if (!refreshTokens.has(token)) return res.status(401).json({ error: 'Invalid refresh token' });

  let payload;
  try {
    payload = jwt.verify(token, REFRESH_SECRET);
  } catch (_e) {
    refreshTokens.delete(token);
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  const user = findUserById(String(payload.sub));
  if (!user || user.blocked) {
    refreshTokens.delete(token);
    return res.status(401).json({ error: 'User not found' });
  }

  refreshTokens.delete(token);
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  refreshTokens.add(refreshToken);

  return res.json({ accessToken, refreshToken });
});

app.get('/api/auth/me', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (req, res) => {
  return res.json(toPublicUser(req.currentUser));
});

app.get('/api/users', authMiddleware, roleMiddleware(['admin']), (_req, res) => {
  return res.json(users.map(toPublicUser));
});

app.get('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const user = findUserById(String(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(toPublicUser(user));
});

app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const user = findUserById(String(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });

  const patch = req.body || {};
  const next = { ...user };

  if (patch.email != null) next.email = String(patch.email).trim().toLowerCase();
  if (patch.first_name != null) next.first_name = String(patch.first_name).trim();
  if (patch.last_name != null) next.last_name = String(patch.last_name).trim();
  if (patch.role != null) {
    const role = String(patch.role);
    if (!validateRole(role)) return res.status(400).json({ error: 'Invalid role' });
    next.role = role;
  }
  if (patch.blocked != null) next.blocked = Boolean(patch.blocked);

  const emailOwner = users.find((u) => u.email === next.email && u.id !== user.id);
  if (emailOwner) return res.status(409).json({ error: 'email already exists' });

  users = users.map((u) => (u.id === user.id ? next : u));
  return res.json(toPublicUser(next));
});

app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const user = findUserById(String(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });

  const next = { ...user, blocked: true };
  users = users.map((u) => (u.id === user.id ? next : u));
  return res.json(toPublicUser(next));
});

app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
  const missing = requireBodyFields(req.body || {}, ['title', 'category', 'price']);
  if (missing) return res.status(400).json({ error: `${missing} is required` });

  const title = String(req.body.title).trim();
  const category = String(req.body.category).trim();
  const price = Number(req.body.price);
  const description = req.body.description == null ? '' : String(req.body.description);

  if (!Number.isFinite(price)) return res.status(400).json({ error: 'price must be a number' });

  const product = {
    id: String(nextProductId++),
    title,
    category,
    price,
    description,
  };

  products.push(product);
  return res.status(201).json(product);
});

app.get('/api/products', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (_req, res) => {
  return res.json(products);
});

app.get('/api/products/:id', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (req, res) => {
  const product = products.find((p) => p.id === String(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  return res.json(product);
});

app.put('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
  const idx = products.findIndex((p) => p.id === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  const current = products[idx];
  const patch = req.body || {};
  const next = { ...current };

  if (patch.title != null) next.title = String(patch.title).trim();
  if (patch.category != null) next.category = String(patch.category).trim();
  if (patch.description != null) next.description = String(patch.description);
  if (patch.price != null) {
    const price = Number(patch.price);
    if (!Number.isFinite(price)) return res.status(400).json({ error: 'price must be a number' });
    next.price = price;
  }

  products = products.map((p) => (p.id === next.id ? next : p));
  return res.json(next);
});

app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const idx = products.findIndex((p) => p.id === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  const deleted = products[idx];
  products = products.filter((p) => p.id !== deleted.id);
  return res.json(deleted);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createClient } = require("redis");

require("dotenv").config();

const app = express();
app.use(express.json());

const port = Number(process.env.PORT) || 3000;
const ACCESS_SECRET = process.env.ACCESS_SECRET || "dev_access_secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "dev_refresh_secret";
const ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || "7d";
const REDIS_DISABLED = String(process.env.REDIS_DISABLED || "false").toLowerCase() === "true";

const USERS_CACHE_TTL = 60;
const PRODUCTS_CACHE_TTL = 600;

const refreshTokens = new Set();
const roles = ["user", "seller", "admin"];

let users = [];
let products = [];
let nextUserId = 1;
let nextProductId = 1;
let redisReady = false;

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});

redisClient.on("error", (error) => {
  console.error("Redis error:", error.message);
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
  return users.find((user) => user.id === id);
}

function findUserByEmail(email) {
  return users.find((user) => user.email === email);
}

function findProductById(id) {
  return products.find((product) => product.id === id);
}

function requireBodyFields(body, fields) {
  for (const field of fields) {
    if (!body[field]) {
      return field;
    }
  }
  return null;
}

function validateRole(value) {
  return roles.includes(value);
}

async function getCachedValue(key) {
  if (!redisReady) {
    return null;
  }

  try {
    return await redisClient.get(key);
  } catch (error) {
    console.error("Cache read error:", error.message);
    return null;
  }
}

async function saveToCache(key, data, ttl) {
  if (!redisReady) {
    return;
  }

  try {
    await redisClient.set(key, JSON.stringify(data), { EX: ttl });
  } catch (error) {
    console.error("Cache write error:", error.message);
  }
}

async function invalidateCache(keys) {
  if (!redisReady || keys.length === 0) {
    return;
  }

  try {
    await redisClient.del(...keys);
  } catch (error) {
    console.error("Cache invalidate error:", error.message);
  }
}

async function invalidateUsersCache(userId = null) {
  const keys = ["users:all"];
  if (userId) {
    keys.push(`users:${userId}`);
  }
  await invalidateCache(keys);
}

async function invalidateProductsCache(productId = null) {
  const keys = ["products:all"];
  if (productId) {
    keys.push(`products:${productId}`);
  }
  await invalidateCache(keys);
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  let payload;
  try {
    payload = jwt.verify(token, ACCESS_SECRET);
  } catch (_error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const user = findUserById(String(payload.sub));
  if (!user || user.blocked) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.auth = payload;
  req.currentUser = user;
  return next();
}

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.currentUser || !allowedRoles.includes(req.currentUser.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  };
}

function cacheMiddleware(keyBuilder, ttl) {
  return async (req, res, next) => {
    const cacheKey = keyBuilder(req);
    const cached = await getCachedValue(cacheKey);

    if (cached) {
      return res.json({
        source: "cache",
        data: JSON.parse(cached),
      });
    }

    req.cacheKey = cacheKey;
    req.cacheTTL = ttl;
    return next();
  };
}

function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminFirstName = process.env.ADMIN_FIRST_NAME || "Admin";
  const adminLastName = process.env.ADMIN_LAST_NAME || "User";

  if (findUserByEmail(adminEmail)) {
    return;
  }

  users.push({
    id: String(nextUserId++),
    email: adminEmail,
    first_name: adminFirstName,
    last_name: adminLastName,
    passwordHash: bcrypt.hashSync(adminPassword, 10),
    role: "admin",
    blocked: false,
  });
}

function seedProducts() {
  products.push(
    {
      id: String(nextProductId++),
      title: "Ноутбук",
      category: "electronics",
      price: 75000,
      description: "Игровой ноутбук",
    },
    {
      id: String(nextProductId++),
      title: "Наушники",
      category: "electronics",
      price: 8900,
      description: "Беспроводные наушники",
    }
  );
}

seedAdmin();
seedProducts();

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    redis: redisReady ? "connected" : "disabled_or_unavailable",
  });
});

app.post("/api/auth/register", async (req, res) => {
  const missing = requireBodyFields(req.body || {}, ["email", "first_name", "last_name", "password"]);
  if (missing) {
    return res.status(400).json({ error: `${missing} is required` });
  }

  const email = String(req.body.email).trim().toLowerCase();
  const first_name = String(req.body.first_name).trim();
  const last_name = String(req.body.last_name).trim();
  const password = String(req.body.password);

  if (password.length < 6) {
    return res.status(400).json({ error: "password must be at least 6 characters" });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ error: "email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: String(nextUserId++),
    email,
    first_name,
    last_name,
    passwordHash,
    role: "user",
    blocked: false,
  };

  users.push(user);
  await invalidateUsersCache();
  return res.status(201).json(toPublicUser(user));
});

app.post("/api/auth/login", async (req, res) => {
  const missing = requireBodyFields(req.body || {}, ["email", "password"]);
  if (missing) {
    return res.status(400).json({ error: `${missing} is required` });
  }

  const email = String(req.body.email).trim().toLowerCase();
  const password = String(req.body.password);

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (user.blocked) {
    return res.status(403).json({ error: "User is blocked" });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  refreshTokens.add(refreshToken);

  return res.json({ accessToken, refreshToken });
});

app.post("/api/auth/refresh", (req, res) => {
  const missing = requireBodyFields(req.body || {}, ["refreshToken"]);
  if (missing) {
    return res.status(400).json({ error: `${missing} is required` });
  }

  const token = String(req.body.refreshToken);
  if (!refreshTokens.has(token)) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  let payload;
  try {
    payload = jwt.verify(token, REFRESH_SECRET);
  } catch (_error) {
    refreshTokens.delete(token);
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  const user = findUserById(String(payload.sub));
  if (!user || user.blocked) {
    refreshTokens.delete(token);
    return res.status(401).json({ error: "User not found" });
  }

  refreshTokens.delete(token);
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  refreshTokens.add(refreshToken);

  return res.json({ accessToken, refreshToken });
});

app.get("/api/auth/me", authMiddleware, roleMiddleware(["user", "seller", "admin"]), (req, res) => {
  return res.json(toPublicUser(req.currentUser));
});

app.get(
  "/api/users",
  authMiddleware,
  roleMiddleware(["admin"]),
  cacheMiddleware(() => "users:all", USERS_CACHE_TTL),
  async (req, res) => {
    const data = users.map(toPublicUser);
    await saveToCache(req.cacheKey, data, req.cacheTTL);

    return res.json({
      source: "server",
      data,
    });
  }
);

app.get(
  "/api/users/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  cacheMiddleware((req) => `users:${req.params.id}`, USERS_CACHE_TTL),
  async (req, res) => {
    const user = findUserById(String(req.params.id));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const data = toPublicUser(user);
    await saveToCache(req.cacheKey, data, req.cacheTTL);

    return res.json({
      source: "server",
      data,
    });
  }
);

app.put("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  const user = findUserById(String(req.params.id));
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const patch = req.body || {};
  const nextUser = { ...user };

  if (patch.email != null) {
    nextUser.email = String(patch.email).trim().toLowerCase();
  }
  if (patch.first_name != null) {
    nextUser.first_name = String(patch.first_name).trim();
  }
  if (patch.last_name != null) {
    nextUser.last_name = String(patch.last_name).trim();
  }
  if (patch.role != null) {
    const role = String(patch.role);
    if (!validateRole(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    nextUser.role = role;
  }
  if (patch.blocked != null) {
    nextUser.blocked = Boolean(patch.blocked);
  }

  const emailOwner = users.find((item) => item.email === nextUser.email && item.id !== user.id);
  if (emailOwner) {
    return res.status(409).json({ error: "email already exists" });
  }

  users = users.map((item) => (item.id === user.id ? nextUser : item));
  await invalidateUsersCache(user.id);
  return res.json(toPublicUser(nextUser));
});

app.delete("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  const user = findUserById(String(req.params.id));
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const nextUser = { ...user, blocked: true };
  users = users.map((item) => (item.id === user.id ? nextUser : item));
  await invalidateUsersCache(user.id);
  return res.json(toPublicUser(nextUser));
});

app.post("/api/products", authMiddleware, roleMiddleware(["seller", "admin"]), async (req, res) => {
  const missing = requireBodyFields(req.body || {}, ["title", "category", "price"]);
  if (missing) {
    return res.status(400).json({ error: `${missing} is required` });
  }

  const title = String(req.body.title).trim();
  const category = String(req.body.category).trim();
  const price = Number(req.body.price);
  const description = req.body.description == null ? "" : String(req.body.description);

  if (!Number.isFinite(price)) {
    return res.status(400).json({ error: "price must be a number" });
  }

  const product = {
    id: String(nextProductId++),
    title,
    category,
    price,
    description,
  };

  products.push(product);
  await invalidateProductsCache();
  return res.status(201).json(product);
});

app.get(
  "/api/products",
  authMiddleware,
  roleMiddleware(["user", "seller", "admin"]),
  cacheMiddleware(() => "products:all", PRODUCTS_CACHE_TTL),
  async (req, res) => {
    const data = [...products];
    await saveToCache(req.cacheKey, data, req.cacheTTL);

    return res.json({
      source: "server",
      data,
    });
  }
);

app.get(
  "/api/products/:id",
  authMiddleware,
  roleMiddleware(["user", "seller", "admin"]),
  cacheMiddleware((req) => `products:${req.params.id}`, PRODUCTS_CACHE_TTL),
  async (req, res) => {
    const product = findProductById(String(req.params.id));
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    await saveToCache(req.cacheKey, product, req.cacheTTL);
    return res.json({
      source: "server",
      data: product,
    });
  }
);

app.put("/api/products/:id", authMiddleware, roleMiddleware(["seller", "admin"]), async (req, res) => {
  const index = products.findIndex((product) => product.id === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  const current = products[index];
  const patch = req.body || {};
  const nextProduct = { ...current };

  if (patch.title != null) {
    nextProduct.title = String(patch.title).trim();
  }
  if (patch.category != null) {
    nextProduct.category = String(patch.category).trim();
  }
  if (patch.description != null) {
    nextProduct.description = String(patch.description);
  }
  if (patch.price != null) {
    const price = Number(patch.price);
    if (!Number.isFinite(price)) {
      return res.status(400).json({ error: "price must be a number" });
    }
    nextProduct.price = price;
  }

  products = products.map((product) => (product.id === nextProduct.id ? nextProduct : product));
  await invalidateProductsCache(nextProduct.id);
  return res.json(nextProduct);
});

app.delete("/api/products/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  const product = findProductById(String(req.params.id));
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  products = products.filter((item) => item.id !== product.id);
  await invalidateProductsCache(product.id);
  return res.json(product);
});

async function initRedis() {
  if (REDIS_DISABLED) {
    console.log("Redis is disabled by REDIS_DISABLED=true");
    return;
  }

  try {
    await redisClient.connect();
    redisReady = true;
    console.log("Redis connected");
  } catch (error) {
    console.warn(`Redis unavailable, server will continue without cache: ${error.message}`);
  }
}

async function bootstrap() {
  await initRedis();
  app.listen(port, () => {
    console.log(`PR21 server is running on http://localhost:${port}`);
  });
}

bootstrap();

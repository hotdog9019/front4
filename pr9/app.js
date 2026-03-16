const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const ACCESS_SECRET = process.env.ACCESS_SECRET || 'dev_access_secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev_refresh_secret';
const ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';
const refreshTokens = new Set();

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Practice 09 API',
            version: '1.0.0',
            description: 'API с JWT-аутентификацией, refresh-токенами и управлением товарами',
        },
        servers: [
            { url: `http://localhost:${port}`, description: 'Локальный сервер' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./app.js'],
};

let users = [];
let products = [];
let currentUserId = 1;
let currentProductId = 1;

app.use(express.json());
async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}
function generateAccessToken(user) {
    return jwt.sign(
        { userId: user.id, email: user.email },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        { userId: user.id, email: user.email },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, ACCESS_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired' });
            }
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
}

function findUserByEmail(email) {
    return users.find(u => u.email === email);
}

function findUserById(id) {
    return users.find(u => u.id === id);
}

function findUserOr404(email, res) {
    const user = findUserByEmail(email);
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return null;
    }
    return user;
}

function findProductOr404(id, res) {
    const product = products.find(p => p.id === id);
    if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
    }
    return product;
}

app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    });
    next();
});

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, first_name, last_name, password]
 *             properties:
 *               email: { type: string, format: email, example: ivan@example.com }
 *               first_name: { type: string, example: Иван }
 *               last_name: { type: string, example: Иванов }
 *               password: { type: string, minLength: 6, example: qwerty123 }
 *     responses:
 *       201:
 *         description: Пользователь создан
 *       400:
 *         description: Ошибка валидации или пользователь существует
 */
app.post("/api/auth/register", async (req, res) => {
    try {
        const { email, first_name, last_name, password } = req.body;

        if (!email || !first_name || !last_name || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        if (findUserByEmail(email)) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await hashPassword(password);
        const newUser = {
            id: currentUserId++,
            email,
            first_name,
            last_name,
            password: hashedPassword
        };

        users.push(newUser);
        const { password: _, ...userWithoutPassword } = newUser;
        
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему с выдачей JWT-токенов
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string, description: "Access JWT токен" }
 *                 refreshToken: { type: string, description: "Refresh JWT токен" }
 *       401:
 *         description: Неверные учётные данные
 */
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "email and password are required" });
        }

        const user = findUserOr404(email, res);
        if (!user) return;

        const isValid = await verifyPassword(password, user.password);
        
        if (isValid) {
            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);
            
            refreshTokens.add(refreshToken);
            
            const { password: _, ...userWithoutPassword } = user;
            
            res.status(200).json({
                accessToken,
                refreshToken
            });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление пары access/refresh токенов
 *     description: Принимает валидный refresh-токен и возвращает новую пару токенов. Старый refresh-токен удаляется (ротация).
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string, description: "Refresh токен для обновления" }
 *     responses:
 *       200:
 *         description: Токены успешно обновлены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *                 refreshToken: { type: string }
 *       400:
 *         description: Refresh token не предоставлен
 *       401:
 *         description: Недействительный или истёкший refresh token
 */
app.post("/api/auth/refresh", (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: "refreshToken is required" });
    }

    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({ error: "Invalid refresh token" });
    }

    try {

        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
        
        const user = findUserById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }
        refreshTokens.delete(refreshToken);
        
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        
        refreshTokens.add(newRefreshToken);

        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (err) {
        console.error('Refresh token error:', err);
        refreshTokens.delete(refreshToken);
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить данные текущего пользователя
 *     description: Защищённый маршрут, требует JWT access-токен
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer }
 *                 email: { type: string }
 *                 first_name: { type: string }
 *                 last_name: { type: string }
 *       401:
 *         description: Токен отсутствует или недействителен
 */
app.get("/api/auth/me", authenticateToken, (req, res) => {
    const user = findUserById(req.user.userId);
    
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар (публичный)
 *     tags: [Products]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category, price]
 *             properties:
 *               title: { type: string }
 *               category: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *     responses:
 *       201:
 *         description: Товар создан
 */
app.post("/api/products", (req, res) => {
    const { title, category, description, price } = req.body;

    if (!title || !category || price === undefined) {
        return res.status(400).json({ error: "title, category and price are required" });
    }

    const newProduct = {
        id: currentProductId++,
        title,
        category,
        description: description || '',
        price: Number(price)
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров (публичный)
 *     tags: [Products]
 *     security: []
 *     responses:
 *       200:
 *         description: Список товаров
 */
app.get("/api/products", (req, res) => {
    res.status(200).json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID (защищено)
 *     description: Требует JWT access-токен
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Товар найден
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Товар не найден
 */
app.get("/api/products/:id", authenticateToken, (req, res) => {
    const id = Number(req.params.id);
    const product = findProductOr404(id, res);
    if (product) {
        res.status(200).json(product);
    }
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар (защищено)
 *     description: Требует JWT access-токен
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category, price]
 *     responses:
 *       200:
 *         description: Товар обновлён
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Товар не найден
 */
app.put("/api/products/:id", authenticateToken, (req, res) => {
    const id = Number(req.params.id);
    const product = findProductOr404(id, res);
    
    if (!product) return;

    const { title, category, description, price } = req.body;

    if (!title || !category || price === undefined) {
        return res.status(400).json({ error: "title, category and price are required" });
    }

    product.title = title;
    product.category = category;
    product.description = description || '';
    product.price = Number(price);

    res.status(200).json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар (защищено)
 *     description: Требует JWT access-токен
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Товар удалён
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Товар не найден
 */
app.delete("/api/products/:id", authenticateToken, (req, res) => {
    const id = Number(req.params.id);
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: "Product not found" });
    }

    products.splice(index, 1);
    res.status(200).json({ message: "Product deleted" });
});

app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

app.listen(port, () => {
    console.log(`Сервер запущен: http://localhost:${port}`);
    console.log(` Swagger UI: http://localhost:${port}/api-docs`);
    console.log(`ACCESS_EXPIRES_IN: ${ACCESS_EXPIRES_IN}, REFRESH_EXPIRES_IN: ${REFRESH_EXPIRES_IN}`);
});
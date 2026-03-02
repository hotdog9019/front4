const express = require('express');
const bcrypt = require('bcrypt');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Practice 07 API',
            version: '1.0.0',
            description: 'API с аутентификацией и управлением товарами',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер',
            },
        ],
    },
    apis: ['./app.js'],
};


let users = [];
let products = [];
let currentUserId = 1;
let currentProductId = 1;


app.use(express.json());

async function hashPassword(password) {
    const rounds = 10;
    return bcrypt.hash(password, rounds);
}

async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}


function findUserByEmail(email) {
    return users.find(u => u.email === email);
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
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            console.log('Body:', req.body);
        }
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
 *     description: Создает нового пользователя с хешированным паролем
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - first_name
 *               - last_name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ivan@example.com
 *               first_name:
 *                 type: string
 *                 example: Иван
 *               last_name:
 *                 type: string
 *                 example: Иванов
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: qwerty123
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 email:
 *                   type: string
 *                   example: ivan@example.com
 *                 first_name:
 *                   type: string
 *                   example: Иван
 *                 last_name:
 *                   type: string
 *                   example: Иванов
 *       400:
 *         description: Некорректные данные или пользователь уже существует
 *       500:
 *         description: Ошибка сервера
 */
app.post("/api/auth/register", async (req, res) => {
    try {
        const { email, first_name, last_name, password } = req.body;
        if (!email || !first_name || !last_name || !password) {
            return res.status(400).json({ 
                error: "email, first_name, last_name and password are required" 
            });
        }
        const existingUser = findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: "User with this email already exists" });
        }
        const hashedPassword = await hashPassword(password);
        const newUser = {
            id: currentUserId++,
            email: email,
            first_name: first_name,
            last_name: last_name,
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
 *     summary: Вход в систему
 *     description: Проверяет email и пароль пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ivan@example.com
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 login:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *       400:
 *         description: Отсутствуют обязательные поля
 *       401:
 *         description: Неверные учетные данные
 *       404:
 *         description: Пользователь не найден
 */
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "email and password are required" });
        }
        const user = findUserOr404(email, res);
        if (!user) return;
        const isAuthenticated = await verifyPassword(password, user.password);
        
        if (isAuthenticated) {
            const { password: _, ...userWithoutPassword } = user;
            res.status(200).json({ 
                login: true,
                user: userWithoutPassword 
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
 * /api/products:
 *   post:
 *     summary: Создать товар
 *     description: Создает новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 example: Смартфон
 *               category:
 *                 type: string
 *                 example: Электроника
 *               description:
 *                 type: string
 *                 example: Современный смартфон с отличной камерой
 *               price:
 *                 type: number
 *                 example: 29999.99
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 title:
 *                   type: string
 *                 category:
 *                   type: string
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *       400:
 *         description: Некорректные данные
 */
app.post("/api/products", (req, res) => {
    const { title, category, description, price } = req.body;
    if (!title || !category || price === undefined) {
        return res.status(400).json({ 
            error: "title, category and price are required" 
        });
    }

    const newProduct = {
        id: currentProductId++,
        title: title,
        category: category,
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
 *     summary: Получить список товаров
 *     description: Возвращает список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   category:
 *                     type: string
 *                   description:
 *                     type: string
 *                   price:
 *                     type: number
 */
app.get("/api/products", (req, res) => {
    res.status(200).json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     description: Возвращает товар по его идентификатору
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Товар найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 category:
 *                   type: string
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *       404:
 *         description: Товар не найден
 */
app.get("/api/products/:id", (req, res) => {
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
 *     summary: Обновить товар
 *     description: Полностью обновляет параметры товара по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Товар обновлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Некорректные данные
 *       404:
 *         description: Товар не найден
 */
app.put("/api/products/:id", (req, res) => {
    const id = Number(req.params.id);
    const product = findProductOr404(id, res);
    
    if (!product) return;

    const { title, category, description, price } = req.body;
    if (!title || !category || price === undefined) {
        return res.status(400).json({ 
            error: "title, category and price are required" 
        });
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
 *     summary: Удалить товар
 *     description: Удаляет товар по его идентификатору
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Товар успешно удален
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Product deleted
 *       404:
 *         description: Товар не найден
 */
app.delete("/api/products/:id", (req, res) => {
    const id = Number(req.params.id);
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: "Product not found" });
    }

    products.splice(index, 1);
    res.status(200).json({ message: "Product deleted" });
});
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`Swagger UI доступен по адресу http://localhost:${port}/api-docs`);
});
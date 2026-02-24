const express = require('express');
const { nanoid } = require('nanoid');
const cors = require("cors");

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

app.use(cors({
  origin: "http://localhost:3001",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Middleware для парсинга JSON
app.use(express.json());

// Middleware для логирования запросов
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            console.log('Body:', req.body);
        }
    });
    next();
});

let users = [
    {id: nanoid(6), name: 'Булочка с сосиской', age: 250, text: "Вкусная булочка с сосиской внутри. Идеально подходит для быстрого перекуса."},
    {id: nanoid(6), name: 'Пицца', age: 700, text: "Большая пицца с сыром, томатным соусом и различными начинками. Отличный выбор для компании."},
    {id: nanoid(6), name: 'Креветка', age: 200, text: "Свежая креветка, приготовленная на гриле. Идеально подходит для любителей морепродуктов."},
    {id: nanoid(6), name: 'Борщ', age: 800, text: "Традиционный русский суп из свеклы, с капустой, картофелем и мясом. Подается со сметаной и укропом."},
    {id: nanoid(6), name: 'Подлива', age: 1200, text: "Соус для блюд, приготовленный из различных ингредиентов. Идеально подходит для гарниров."},
    {id: nanoid(6), name: 'Футболка драгон мани', age: 1500, text: "Уникальная футболка с дизайном дракона. Идеально для коллекционеров."},
    {id: nanoid(6), name: 'Буся', age: 15, text: "Традиционное русское блюдо из круп и молочных продуктов. Легко готовится и вкусно."},
    {id: nanoid(6), name: 'Часы', age: 1800, text: "Качественные часы с циферблатом и браслетом. Подходят как для повседневного ношения, так и для особых случаев."},
    {id: nanoid(6), name: 'Айфон 14', age: 29000, text: "Современный смартфон Apple с отличной камерой и мощным процессором."},
    {id: nanoid(6), name: 'Бургер', age: 180, text: "Классический бургер с котлетой, овощами и соусом. Идеальное блюдо для перекуса."},
];

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - age
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный идентификатор (генерируется автоматически)
 *           example: "aBcDeF"
 *         name:
 *           type: string
 *           description: Название товара или имя пользователя
 *           example: "Пицца"
 *         age:
 *           type: integer
 *           description: Цена в рублях (условное поле "age")
 *           example: 700
 *         text:
 *           type: string
 *           description: Описание товара (опционально, может отсутствовать в ответе POST)
 *           example: "Большая пицца с сыром"
 *       example:
 *         id: "aBcDeF"
 *         name: "Пицца"
 *         age: 700
 *         text: "Большая пицца с сыром, томатным соусом и различными начинками."
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: CRUD-операции с пользователями/товарами
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список всех пользователей
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Успешный ответ со списком пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Создать нового пользователя
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - age
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Шаурма"
 *               age:
 *                 type: integer
 *                 example: 150
 *               text:
 *                 type: string
 *                 example: "Вкусная шаурма с курицей"
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Ошибка валидации входных данных
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Уникальный ID пользователя
 *         example: "aBcDeF"
 *     responses:
 *       200:
 *         description: Пользователь найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Частично обновить пользователя по ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Уникальный ID пользователя
 *         example: "aBcDeF"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Обновлённая Пицца"
 *               age:
 *                 type: integer
 *                 example: 750
 *               text:
 *                 type: string
 *                 example: "Обновлённое описание"
 *     responses:
 *       200:
 *         description: Пользователь успешно обновлён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Нет полей для обновления
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Удалить пользователя по ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Уникальный ID пользователя
 *         example: "aBcDeF"
 *     responses:
 *       204:
 *         description: Пользователь успешно удалён (без тела ответа)
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */

// Настройка Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Users API',
            version: '1.0.0',
            description: 'API для управления пользователями/товарами с поддержкой CRUD-операций',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер разработки',
            },
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
        // security: [{ bearerAuth: [] }], // Раскомментируйте, если нужна авторизация
    },
    apis: [__filename], // Парсит JSDoc-аннотации из этого файла
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Подключение Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    swaggerOptions: {
        filter: true,
        showRequestDuration: true,
    },
}));

// Функция-помощник для получения пользователя из списка
function findUserOr404(id, res) {
    const user = users.find(u => u.id == id);
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return null;
    }
    return user;
}

// POST /api/users
app.post("/api/users", (req, res) => {
    const { name, age } = req.body;

    const newUser = {
        id: nanoid(6),
        name: name?.trim(),
        age: Number(age),
    };

    users.push(newUser);
    res.status(201).json(newUser);
});

// GET /api/users
app.get("/api/users", (req, res) => {
    res.json(users);
});

// GET /api/users/:id
app.get("/api/users/:id", (req, res) => {
    const id = req.params.id;
    const user = findUserOr404(id, res);
    if (!user) return;
    res.json(user);
});

// PATCH /api/users/:id
app.patch("/api/users/:id", (req, res) => {
    const id = req.params.id;
    const user = findUserOr404(id, res);
    if (!user) return;

    if (req.body?.name === undefined && req.body?.age === undefined) {
        return res.status(400).json({ error: "Nothing to update" });
    }

    const { name, age } = req.body;
    if (name !== undefined) user.name = name.trim();
    if (age !== undefined) user.age = Number(age);

    res.json(user);
});

// DELETE /api/users/:id
app.delete("/api/users/:id", (req, res) => {
    const id = req.params.id;
    const exists = users.some((u) => u.id === id);
    if (!exists) return res.status(404).json({ error: "User not found" });

    users = users.filter((u) => u.id !== id);
    res.status(204).send();
});

// 404 для всех остальных маршрутов
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`Swagger-документация доступна по адресу http://localhost:${port}/api-docs`);
});
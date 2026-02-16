const express = require('express');
const { nanoid } = require('nanoid');
const cors = require("cors");

const app = express();
const port = 3333;

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
]


// CORS для связи с фронтендом
app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware для парсинга JSON
app.use(express.json());
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

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

// Функция-помощник для получения пользователя из списка
function findUserOr404(id, res) {
    const user = users.find(u => u.id == id);
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return null;
    }
    return user;
}

// Функция-помощник 

// POST /api/users
app.post("/api/users", (req, res) => {
    const { name, age, text } = req.body;

    const newUser = {
        id: nanoid(6),
        name: name.trim(),
        age: Number(age),
        text: text.trim(),
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

    // Нельзя PATCH без полей
    if (req.body?.name === undefined && req.body?.age === undefined) {
        return res.status(400).json({
            error: "Nothing to update",
        });
    }

    const { name, age, text } = req.body;

    if (name !== undefined) user.name = name.trim();
    if (age !== undefined) user.age = Number(age);
    if (text !== undefined) user.text = text.trim();
    res.json(user);
});

// DELETE /api/users/:id
app.delete("/api/users/:id", (req, res) => {
    const id = req.params.id;

    const exists = users.some((u) => u.id === id);
    if (!exists) return res.status(404).json({ error: "User not found" });

    users = users.filter((u) => u.id !== id);

    // Правильнее 204 без тела
    res.status(204).send();
});

// 404 для всех остальных маршрутов
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// Глобальный обработчик ошибок (чтобы сервер не падал)
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});

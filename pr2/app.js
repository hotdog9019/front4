const express = require('express');
const app = express();
const port = 3000;
let products = [
    { id: 1, name: '5 по английскому', price: 50000 },
    { id: 2, name: 'бургер в юнифуде', price: 209 },
    { id: 3, name: 'Клавиатура в вузе', price: 300 }
];
app.use(express.json());
app.get('/', (req, res) => {
    res.send('API для управления товарами. Используйте /products');
});
app.get('/products', (req, res) => {
    res.json(products);
});

app.get('/products/:id', (req, res) => {
    const id = Number(req.params.id);
    const product = products.find(p => p.id === id);

    if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
    }

    res.json(product);
});
app.post('/products', (req, res) => {
    const { name, price } = req.body;
    if (!name || typeof price !== 'number' || price < 0) {
        return res.status(400).json({
            error: 'Неверные данные: требуется name (строка) и price (неотрицательное число)'
        });
    }
    const newProduct = {
        id: Date.now(), 
        name,
        price
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});
app.put('/products/:id', (req, res) => {
    const id = Number(req.params.id);
    const { name, price } = req.body;
    if (!name || typeof price !== 'number' || price < 0) {
        return res.status(400).json({
            error: 'Неверные данные: требуется name (строка) и price (неотрицательное число)'
        });
    }

    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Товар не найден' });
    }

    products[index] = { id, name, price };
    res.json(products[index]);
});
app.delete('/products/:id', (req, res) => {
    const id = Number(req.params.id);
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Товар не найден' });
    }

    const deletedProduct = products.splice(index, 1)[0];
    res.json(deletedProduct);
});
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
# Практика 21

Доработка приложения из практики 11: добавлено кэширование через `Redis` для маршрутов чтения пользователей и товаров.

## Что сделано

- аутентификация и RBAC на `JWT`;
- Redis-клиент через пакет `redis`;
- кэширование маршрутов:
  - `GET /api/users` на 1 минуту
  - `GET /api/users/:id` на 1 минуту
  - `GET /api/products` на 10 минут
  - `GET /api/products/:id` на 10 минут
- очистка кэша после:
  - регистрации пользователя
  - изменения или блокировки пользователя
  - создания, изменения и удаления товара

При попадании в кэш ответ приходит в формате:

```json
{
  "source": "cache",
  "data": []
}
```

При чтении без кэша:

```json
{
  "source": "server",
  "data": []
}
```

## Запуск

```powershell
npm install
Copy-Item .env.example .env
docker run -d --name redis-pr21 -p 6379:6379 redis
npm start
```

Стартовый администратор задается через `.env`, по умолчанию:

- `email`: `admin@example.com`
- `password`: `admin123`

## Основные маршруты

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `GET /api/users`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `POST /api/products`
- `GET /api/products`
- `GET /api/products/:id`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

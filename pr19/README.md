# Практика 19

CRUD API для сущности `Пользователь` на `Express` и `PostgreSQL`.

## Что сделано

- подключение к PostgreSQL через `pg`;
- автоматическое создание таблицы `users` при запуске;
- маршруты:
  - `POST /api/users`
  - `GET /api/users`
  - `GET /api/users/:id`
  - `PATCH /api/users/:id`
  - `DELETE /api/users/:id`
- поля пользователя:
  - `id`
  - `first_name`
  - `last_name`
  - `age`
  - `created_at`
  - `updated_at`

`created_at` и `updated_at` хранятся в PostgreSQL как `TIMESTAMPTZ`, а в API возвращаются как Unix timestamp.

## Запуск

```powershell
npm install
Copy-Item .env.example .env
npm start
```

По умолчанию сервер стартует на `http://localhost:3000`.

## Пример запроса

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"first_name\":\"Иван\",\"last_name\":\"Иванов\",\"age\":20}"
```

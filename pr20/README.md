# Практика 20

CRUD API для сущности `Пользователь` на `Express` и `MongoDB` через `mongoose`.

## Что сделано

- подключение к MongoDB по `MONGODB_URI`;
- модель `User` c полями:
  - `first_name`
  - `last_name`
  - `age`
  - `created_at`
  - `updated_at`
- маршруты:
  - `POST /api/users`
  - `GET /api/users`
  - `GET /api/users/:id`
  - `PATCH /api/users/:id`
  - `DELETE /api/users/:id`

В базе `created_at` и `updated_at` сохраняются как даты, а наружу API отдает их как Unix timestamp.

## Запуск

```powershell
npm install
Copy-Item .env.example .env
npm start
```

## Пример запроса

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"first_name\":\"Анна\",\"last_name\":\"Петрова\",\"age\":21}"
```

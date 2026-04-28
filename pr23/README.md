# Практика 23

Продолжение практики 22, но уже в Docker: несколько backend-контейнеров на `Node.js`, балансировка через `Nginx` и запуск всего стека через `Docker Compose`.

## Что сделано

- три backend-сервиса на одном образе:
  - `backend1`
  - `backend2`
  - `backend3` как резервный
- `Dockerfile` для backend;
- `docker-compose.yml`, который поднимает весь стек;
- `nginx.conf` с балансировкой, `max_fails` и `fail_timeout`.

## Запуск

В среде WSL или Docker Desktop:

```bash
docker compose up --build
```

После старта балансировщик будет доступен на `http://localhost/`.

Проверка распределения:

```bash
curl http://localhost/
curl http://localhost/
curl http://localhost/
```

В JSON-ответах должен меняться `server`: обычно между `backend-1` и `backend-2`.

## Проверка отказоустойчивости

Остановите один из backend-контейнеров:

```bash
docker compose stop backend1
curl http://localhost/
curl http://localhost/
```

Nginx перестанет направлять запросы на остановленный контейнер и продолжит отдавать ответы через оставшиеся backend.

## Остановка

```bash
docker compose down
```

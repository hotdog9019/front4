# Практика 22

Тестовый стенд для балансировки нагрузки: три backend-сервера на `Express`, конфигурация `Nginx` и альтернативная конфигурация `HAProxy`.

## Что сделано

- backend `backend-1` на порту `3000`;
- backend `backend-2` на порту `3001`;
- резервный backend `backend-backup` на порту `3002`;
- конфиг `Nginx` с распределением запросов и параметрами:
  - `max_fails=2`
  - `fail_timeout=30s`
- конфиг `HAProxy` с `roundrobin` и `health check`.

## Запуск backend-серверов

Сначала установите зависимости:

```bash
npm install
```

Запустите три сервера в отдельных терминалах:

```bash
npm run start:backend1
npm run start:backend2
npm run start:backup
```

## Проверка через Nginx

В репозитории лежит готовый конфиг `nginx/nginx.conf`. Его можно подключить в WSL/Linux так:

```bash
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl reload nginx
```

После этого балансировщик будет доступен на `http://localhost:8080`.

Проверка:

```bash
curl http://localhost:8080/
curl http://localhost:8080/
curl http://localhost:8080/
```

В ответах должен меняться `server`, например `backend-1` и `backend-2`. Если один из основных серверов недоступен, Nginx перестанет слать на него трафик и сможет использовать резервный `backend-backup`.

## Проверка через HAProxy

Подключите конфиг `haproxy/haproxy.cfg`:

```bash
sudo cp haproxy/haproxy.cfg /etc/haproxy/haproxy.cfg
sudo haproxy -c -f /etc/haproxy/haproxy.cfg
sudo systemctl restart haproxy
```

После этого HAProxy будет доступен на `http://localhost:8081`.

```bash
curl http://localhost:8081/
```

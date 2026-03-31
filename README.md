# front4
Практические работы по дисциплине «Фронтенд и бэкенд разработка».

## Структура
- `pr13/notes-app` — базовое приложение заметок (localStorage + SW)
- `pr14/notes-app` — PWA manifest + офлайн‑кэширование
- `pr15/notes-app` — HTTPS + App Shell (динамический контент в `content/*`, Network First)
- `pr16` — WebSocket (Socket.IO) + Push (сервер на Node.js)
- `pr17` — напоминания через Push + действие «Отложить на 5 минут» (snooze)
- `pr18` — README для контрольной №3

## Запуск
### pr15 (HTTPS + App Shell)
```bash
cd pr15
npm i -g http-server
http-server --ssl --cert localhost+2.pem --key localhost+2-key.pem -p 3000
```
Открыть: `https://localhost:3000/notes-app/`

### pr16 (WebSocket + Push)
```bash
cd pr16
npm install
npm start
```
Открыть: `http://localhost:3001/`

### pr17 (Напоминания + Snooze)
```bash
cd pr17
npm install
npm start
```
Открыть: `http://localhost:3001/`

## Проверка функционала
- Push: нажать «Включить уведомления» и разрешить уведомления в браузере.
- WebSocket: открыть 2 вкладки, добавить заметку — во второй вкладке появится всплывающее сообщение.
- Напоминания: добавить заметку с датой/временем — по наступлению времени придёт push; в уведомлении доступна кнопка «Отложить на 5 минут».

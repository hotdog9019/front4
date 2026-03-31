const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const vapidKeys = {
  publicKey:
    'BD9vKlmYgWp7eIj3yaayXYJShCEcjhWs_c3qZ2q12k7Z-qH1yMqMvQb9HM6V-glp_gfUix6tU0qOlqmcIxE3Cjc',
  privateKey: 'cxOD_klG-t2XO5jms2CQP3q4u7GtjrO8VnUmikVCdFk',
};

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey,
);

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'notes-app')));

let subscriptions = [];
const reminders = new Map();

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

io.on('connection', (socket) => {
  console.log('Клиент подключён:', socket.id);

  socket.on('newTask', (task) => {
    io.emit('taskAdded', task);

    const payload = JSON.stringify({
      title: 'Новая задача',
      body: task?.text || '',
    });

    subscriptions.forEach((sub) => {
      webpush
        .sendNotification(sub, payload)
        .catch((err) => console.error('Push error:', err));
    });
  });

  socket.on('newReminder', (reminder) => {
    const reminderId = Number(reminder?.id);
    const reminderTime = Number(reminder?.reminderTime);
    const text = reminder?.text || '';

    if (!Number.isFinite(reminderId) || !Number.isFinite(reminderTime)) return;

    const delay = reminderTime - Date.now();
    if (delay <= 0) return;

    const existing = reminders.get(reminderId);
    if (existing?.timeoutId) clearTimeout(existing.timeoutId);

    const timeoutId = setTimeout(() => {
      const payload = JSON.stringify({
        title: '!!! Напоминание',
        body: text,
        reminderId,
      });

      subscriptions.forEach((sub) => {
        webpush
          .sendNotification(sub, payload)
          .catch((err) => console.error('Push error:', err));
      });

      reminders.delete(reminderId);
    }, delay);

    reminders.set(reminderId, { timeoutId, text, reminderTime });
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключён:', socket.id);
  });
});

app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  if (!subscription?.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }

  const exists = subscriptions.some((sub) => sub.endpoint === subscription.endpoint);
  if (!exists) subscriptions.push(subscription);

  return res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
  const endpoint = req.body?.endpoint;
  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint' });
  }

  subscriptions = subscriptions.filter((sub) => sub.endpoint !== endpoint);
  return res.status(200).json({ message: 'Подписка удалена' });
});

app.post('/snooze', (req, res) => {
  const reminderId = parseInt(req.query.reminderId, 10);
  if (!reminderId || !reminders.has(reminderId)) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  const reminder = reminders.get(reminderId);
  clearTimeout(reminder.timeoutId);

  const newDelay = 5 * 60 * 1000;
  const newTimeoutId = setTimeout(() => {
    const payload = JSON.stringify({
      title: 'Напоминание отложено',
      body: reminder.text,
      reminderId,
    });

    subscriptions.forEach((sub) => {
      webpush
        .sendNotification(sub, payload)
        .catch((err) => console.error('Push error:', err));
    });

    reminders.delete(reminderId);
  }, newDelay);

  reminders.set(reminderId, {
    timeoutId: newTimeoutId,
    text: reminder.text,
    reminderTime: Date.now() + newDelay,
  });

  return res.status(200).json({ message: 'Reminder snoozed for 5 minutes' });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});

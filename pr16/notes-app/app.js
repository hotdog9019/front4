const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');

const VAPID_PUBLIC_KEY =
    'BD9vKlmYgWp7eIj3yaayXYJShCEcjhWs_c3qZ2q12k7Z-qH1yMqMvQb9HM6V-glp_gfUix6tU0qOlqmcIxE3Cjc';

const socket = typeof io === 'function' ? io() : null;

function showToast(text) {
    const toast = document.createElement('div');
    toast.textContent = text;
    toast.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #4285f4;
        color: white;
        padding: 1rem;
        border-radius: 5px;
        z-index: 1000;
        max-width: 320px;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

if (socket) {
    socket.on('taskAdded', (task) => {
        const text = task?.text ? `Новая задача: ${task.text}` : 'Новая задача';
        showToast(text);
    });
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    await fetch('/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
    });
}

async function unsubscribeFromPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    await fetch('/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
    });
    await subscription.unsubscribe();
}

async function initPushUi(registration) {
    const enableBtn = document.getElementById('enable-push');
    const disableBtn = document.getElementById('disable-push');
    if (!enableBtn || !disableBtn) return;

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
        enableBtn.style.display = 'none';
        disableBtn.style.display = 'inline-block';
    }

    enableBtn.addEventListener('click', async () => {
        if (Notification.permission === 'denied') {
            alert('Уведомления запрещены. Разрешите их в настройках браузера.');
            return;
        }
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('Необходимо разрешить уведомления.');
                return;
            }
        }

        try {
            await subscribeToPush();
            enableBtn.style.display = 'none';
            disableBtn.style.display = 'inline-block';
        } catch (err) {
            console.error('Ошибка подписки на push:', err);
            alert('Не удалось включить уведомления.');
        }
    });

    disableBtn.addEventListener('click', async () => {
        try {
            await unsubscribeFromPush();
            disableBtn.style.display = 'none';
            enableBtn.style.display = 'inline-block';
        } catch (err) {
            console.error('Ошибка отписки от push:', err);
            alert('Не удалось отключить уведомления.');
        }
    });
}

function setActiveButton(activeId) {
    [homeBtn, aboutBtn].forEach(btn => btn.classList.remove('active'));
    document.getElementById(activeId).classList.add('active');
}

async function loadContent(page) {
    try {
        const response = await fetch(`content/${page}.html`);
        const html = await response.text();
        contentDiv.innerHTML = html;

// Если загружена главная страница, инициализируем функционал заметок
        if (page === 'home') {
            initNotes();
        }
    } catch (err) {
        contentDiv.innerHTML = `<p class="is-center text-error">Ошибка загрузки страницы.</p>`;
        console.error(err);
    }
}

homeBtn.addEventListener('click', () => {
    setActiveButton('home-btn');
    loadContent('home');
});

aboutBtn.addEventListener('click', () => {
    setActiveButton('about-btn');
    loadContent('about');
});

// Загружаем главную страницу при старте
loadContent('home');

// Функционал заметок (localStorage)
function initNotes() {
    const form = document.getElementById('note-form');
    const input = document.getElementById('note-input');
    const list = document.getElementById('notes-list');

    function loadNotes() {
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        list.innerHTML = notes.map(note => `
            <li class="card" style="margin-bottom: 0.5rem; padding: 0.5rem;">
                ${note.text}
                <br><small>${new Date(note.createdAt).toLocaleString()}</small>
            </li>
        `).join('');
    }

    function addNote(text) {
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const note = { id: Date.now(), text, createdAt: Date.now() };
        notes.push(note);
        localStorage.setItem('notes', JSON.stringify(notes));
        loadNotes();

        socket?.emit('newTask', { id: note.id, text: note.text, timestamp: note.createdAt });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text) {
            addNote(text);
            input.value = '';
        }
    });

    loadNotes();
}

// Регистрация Service Worker 
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const reg = await navigator.serviceWorker.register('sw.js');
            console.log('SW registered:', reg.scope);
            await initPushUi(reg);
        } catch (err) {
            console.log('SW registration failed:', err);
        }
    });
}

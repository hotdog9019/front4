// Элементы DOM
const form = document.getElementById('note-form');
const input = document.getElementById('note-input');
const list = document.getElementById('notes-list');
const banner = document.getElementById('offline-banner');

// Офлайн-индикатор
function updateOnlineStatus() {
    banner.classList.toggle('visible', !navigator.onLine);
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// Загрузка заметок из localStorage при старте
function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    list.innerHTML = notes.map(note => `<li>${note}</li>`).join('');
}

// Сохранение заметки
function addNote(text) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.push(text);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
}

// Обработка отправки формы
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
        addNote(text);
        input.value = '';
    }
});

// Первоначальная загрузка
loadNotes();

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('ServiceWorker зарегистрирован:', registration.scope);
        } catch (err) {
            console.error('Ошибка регистрации ServiceWorker:', err);
        }
    });
}

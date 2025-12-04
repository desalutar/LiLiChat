// Получаем текущий user_id из localStorage
const currentUserId = localStorage.getItem('userId');
const accessToken = localStorage.getItem('accessToken');

// Проверка авторизации
if (!currentUserId || !accessToken) {
    window.location.href = '/auth.html';
}

let selectedUserId = null;

const userList = document.getElementById('user-list');
const messagesDiv = document.getElementById('messages');
const chatHeader = document.getElementById('chat-header');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const dragbar = document.getElementById('dragbar');
const sidebar = document.getElementById('sidebar');
const chatContainer = document.querySelector('.chat-container');
const logoutBtn = document.getElementById('logout-btn');

let isDragging = false;

// Загрузка списка пользователей
function loadUsers() {
    // TODO: Добавить API endpoint для получения списка пользователей
    // Пока оставляем пустым или можно добавить заглушку
    userList.innerHTML = '<li>Загрузка пользователей...</li>';
}

// Обработчик выхода
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    window.location.href = '/auth.html';
});

// Загружаем пользователей при загрузке страницы
loadUsers();

// Выбор пользователя
userList.addEventListener('click', e => {
    if (e.target.tagName === 'LI') {
        selectedUserId = e.target.dataset.userid;
        chatHeader.textContent = 'Чат с ' + e.target.textContent;
        messagesDiv.innerHTML = '';
        messageForm.style.display = 'flex';
        loadMessages();
    }
});

// Отправка сообщения
messageForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!selectedUserId) return;
    const content = messageInput.value.trim();
    if (!content) return;

    fetch('/api/1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        },
        body: JSON.stringify({receiver_id: selectedUserId, content})
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            messageInput.value = '';
            loadMessages();
        }
    });
});

// Загрузка сообщений
function loadMessages() {
    if (!selectedUserId) return;

    fetch('/api/1/messages/' + selectedUserId, {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    })
        .then(res => res.json())
        .then(data => {
            messagesDiv.innerHTML = '';
            data.forEach(msg => {
                const msgDiv = document.createElement('div');
                msgDiv.classList.add('message');
                msgDiv.classList.add(msg.sender == currentUserId ? 'sent' : 'received');
                msgDiv.textContent = msg.content;
                messagesDiv.appendChild(msgDiv);
            });
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });
}

// Автообновление сообщений каждые 3 секунды
setInterval(() => {
    if (selectedUserId) loadMessages();
}, 3000);

// Изменение ширины боковой панели
dragbar.addEventListener('mousedown', () => {
    isDragging = true;
    document.body.style.cursor = 'ew-resize';
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        document.body.style.cursor = 'default';
    }
});

document.addEventListener('mousemove', e => {
    if (!isDragging) return;

    let containerOffsetLeft = chatContainer.getBoundingClientRect().left;
    let pointerRelativeXpos = e.clientX - containerOffsetLeft;

    const minWidth = 150;
    const maxWidth = 500;

    if (pointerRelativeXpos < minWidth) pointerRelativeXpos = minWidth;
    if (pointerRelativeXpos > maxWidth) pointerRelativeXpos = maxWidth;

    sidebar.style.width = pointerRelativeXpos + 'px';
});

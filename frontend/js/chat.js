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
    if (!accessToken) {
        console.error('No access token available');
        return;
    }

    userList.innerHTML = '<li>Загрузка пользователей...</li>';

    fetch('/api/1/users', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json'
        }
    })
    .then(res => {
        if (res.status === 401) {
            // Токен недействителен, перенаправляем на страницу входа
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userId');
            window.location.href = '/auth.html';
            return;
        }
        if (!res.ok) {
            throw new Error('Failed to load users: ' + res.statusText);
        }
        return res.json();
    })
    .then(users => {
        if (!users || !Array.isArray(users)) {
            console.error('Invalid users data:', users);
            userList.innerHTML = '<li>Ошибка загрузки пользователей</li>';
            return;
        }

        // Фильтруем текущего пользователя из списка
        const currentUserIdNum = parseInt(currentUserId, 10);
        const otherUsers = users.filter(user => user.id !== currentUserIdNum);

        if (otherUsers.length === 0) {
            userList.innerHTML = '<li>Нет других пользователей</li>';
            return;
        }

        // Очищаем список и добавляем пользователей
        userList.innerHTML = '';
        otherUsers.forEach(user => {
            const li = document.createElement('li');
            li.textContent = user.username;
            li.dataset.userid = user.id;
            userList.appendChild(li);
        });
    })
    .catch(error => {
        console.error('Error loading users:', error);
        userList.innerHTML = '<li>Ошибка загрузки пользователей</li>';
    });
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
        // Убираем выделение с предыдущего выбранного элемента
        const prevSelected = userList.querySelector('.selected');
        if (prevSelected) {
            prevSelected.classList.remove('selected');
        }
        
        // Выделяем текущий выбранный элемент
        e.target.classList.add('selected');
        
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
        body: JSON.stringify({
            receiver_id: parseInt(selectedUserId, 10),
            content: content
        })
    })
    .then(res => {
        if (res.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userId');
            window.location.href = '/auth.html';
            return;
        }
        return res.json();
    })
    .then(data => {
        if (data && (data.status === 'success' || data.id)) {
            messageInput.value = '';
            loadMessages();
        } else {
            console.error('Failed to send message:', data);
            alert('Ошибка отправки сообщения');
        }
    })
    .catch(error => {
        console.error('Error sending message:', error);
        alert('Ошибка отправки сообщения: ' + error.message);
    });
});

// Загрузка сообщений
function loadMessages() {
    if (!selectedUserId) return;

    fetch('/api/1/messages/' + selectedUserId, {
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json'
        }
    })
    .then(res => {
        if (res.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userId');
            window.location.href = '/auth.html';
            return;
        }
        if (!res.ok) {
            throw new Error('Failed to load messages: ' + res.statusText);
        }
        return res.json();
    })
    .then(data => {
        if (!data || !Array.isArray(data)) {
            console.error('Invalid messages data:', data);
            return;
        }
        
        messagesDiv.innerHTML = '';
        if (data.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.textContent = 'Нет сообщений. Начните общение!';
            emptyMsg.style.color = '#888';
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.padding = '20px';
            messagesDiv.appendChild(emptyMsg);
            return;
        }
        
        const currentUserIdNum = parseInt(currentUserId, 10);
        data.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.classList.add('message');
            const senderId = typeof msg.sender_id === 'number' ? msg.sender_id : parseInt(msg.sender_id, 10);
            msgDiv.classList.add(senderId === currentUserIdNum ? 'sent' : 'received');
            msgDiv.textContent = msg.content;
            messagesDiv.appendChild(msgDiv);
        });
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    })
    .catch(error => {
        console.error('Error loading messages:', error);
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

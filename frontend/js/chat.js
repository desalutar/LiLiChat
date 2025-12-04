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
let ws = null; // WebSocket соединение

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
    closeWebSocket();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    window.location.href = '/auth.html';
});

// Загружаем пользователей при загрузке страницы
loadUsers();

// Закрытие WebSocket соединения
function closeWebSocket() {
    if (ws) {
        ws.close();
        ws = null;
        console.log('WebSocket connection closed');
    }
}

// Подключение к WebSocket
function connectWebSocket() {
    // Закрываем предыдущее соединение, если есть
    closeWebSocket();

    if (!accessToken) {
        console.error('No access token available for WebSocket');
        return;
    }

    // Определяем протокол (ws или wss)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/1/ws`;
    
    console.log('Connecting to WebSocket:', wsUrl);

    // Создаем WebSocket соединение с токеном в query параметре
    // (middleware поддерживает токен в query параметре)
    ws = new WebSocket(`${wsUrl}?token=${accessToken}`);

    ws.onopen = () => {
        console.log('WebSocket connection opened');
        // Загружаем историю сообщений при подключении
        loadMessages();
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);

            if (data.type === 'connected') {
                console.log('WebSocket connected, user_id:', data.user_id);
            } else if (data.type === 'message') {
                // Получено новое сообщение
                const currentUserIdNum = parseInt(currentUserId, 10);
                const senderId = typeof data.sender_id === 'number' ? data.sender_id : parseInt(data.sender_id, 10);
                const receiverId = typeof data.receiver_id === 'number' ? data.receiver_id : parseInt(data.receiver_id, 10);
                const selectedUserIdNum = parseInt(selectedUserId, 10);
                
                console.log('Processing message:', {
                    senderId,
                    receiverId,
                    currentUserIdNum,
                    selectedUserIdNum,
                    text: data.text
                });
                
                // Проверяем, что сообщение относится к текущему чату
                // Сообщение может быть:
                // 1. От нас к выбранному пользователю (sender_id == наш ID, receiver_id == выбранный)
                // 2. От выбранного пользователя к нам (sender_id == выбранный, receiver_id == наш ID)
                if ((senderId === currentUserIdNum && receiverId === selectedUserIdNum) ||
                    (senderId === selectedUserIdNum && receiverId === currentUserIdNum)) {
                    // Добавляем сообщение в чат
                    const isSent = senderId === currentUserIdNum;
                    console.log('Adding message to chat:', { text: data.text, isSent });
                    addMessageToChat(data.text, isSent);
                } else {
                    console.log('Message not for current chat, ignoring');
                }
            } else if (data.type === 'error') {
                console.error('WebSocket error:', data.error);
                alert('Ошибка: ' + data.error);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed');
        ws = null;
    };
}

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
        
        // Подключаемся к WebSocket
        connectWebSocket();
    }
});

// Добавление сообщения в чат
function addMessageToChat(text, isSent) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(isSent ? 'sent' : 'received');
    msgDiv.textContent = text;
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Отправка сообщения через WebSocket
messageForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!selectedUserId) return;
    const content = messageInput.value.trim();
    if (!content) return;

    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert('WebSocket соединение не установлено. Попробуйте выбрать пользователя снова.');
        return;
    }

    // Отправляем сообщение через WebSocket
    const message = {
        receiver_id: parseInt(selectedUserId, 10),
        text: content
    };

    try {
        ws.send(JSON.stringify(message));
        // Очищаем поле ввода сразу после отправки
        messageInput.value = '';
        // Сообщение придет от сервера через WebSocket и отобразится автоматически
    } catch (error) {
        console.error('Error sending message via WebSocket:', error);
        alert('Ошибка отправки сообщения: ' + error.message);
    }
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
        if (res.status === 404) {
            // Endpoint не существует, просто не загружаем историю
            console.log('Messages endpoint not found, skipping history load');
            return [];
        }
        if (!res.ok) {
            console.warn('Failed to load messages:', res.statusText);
            return [];
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
            // Используем text или content в зависимости от того, что приходит от сервера
            msgDiv.textContent = msg.text || msg.content || '';
            messagesDiv.appendChild(msgDiv);
        });
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    })
    .catch(error => {
        console.error('Error loading messages:', error);
    });
}

// Автообновление сообщений больше не нужно - используем WebSocket

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

// Закрываем WebSocket при закрытии страницы
window.addEventListener('beforeunload', () => {
    closeWebSocket();
});

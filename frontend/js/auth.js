let isLogin = true; // флаг, что сейчас логин

const form = document.getElementById('auth-form');
const title = document.getElementById('form-title');
const submitButton = document.getElementById('submit-button');
const toggleLink = document.getElementById('toggle-link');
const toggleText = document.getElementById('toggle-text');

toggleLink.addEventListener('click', e => {
    e.preventDefault();
    isLogin = !isLogin;
    if (isLogin) {
        title.textContent = 'Вход';
        submitButton.textContent = 'Войти';
        toggleText.firstChild.textContent = 'Нет аккаунта? ';
        toggleLink.textContent = 'Зарегистрироваться';
    } else {
        title.textContent = 'Регистрация';
        submitButton.textContent = 'Зарегистрироваться';
        toggleText.firstChild.textContent = 'Уже есть аккаунт? ';
        toggleLink.textContent = 'Войти';
    }
});

form.addEventListener('submit', async e => {
    e.preventDefault();
    const username = form.username.value.trim();
    const password = form.password.value.trim();

    if (!username || !password) {
        alert('Заполните все поля');
        return;
    }

    const endpoint = isLogin ? '/api/1/auth/login' : '/api/1/auth/register';
    console.log('Sending request to:', endpoint);

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        console.log('Response status:', res.status, res.statusText);

        if (res.ok) {
            const responseText = await res.text();
            console.log('Raw response text:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (err) {
                console.error('JSON parse error:', err, 'Response was:', responseText);
                alert('Ошибка: неверный формат ответа от сервера');
                return;
            }
            
            console.log('Parsed response data:', data);
            console.log('Has access_token?', !!data?.access_token);
            console.log('Has user_id?', !!data?.user_id);
            console.log('isLogin?', isLogin);
            
            if (isLogin) {
                if (data?.access_token) {
                    // Сохраняем токен и переходим на чат
                    localStorage.setItem('accessToken', data.access_token);
                    localStorage.setItem('userId', String(data.user_id));
                    console.log('Token saved:', {
                        accessToken: data.access_token ? 'present' : 'missing',
                        userId: data.user_id
                    });
                    console.log('About to redirect to /chat.html');
                    
                    // Пробуем несколько способов редиректа
                    try {
                        window.location.replace('/chat.html');
                    } catch (e) {
                        console.error('window.location.replace failed:', e);
                        window.location.href = '/chat.html';
                    }
                } else {
                    console.error('Login response missing access_token:', data);
                    alert('Ошибка: сервер не вернул токен доступа');
                }
            } else if (!isLogin) {
                alert('Регистрация прошла успешно! Теперь можно войти.');
                // Переключаем форму обратно на вход
                isLogin = true;
                title.textContent = 'Вход';
                submitButton.textContent = 'Войти';
                toggleText.firstChild.textContent = 'Нет аккаунта? ';
                toggleLink.textContent = 'Зарегистрироваться';
            } else {
                console.error('Unexpected response format:', data);
                alert('Неожиданный формат ответа от сервера');
            }
        } else {
            const errorText = await res.text().catch(() => 'Unknown error');
            console.error('Error response:', errorText);
            alert('Ошибка: ' + errorText);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        alert('Ошибка сети: ' + error.message);
    }
});

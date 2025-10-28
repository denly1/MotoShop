import fetch from 'node-fetch';

async function testSimpleLogin() {
  try {
    console.log('Тестирование упрощенной аутентификации...');
    
    // Вход в систему
    const loginResponse = await fetch('http://localhost:3003/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@motoshop.ru',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    console.log('Статус ответа при входе:', loginResponse.status);
    console.log('Ответ сервера при входе:', JSON.stringify(loginData, null, 2));
    
    if (!loginResponse.ok) {
      console.log('Ошибка при входе в систему');
      return;
    }
    
    const token = loginData.token;
    console.log('Получен токен:', token);
    
    // Проверка профиля с использованием токена
    const profileResponse = await fetch('http://localhost:3003/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const profileData = await profileResponse.json();
    
    console.log('Статус ответа при получении профиля:', profileResponse.status);
    console.log('Ответ сервера при получении профиля:', JSON.stringify(profileData, null, 2));
    
    if (profileResponse.ok) {
      console.log('Упрощенная аутентификация работает!');
    } else {
      console.log('Ошибка при получении профиля');
    }
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error);
  }
}

testSimpleLogin();

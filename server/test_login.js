import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('Тестирование входа в систему...');
    
    const response = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@motoshop.ru',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    
    console.log('Статус ответа:', response.status);
    console.log('Ответ сервера:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('Вход в систему успешен!');
    } else {
      console.log('Ошибка при входе в систему');
    }
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error);
  }
}

testLogin();

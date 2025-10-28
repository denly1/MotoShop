import bcrypt from 'bcryptjs';

const testPassword = async () => {
  const password = 'admin123';
  const hash = '$2a$10$JfVdOD5Wg1HQpqX2.8AwNOXGoVHtF2kUE.uP5xyTvGIGvns1t8rAe';
  
  const match = await bcrypt.compare(password, hash);
  console.log('Password "admin123" matches hash:', match);
  
  // Создаем новый хэш для проверки
  const newHash = await bcrypt.hash(password, 10);
  console.log('New hash for "admin123":', newHash);
};

testPassword();

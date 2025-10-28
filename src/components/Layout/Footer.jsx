import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>🏍️ MotoShop</h3>
            <p>Ваш надежный магазин мототехники. Широкий выбор мотоциклов от ведущих мировых производителей.</p>
          </div>

          <div className="footer-section">
            <h4>Навигация</h4>
            <ul>
              <li><a href="/">Главная</a></li>
              <li><a href="/catalog">Каталог</a></li>
              <li><a href="/cart">Корзина</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Категории</h4>
            <ul>
              <li>Спортбайки</li>
              <li>Круизеры</li>
              <li>Эндуро</li>
              <li>Туристические</li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Контакты</h4>
            <ul>
              <li>📞 +7 (800) 555-35-35</li>
              <li>📧 info@motoshop.ru</li>
              <li>📍 Москва, ул. Мотоциклистов, 1</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} MotoShop. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


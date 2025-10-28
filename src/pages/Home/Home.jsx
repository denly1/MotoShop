import React from 'react';
import { Link } from 'react-router-dom';
import { products } from '../../data/products';
import ProductCard from '../../components/ProductCard/ProductCard';
import './Home.css';

const Home = () => {
  const featuredProducts = products.slice(0, 6);

  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Добро пожаловать в <span className="highlight">MotoShop</span>
            </h1>
            <p className="hero-subtitle">
              Широкий выбор мотоциклов от ведущих мировых производителей. 
              Найдите свой идеальный байк уже сегодня!
            </p>
            <div className="hero-buttons">
              <Link to="/catalog" className="btn btn-primary">
                Смотреть каталог
              </Link>
              <a href="#featured" className="btn btn-outline">
                Узнать больше
              </a>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-bike-icon">🏍️</div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>Качество</h3>
              <p>Только сертифицированная техника от официальных дилеров</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚚</div>
              <h3>Доставка</h3>
              <p>Бесплатная доставка по всей России</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Гарантия</h3>
              <p>Официальная гарантия производителя на всю технику</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👨‍🔧</div>
              <h3>Сервис</h3>
              <p>Профессиональное обслуживание и ремонт</p>
            </div>
          </div>
        </div>
      </section>

      <section id="featured" className="featured-products">
        <div className="container">
          <h2 className="section-title">Популярные модели</h2>
          <div className="products-grid">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="section-footer">
            <Link to="/catalog" className="btn btn-secondary">
              Смотреть все модели
            </Link>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Готовы выбрать свой мотоцикл?</h2>
            <p>Наши эксперты помогут вам подобрать идеальную модель</p>
            <Link to="/catalog" className="btn btn-primary">
              Перейти в каталог
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;


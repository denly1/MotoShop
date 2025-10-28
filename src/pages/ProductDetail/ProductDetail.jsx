import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { products } from '../../data/products';
import { useCart } from '../../context/CartContext';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const product = products.find(p => p.id === parseInt(id));

  if (!product) {
    return (
      <div className="container">
        <div className="not-found">
          <h2>Товар не найден</h2>
          <button onClick={() => navigate('/catalog')} className="btn btn-primary">
            Вернуться в каталог
          </button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product);
    // Optional: Show notification or redirect
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="product-detail">
      <div className="container">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Назад
        </button>

        <div className="product-detail-content">
          <div className="product-detail-image">
            <img src={product.image} alt={product.name} />
            {!product.inStock && (
              <div className="out-of-stock-overlay">
                <span>Нет в наличии</span>
              </div>
            )}
          </div>

          <div className="product-detail-info">
            <span className="product-category">{product.category}</span>
            <h1 className="product-title">{product.name}</h1>
            
            <div className="product-price-section">
              <span className="product-price">{formatPrice(product.price)}</span>
              {product.inStock ? (
                <span className="in-stock-badge">✅ В наличии</span>
              ) : (
                <span className="out-of-stock-badge">❌ Нет в наличии</span>
              )}
            </div>

            <p className="product-description-full">{product.description}</p>

            <div className="product-features">
              <h3>Характеристики:</h3>
              <ul>
                {product.features.map((feature, index) => (
                  <li key={index}>✓ {feature}</li>
                ))}
              </ul>
            </div>

            <div className="product-actions">
              <button 
                className={`btn ${product.inStock ? 'btn-primary btn-large' : 'btn-disabled btn-large'}`}
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                {product.inStock ? '🛒 Добавить в корзину' : 'Недоступно'}
              </button>
            </div>

            <div className="product-delivery-info">
              <div className="delivery-item">
                <span className="delivery-icon">🚚</span>
                <div>
                  <strong>Бесплатная доставка</strong>
                  <p>По всей России</p>
                </div>
              </div>
              <div className="delivery-item">
                <span className="delivery-icon">💰</span>
                <div>
                  <strong>Гарантия</strong>
                  <p>Официальная гарантия производителя</p>
                </div>
              </div>
              <div className="delivery-item">
                <span className="delivery-icon">🔧</span>
                <div>
                  <strong>Сервис</strong>
                  <p>Профессиональное обслуживание</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;


# ПРИЛОЖЕНИЕ А. ТЕКСТ ПРОГРАММЫ - ЧАСТЬ 2: FRONTEND

## 1. МОДУЛИ FRONTEND

### Таблица 2 – Модули Frontend

| № | Имя модуля | Тип | Размер | Назначение |
|---|------------|-----|--------|------------|
| 1 | App.jsx | JSX | 180 строк | Главный компонент |
| 2 | AuthContext.jsx | JSX | 150 строк | Контекст аутентификации |
| 3 | CartContext.jsx | JSX | 120 строк | Контекст корзины |
| 4 | HomePage.jsx | JSX | 200 строк | Главная страница |
| 5 | CatalogPage.jsx | JSX | 350 строк | Каталог товаров |
| 6 | ProductPage.jsx | JSX | 280 строк | Страница товара |
| 7 | CartPage.jsx | JSX | 250 строк | Корзина |
| 8 | CheckoutPage.jsx | JSX | 220 строк | Оформление заказа |
| 9 | LoginPage.jsx | JSX | 180 строк | Вход |
| 10 | RegisterPage.jsx | JSX | 200 строк | Регистрация |
| 11 | DashboardPage.jsx | JSX | 400 строк | Админ дашборд |
| 12 | ProductsManagePage.jsx | JSX | 500 строк | Управление товарами |
| 13 | ProductCard.jsx | JSX | 120 строк | Карточка товара |
| 14 | ProductQuickView.jsx | JSX | 180 строк | Быстрый просмотр |

---

## 2. ОПИСАНИЕ МОДУЛЕЙ

### 2.1. App.jsx - Главный компонент

**Назначение:** Настройка маршрутизации приложения

**Код:**
```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import MainLayout from './components/layouts/MainLayout';
import AdminLayout from './components/layouts/AdminLayout';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/admin/DashboardPage';
import ProductsManagePage from './pages/admin/ProductsManagePage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="catalog" element={<CatalogPage />} />
              <Route path="product/:slug" element={<ProductPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
            </Route>

            <Route path="/admin" element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="products-manage" element={<ProductsManagePage />} />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
```

---

### 2.2. AuthContext.jsx - Контекст аутентификации

**Назначение:** Управление состоянием аутентификации

**Функции:**
- `login` - Авторизация
- `register` - Регистрация
- `logout` - Выход
- `checkAuth` - Проверка токена

**Код:**
```jsx
import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:3003/api';

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email, password
    });
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
    setIsAuthenticated(true);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, isAuthenticated, loading, login, logout, checkAuth 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

### 2.3. CartContext.jsx - Контекст корзины

**Назначение:** Управление корзиной покупок

**Функции:**
- `addToCart` - Добавить товар
- `removeFromCart` - Удалить товар
- `updateQuantity` - Изменить количество
- `clearCart` - Очистить корзину

**Код:**
```jsx
import { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, 
      updateQuantity, clearCart, total
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
```

---

### 2.4. CatalogPage.jsx - Каталог товаров

**Назначение:** Отображение каталога с фильтрами

**Функции:**
- Поиск товаров
- Фильтрация по категориям
- Отображение карточек товаров

**Код (основная часть):**
```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from '../components/ui/ProductCard';

function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [search, category]);

  const fetchProducts = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;

      const response = await axios.get(
        'http://localhost:3003/api/products',
        { params }
      );
      setProducts(response.data.products);
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Каталог мототехники</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Поиск товаров..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default CatalogPage;
```

---

### 2.5. ProductsManagePage.jsx - Управление товарами

**Назначение:** CRUD товаров в админ-панели

**Функции:**
- Создание товара
- Редактирование товара
- Удаление товара
- Модальное окно формы

**Код (основная часть):**
```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function ProductsManagePage() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '', sku: '', price: '', brand: '', description: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      'http://localhost:3003/api/products',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setProducts(response.data.products);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = editingProduct
      ? `http://localhost:3003/api/admin/products/${editingProduct.id}`
      : 'http://localhost:3003/api/admin/products';
    
    const method = editingProduct ? 'put' : 'post';
    
    await axios[method](url, formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    alert(editingProduct ? 'Товар обновлен!' : 'Товар создан!');
    setShowModal(false);
    fetchProducts();
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить товар?')) return;
    
    const token = localStorage.getItem('token');
    await axios.delete(
      `http://localhost:3003/api/admin/products/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchProducts();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Управление товарами</h1>
        <button
          onClick={() => { setShowModal(true); setEditingProduct(null); }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Добавить товар
        </button>
      </div>

      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">Название</th>
            <th className="p-3 text-left">Артикул</th>
            <th className="p-3 text-left">Цена</th>
            <th className="p-3 text-left">Действия</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id} className="border-t">
              <td className="p-3">{product.name}</td>
              <td className="p-3">{product.sku}</td>
              <td className="p-3">{product.price} ₽</td>
              <td className="p-3">
                <button
                  onClick={() => { setEditingProduct(product); setShowModal(true); }}
                  className="text-blue-600 mr-2"
                >
                  Изменить
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="text-red-600"
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductsManagePage;
```

---

## 3. ИТОГИ FRONTEND

**Общее количество модулей:** 14
**Общее количество строк:** ~3,330
**Основные технологии:** React 18, Vite, TailwindCSS, Axios
**Паттерны:** Context API, React Router, Hooks

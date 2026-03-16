import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { authService } from '../services/authService';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadProducts();
    loadUser();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      console.error('Ошибка загрузки товаров:', err);
    }
  };

  const loadUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.error('Ошибка загрузки пользователя:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить товар?')) return;
    try {
      await productService.delete(id);
      loadProducts();
    } catch (err) {
      alert('Ошибка удаления: ' + err.response?.data?.error);
    }
  };

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  return (
    <div className="product-list">
      <header>
        <h1>Товары</h1>
        {user && <span>Привет, {user.first_name}!</span>}
        <button onClick={handleLogout}>Выйти</button>
      </header>
      
      <Link to="/products/create" className="btn-primary">+ Добавить товар</Link>
      
      <ul>
        {products.map(product => (
          <li key={product.id}>
            <strong>{product.title}</strong> — {product.category} — ${product.price}
            <div>
              <Link to={`/products/${product.id}`}>Просмотр</Link>
              <Link to={`/products/${product.id}/edit`}>Редактировать</Link>
              <button onClick={() => handleDelete(product.id)}>Удалить</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductList;
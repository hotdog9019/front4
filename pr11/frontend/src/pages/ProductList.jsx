import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { authService } from '../services/authService';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const role = authService.getRole();
  const canCreate = role === 'seller' || role === 'admin';
  const canEdit = role === 'seller' || role === 'admin';
  const canDelete = role === 'admin';
  const isAdmin = role === 'admin';

  const loadProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data);
      setError('');
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка загрузки товаров');
    }
  };

  const loadUser = async () => {
    try {
      const data = await authService.getCurrentUser();
      setUser(data);
    } catch (_e) {
      setUser(null);
    }
  };

  useEffect(() => {
    loadProducts();
    loadUser();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить товар?')) return;
    try {
      await productService.delete(id);
      loadProducts();
    } catch (e) {
      alert(e.response?.data?.error || 'Ошибка удаления');
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="product-list">
      <header>
        <h1>Товары</h1>
        <div>
          {user && (
            <span>
              {user.first_name} {user.last_name} ({user.role})
            </span>
          )}
          {isAdmin && <Link to="/users">Пользователи</Link>}
          <button onClick={handleLogout}>Выйти</button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      {canCreate && (
        <Link to="/products/create" className="btn-primary">
          + Добавить товар
        </Link>
      )}

      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <strong>{product.title}</strong> — {product.category} — ${Number(product.price).toFixed(2)}
            <div>
              <Link to={`/products/${product.id}`}>Просмотр</Link>
              {canEdit && <Link to={`/products/${product.id}/edit`}>Редактировать</Link>}
              {canDelete && <button onClick={() => handleDelete(product.id)}>Удалить</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductList;


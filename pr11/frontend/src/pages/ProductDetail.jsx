import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { authService } from '../services/authService';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const role = authService.getRole();
  const canEdit = role === 'seller' || role === 'admin';
  const canDelete = role === 'admin';

  const loadProduct = async () => {
    try {
      const data = await productService.getById(id);
      setProduct(data);
      setError('');
    } catch (_e) {
      setError('Ошибка загрузки товара');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Удалить этот товар?')) return;
    try {
      await productService.delete(id);
      navigate('/products');
    } catch (e) {
      alert(e.response?.data?.error || 'Ошибка удаления');
    }
  };

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!product) return <p>Товар не найден</p>;

  return (
    <div className="product-detail">
      <Link to="/products">← Назад к списку</Link>
      <h1>{product.title}</h1>
      <p>
        <strong>Категория:</strong> {product.category}
      </p>
      <p>
        <strong>Цена:</strong> ${Number(product.price).toFixed(2)}
      </p>
      {product.description ? (
        <p>
          <strong>Описание:</strong> {product.description}
        </p>
      ) : null}
      <div className="actions">
        {canEdit && (
          <Link to={`/products/${id}/edit`} className="btn-primary">
            Редактировать
          </Link>
        )}
        {canDelete && (
          <button onClick={handleDelete} className="btn-danger">
            Удалить
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;


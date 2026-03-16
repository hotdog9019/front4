import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../services/productService';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const data = await productService.getById(id);
      setProduct(data);
    } catch (err) {
      setError('Ошибка загрузки товара');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Удалить этот товар?')) return;
    try {
      await productService.delete(id);
      navigate('/products');
    } catch (err) {
      alert('Ошибка удаления: ' + err.response?.data?.error);
    }
  };

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!product) return <p>Товар не найден</p>;

  return (
    <div className="product-detail">
      <Link to="/products">← Назад к списку</Link>
      <h1>{product.title}</h1>
      <p><strong>Категория:</strong> {product.category}</p>
      <p><strong>Цена:</strong> ${product.price.toFixed(2)}</p>
      {product.description && (
        <p><strong>Описание:</strong> {product.description}</p>
      )}
      <div className="actions">
        <Link to={`/products/${id}/edit`} className="btn-primary">
          Редактировать
        </Link>
        <button onClick={handleDelete} className="btn-danger">
          Удалить
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
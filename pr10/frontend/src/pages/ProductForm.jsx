import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../services/productService';

const ProductForm = () => {
  const { id } = useParams(); // если есть id — режим редактирования
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    price: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      const data = await productService.getById(id);
      setFormData({
        title: data.title,
        category: data.category,
        description: data.description || '',
        price: data.price
      });
    } catch (err) {
      setError('Ошибка загрузки товара');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await productService.update(id, {
          ...formData,
          price: Number(formData.price)
        });
      } else {
        await productService.create({
          ...formData,
          price: Number(formData.price)
        });
      }
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения');
    }
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <div className="auth-container">
      <h2>{isEditMode ? 'Редактировать товар' : 'Новый товар'}</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Название *"
          value={formData.title}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="category"
          placeholder="Категория *"
          value={formData.category}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="price"
          placeholder="Цена *"
          value={formData.price}
          onChange={handleChange}
          step="0.01"
          min="0"
          required
        />
        <textarea
          name="description"
          placeholder="Описание"
          value={formData.description}
          onChange={handleChange}
          rows={4}
        />
        <button type="submit">
          {isEditMode ? 'Сохранить изменения' : 'Создать товар'}
        </button>
      </form>
      <Link to="/products">Отмена</Link>
    </div>
  );
};

export default ProductForm;
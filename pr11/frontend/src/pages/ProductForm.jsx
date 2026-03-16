import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../services/productService';

const ProductForm = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEditMode);

  const loadProduct = async () => {
    try {
      const data = await productService.getById(id);
      setFormData({
        title: data.title,
        category: data.category,
        description: data.description || '',
        price: data.price,
      });
      setError('');
    } catch (_e) {
      setError('Ошибка загрузки товара');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEditMode) {
      loadProduct();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await productService.update(id, formData);
      } else {
        await productService.create(formData);
      }
      navigate('/products');
    } catch (e2) {
      setError(e2.response?.data?.error || 'Ошибка сохранения');
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <div className="product-form">
      <Link to="/products">← Назад</Link>
      <h1>{isEditMode ? 'Редактирование товара' : 'Создание товара'}</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input name="title" placeholder="Название" value={formData.title} onChange={handleChange} required />
        <input name="category" placeholder="Категория" value={formData.category} onChange={handleChange} required />
        <input
          name="price"
          type="number"
          step="0.01"
          placeholder="Цена"
          value={formData.price}
          onChange={handleChange}
          required
        />
        <textarea name="description" placeholder="Описание" value={formData.description} onChange={handleChange} />
        <button type="submit">{isEditMode ? 'Сохранить' : 'Создать'}</button>
      </form>
    </div>
  );
};

export default ProductForm;


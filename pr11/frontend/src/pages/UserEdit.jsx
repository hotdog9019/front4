import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { userService } from '../services/userService';

const roles = ['user', 'seller', 'admin'];

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'user',
    blocked: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const user = await userService.getById(id);
        setForm({
          email: user.email || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          role: user.role || 'user',
          blocked: !!user.blocked,
        });
        setError('');
      } catch (e) {
        setError(e.response?.data?.error || 'Ошибка загрузки пользователя');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await userService.update(id, form);
      navigate('/users');
    } catch (e2) {
      setError(e2.response?.data?.error || 'Ошибка сохранения');
    }
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <div className="user-edit">
      <Link to="/users">← Назад</Link>
      <h1>Редактирование пользователя</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input name="email" type="email" value={form.email} onChange={handleChange} required />
        <input name="first_name" value={form.first_name} onChange={handleChange} required />
        <input name="last_name" value={form.last_name} onChange={handleChange} required />
        <select name="role" value={form.role} onChange={handleChange}>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <label>
          <input name="blocked" type="checkbox" checked={form.blocked} onChange={handleChange} /> blocked
        </label>
        <button type="submit">Сохранить</button>
      </form>
    </div>
  );
};

export default UserEdit;


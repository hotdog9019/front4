import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { authService } from '../services/authService';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
      setError('');
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка загрузки пользователей');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleBlock = async (id) => {
    if (!window.confirm('Заблокировать пользователя?')) return;
    try {
      await userService.block(id);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Ошибка');
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="users-list">
      <header>
        <h1>Пользователи</h1>
        <div>
          <Link to="/products">Товары</Link>
          <button onClick={handleLogout}>Выйти</button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <ul>
        {users.map((u) => (
          <li key={u.id}>
            <div>
              <strong>{u.email}</strong> — {u.first_name} {u.last_name} — {u.role} — {u.blocked ? 'blocked' : 'active'}
            </div>
            <div>
              <Link to={`/users/${u.id}/edit`}>Редактировать</Link>
              <button onClick={() => handleBlock(u.id)} disabled={u.blocked}>
                Заблокировать
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UsersList;


import React, { useEffect, useState } from "react";  
import "./UsersPage.scss";  
import UsersList from "../../components/UsersList";  
import UserModal from "../../components/UserModal";  
import { api } from "../../api";  
  
export default function UsersPage() {  
    const [users, setUsers] = useState([]);  
    const [loading, setLoading] = useState(true);  
  
    const [modalOpen, setModalOpen] = useState(false);  
    const [modalMode, setModalMode] = useState("create"); // create | edit  
    const [editingUser, setEditingUser] = useState(null);  
      
    useEffect(() => {  
        loadUsers();  
    }, []);  
  
    const loadUsers = async () => {  
        try {  
            setLoading(true);  
            const data = await api.getUsers();  
            setUsers(data);  
        } catch (err) {  
            console.error(err);  
            alert("Ошибка загрузки Товаров");  
        } finally {  
            setLoading(false);  
        }  
    };  
      
    const openCreate = () => {  
        setModalMode("create");  
        setEditingUser(null);  
        setModalOpen(true);  
    };  
  
    const openEdit = (user) => {  
        setModalMode("edit");  
        setEditingUser(user);  
        setModalOpen(true);  
    };  
  
    const closeModal = () => {  
        setModalOpen(false);  
        setEditingUser(null);  
    };  
      
    const handleDelete = async (id) => {  
        const ok = window.confirm("Удалить Товар?");  
        if (!ok) return;  
  
        try {  
            await api.deleteUser(id);  
            setUsers((prev) => prev.filter((u) => u.id !== id));  
        } catch (err) {  
            console.error(err);  
            alert("Ошибка удаления Товара");  
        }  
    };  
  
    const handleSubmitModal = async (payload) => {  
        try {  
            if (modalMode === "create") {  
                const newUser = await api.createUser(payload);  
                setUsers((prev) => [...prev, newUser]);  
            } else {  
                const updatedUser = await api.updateUser(payload.id, payload);  
                setUsers((prev) =>  
                    prev.map((u) => (u.id === payload.id ? updatedUser : u))  
                );  
            }  
            closeModal();  
        } catch (err) {  
            console.error(err);  
            alert("Ошибка сохранения Товара");  
        }  
    };  
  
    return (  
        <div className="page">  
            <header className="header">  
                <div className="header__inner">  
                    <div className="brand">Users App</div>  
                    <div className="header__right">React</div>  
                </div>            </header>  
            <main className="main">  
                <div className="container">  
                    <div className="toolbar">  
                        <h1 className="title">Юнифуд</h1>  
                        <button className="btn btn--primary" onClick={openCreate}>  
                            + Добавить Товар  
                        </button>  
                    </div>  
                    {loading ? (  
                        <div className="empty">Загрузка...</div>  
                    ) : (  
                        <UsersList  
                            users={users}  
                            onEdit={openEdit}  
                            onDelete={handleDelete}  
                        />  
                    )}  
                </div>  
            </main>  
            <footer className="footer">  
                <div className="footer__inner">  
                    © {new Date().getFullYear()} Users App  
                </div>  
            </footer>  
            <UserModal                open={modalOpen}  
                mode={modalMode}  
                initialUser={editingUser}  
                onClose={closeModal}  
                onSubmit={handleSubmitModal}  
            />  
        </div>    );  
}
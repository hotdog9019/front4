import React, { useEffect, useState } from "react";  
  
export default function UserModal({ open, mode, initialUser, onClose, onSubmit }) {  
    const [name, setName] = useState("");  
    const [age, setAge] = useState("");  
  
    useEffect(() => {  
        if (!open) return;  
        setName(initialUser?.name ?? "");  
        setAge(initialUser?.age != null ? String(initialUser.age) : "");  
    }, [open, initialUser]);  
  
    if (!open) return null;  
  
    const title = mode === "edit" ? "Редактирование Товар" : "Создание Товара";  
  
    const handleSubmit = (e) => {  
        e.preventDefault();  
  
        const trimmed = name.trim();  
        const parsedAge = Number(age);  
  
        if (!trimmed) {  
            alert("Введите имя");  
            return;  
        }  
        if (!Number.isFinite(parsedAge) || parsedAge < 0 || parsedAge > 150) {  
            alert("Введите корректную цену (< 0)");  
            return;  
        }  
  
        onSubmit({  
            id: initialUser?.id,  
            name: trimmed,  
            age: parsedAge,  
        });  
    };  
  
    return (  
        <div className="backdrop" onMouseDown={onClose}>  
            <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">  
                <div className="modal__header">  
                    <div className="modal__title">{title}</div>  
                    <button className="iconBtn" onClick={onClose} aria-label="Закрыть">  
                        ✕  
                    </button>  
                </div>  
  
                <form className="form" onSubmit={handleSubmit}>  
                    <label className="label">  
                        Имя  
                        <input  
                            className="input"  
                            value={name}  
                            onChange={(e) => setName(e.target.value)}  
                            placeholder="Например, Булочка с сосиской"  
                            autoFocus  
                        />  
                    </label>  
  
                    <label className="label">  
                        Цена  
                        <input  
                            className="input"  
                            value={age}  
                            onChange={(e) => setAge(e.target.value)}  
                            placeholder="Например, 200"  
                            inputMode="numeric"  
                        />  
                    </label>  
  
                    <div className="modal__footer">  
                        <button type="button" className="btn" onClick={onClose}>  
                            Отмена  
                        </button>  
                        <button type="submit" className="btn btn--primary">  
                            {mode === "edit" ? "Сохранить" : "Создать"}  
                        </button>  
                    </div>  
                </form>  
            </div>  
        </div>  
    );  
}
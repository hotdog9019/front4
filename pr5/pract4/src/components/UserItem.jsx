import React from "react";  
  
export default function UserItem({ user, onEdit, onDelete }) {  
    return (  
        <div className="userRow">  
            <div className="userMain">  
                <div className="userId">#{user.id}</div>  
                <div className="userName">{user.name}</div>  
                <div className="userAge">{user.age} руб</div> 
                <div className="userText">{user.text}</div> 
            </div>  
  
            <div className="userActions">  
                <button className="btn" onClick={() => onEdit(user)}>  
                    Добавить в корзину  
                </button>  
                <button className="btn btn--danger" onClick={() => onDelete(user.id)}>  
                    Удалить из корзины
                </button>  
            </div>  
        </div>  
    );  
}
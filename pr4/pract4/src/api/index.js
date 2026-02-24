import axios from "axios";

const apiClient = axios.create({
    baseURL: "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json",
        "accept": "application/json",
    },
    // Гарантируем, что axios не будет кэшировать GET
    paramsSerializer: params => {
        // добавляем уникальный параметр для каждого запроса
        return Object.entries({ ...params, _: Date.now() })
            .map(([k, v]) => `${k}=${v}`)
            .join("&");
    }
});

export const api = {

    createUser: async (user) => {
        const response = await apiClient.post("/users", user);
        return response.data;
    },

    getUsers: async () => {
        const response = await apiClient.get("/users");
        return response.data;
    },

    getUserById: async (id) => {
        const response = await apiClient.get(`/users/${id}`, {
            params: { _: Date.now() } // добавляем уникальный параметр
        });
        return response.data;
    },

    updateUser: async (id, user) => {
        const response = await apiClient.patch(`/users/${id}`, user);
        return response.data;
    },

    deleteUser: async (id) => {
        const response = await apiClient.delete(`/users/${id}`);
        return response.data;
    }

};

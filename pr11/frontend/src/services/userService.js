import apiClient from '../api/axios';

export const userService = {
  getAll: async () => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },

  block: async (id) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};


import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchPujas = async () => {
  try {
    const response = await apiClient.get('/services/');
    return response.data;
  } catch (error) {
    console.error('Error fetching pujas:', error);
    throw error;
  }
};

export const fetchPujaById = async (id: number) => {
  try {
    const response = await apiClient.get(`/services/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching puja ${id}:`, error);
    throw error;
  }
};

export const fetchPanditServices = async (panditId: number) => {
  try {
    const response = await apiClient.get(`/pandits/${panditId}/services/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching services for pandit ${panditId}:`, error);
    throw error;
  }
};

export default apiClient;

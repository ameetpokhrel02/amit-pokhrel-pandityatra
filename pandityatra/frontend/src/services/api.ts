import axios from 'axios';
import { API_BASE_URL } from '@/lib/helper';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = apiClient;

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

// Video call related API calls
export const createVideoRoom = async (bookingId: number) => {
  const response = await api.get(`/video/room/${bookingId}/`);
  return response.data
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

export const fetchPanchang = async (date?: string, days: number = 1) => {
  try {
    const params: any = { days };
    if (date) params.date = date;
    const response = await apiClient.get('/panchang/data/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching panchang:', error);
    throw error;
  }
};

export default apiClient;

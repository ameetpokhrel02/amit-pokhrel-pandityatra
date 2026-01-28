import apiClient from './api-client';

export const getVideoRoom = async (bookingId: number) => {
  try {
    const response = await apiClient.get(`/video/room/${bookingId}/`);
    return response.data;
  } catch (error) {
    console.error('Failed to get video room:', error);
    throw error;
  }
};

export const createVideoToken = async (bookingId: number, roomUrl: string, isHost: boolean) => {
  try {
    const response = await apiClient.post('/video/create-token/', {
      booking_id: bookingId,
      room_url: roomUrl,
      is_host: isHost
    });
    return response.data;
  } catch (error) {
    console.error('Failed to create video token:', error);
    throw error;
  }
};
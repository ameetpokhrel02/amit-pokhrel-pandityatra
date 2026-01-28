// Fetch all chat messages for a booking's chat room
import apiClient from './api-client';

export async function fetchChatMessages(bookingId: number) {
  // First, get the chat room for this booking
  const roomRes = await apiClient.get(`/chat/rooms/?booking=${bookingId}`);
  const room = roomRes.data && roomRes.data.length > 0 ? roomRes.data[0] : null;
  if (!room) throw new Error('No chat room found for this booking');
  // Then, fetch all messages for this room
  const messagesRes = await apiClient.get(`/chat/rooms/${room.id}/messages/`);
  return messagesRes.data;
}

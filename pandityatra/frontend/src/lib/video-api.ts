// Fetch video room details including recording_url
export async function fetchVideoRoom(bookingId: number): Promise<{ room_name: string; status: string; recording_url?: string }> {
    const response = await apiClient.get(`/video/room/${bookingId}/`);
    return response.data;
}

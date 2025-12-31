import apiClient from './api-client';

// ----------------------
// Pandit APIs
// ----------------------
export interface Pandit {
    id: number;
    user: number;
    // 🚨 Nested user details from serializer
    user_details: {
        id: number;
        full_name: string;
        phone_number: string;
        email: string;
        profile_pic_url?: string;
    };
    expertise: string;
    experience_years: number;
    language: string;
    rating: number; // Decimal in backend, number here
    bio: string;
    is_available: boolean;
    is_verified: boolean;
    date_joined: string;
}

export async function fetchPandits(): Promise<Pandit[]> {
    const response = await apiClient.get('/pandits/');
    return response.data;
}

export async function fetchPandit(id: number): Promise<Pandit> {
    const response = await apiClient.get(`/pandits/${id}/`);
    return response.data;
}

export interface Puja {
    id: number;
    name: string; // Changed from title to name to match common convention, or use title if backend sends title
    description?: string;
    base_price: number;
    image?: string;
}

export async function fetchPanditServices(panditId: number): Promise<Puja[]> {
    const response = await apiClient.get(`/pandits/${panditId}/services/`);
    return response.data;
}

// ----------------------
// Recommender APIs
// ----------------------
export interface RecommendedPandit extends Pandit {
    recommendation_score: number;
}

export async function fetchRecommendations(): Promise<RecommendedPandit[]> {
    const response = await apiClient.get('/recommender/pandits/');
    return response.data;
}

// ----------------------
// Booking APIs
// ----------------------
// Fetches ALL available pujas (catalog)
export async function fetchAllPujas(): Promise<Puja[]> {
    const response = await apiClient.get('/services/');
    return response.data;
}

export interface Booking {
    id: number;
    user: number; // or object depending on serializer
    pandit: number; // or object
    pandit_name?: string; // helper for UI
    status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';
    booking_date: string;
    notes?: string;
}

export async function fetchBookings(): Promise<Booking[]> {
    const response = await apiClient.get('/bookings/');
    return response.data;
}

export async function createBooking(payload: Partial<Booking>) {
    const response = await apiClient.post('/bookings/', payload);
    return response.data;
}

export async function updateBookingStatus(id: number, status: string) {
    const response = await apiClient.patch(`/bookings/${id}/update_status/`, { status });
    return response.data;
}

// ----------------------
// Auth APIs
// ----------------------

export interface RegisterPayload {
    full_name: string;
    phone_number: string;
    email?: string;
    password?: string;
    role?: 'user' | 'pandit';
}

export async function registerUser(payload: RegisterPayload) {
    try {
        const response = await apiClient.post('/users/register/', payload);
        return response.data;
    } catch (error: any) {
        throw handleApiError(error);
    }
}

// Updated Payload to support email or phone
export async function requestLoginOtp(payload: { phone_number?: string; email?: string }) {
    try {
        const response = await apiClient.post('/users/request-otp/', payload);
        return response.data;
    } catch (error: any) {
        throw handleApiError(error);
    }
}

export async function verifyOtpAndGetToken(payload: { phone_number?: string; email?: string; otp_code: string }) {
    try {
        const response = await apiClient.post('/users/login-otp/', payload);
        return response.data;
    } catch (error: any) {
        throw handleApiError(error);
    }
}

export async function passwordLogin(payload: { phone_number: string; password: string }) {
    try {
        const response = await apiClient.post('/users/login-password/', payload);
        return response.data;
    } catch (error: any) {
        throw handleApiError(error);
    }
}

export async function fetchProfile() {
    // Interceptor handles the token, argument removed as it was unused
    const response = await apiClient.get('/users/profile/');
    return response.data;
}

// ----------------------
// Admin APIs
// ----------------------
export interface AdminStats {
    total_users: number;
    total_pandits: number;
    pending_verifications: number;
    system_status: string;
}

export async function fetchAdminStats(): Promise<AdminStats> {
    const response = await apiClient.get('/users/admin/stats/');
    return response.data;
}

// ----------------------
// Profile APIs
// ----------------------
export async function updateUserProfile(data: any) {
    const response = await apiClient.patch('/users/profile/', data);
    return response.data;
}

export async function updatePanditProfile(id: number, data: any) {
    const response = await apiClient.patch(`/pandits/${id}/`, data);
    return response.data;
}

// Helper to standardize error messages
function handleApiError(error: any) {
    if (error.response) {
        const data = error.response.data;
        if (data.detail) return new Error(data.detail);
        if (data.message) return new Error(data.message);
        // Flatten object errors
        if (typeof data === 'object') {
            const fieldErrors = Object.entries(data)
                .map(([field, errors]: [string, any]) => {
                    const errorList = Array.isArray(errors) ? errors : [errors];
                    return `${field}: ${errorList.join(', ')}`;
                })
                .join('; ');
            return new Error(fieldErrors);
        }
    }
    return error;
}
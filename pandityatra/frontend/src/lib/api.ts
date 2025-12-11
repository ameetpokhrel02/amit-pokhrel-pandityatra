// In frontend/src/lib/api.ts

import { buildUrl, authHeaders } from './helper';

// 🚨 CRITICAL: Ensure 'export' is here for the interface 🚨
export interface Pandit { 
    id: number;
    full_name: string;
    expertise: string;
    language: string;
    rating: number;
    bio: string;
    is_available: boolean;
    // Add other fields from your model as needed
}

/**
 * Fetches the list of all Pandits from the Django backend.
 */
export async function fetchPandits(): Promise<Pandit[]> {
    const url = buildUrl('/pandits/');
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch pandits (${response.status} ${response.statusText}) from ${url}`);
    }

    const data = await response.json();
    return data as Pandit[]; // Use type assertion
}

export async function fetchPandit(id: number): Promise<Pandit> {
    const url = buildUrl(`/pandits/${id}/`);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to fetch pandit ${id}: ${resp.status} ${resp.statusText}`);
    return await resp.json() as Pandit;
}

export interface Puja {
    id: number;
    title: string;
    price: number;
    duration_minutes?: number;
    description?: string;
}

export async function fetchPanditServices(panditId: number): Promise<Puja[]> {
    const url = buildUrl(`/pandits/${panditId}/services/`);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to fetch services for pandit ${panditId}: ${resp.status} ${resp.statusText}`);
    return await resp.json() as Puja[];
}

// ... rest of the file

// ----------------------
// Auth API helpers
// ----------------------

export interface RegisterPayload {
    full_name: string;
    phone_number: string;
    email?: string;
    password?: string;
    role?: 'user' | 'pandit';
}

export async function registerUser(payload: RegisterPayload) {
    const url = buildUrl('/users/register/');
    const resp = await fetch(url, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        // Handle different error formats from Django REST Framework
        let errorMessage = errorData.detail || errorData.message;
        
        // If it's a validation error object, extract field-specific errors
        if (!errorMessage && typeof errorData === 'object') {
            const fieldErrors = Object.entries(errorData)
                .map(([field, errors]: [string, any]) => {
                    const errorList = Array.isArray(errors) ? errors : [errors];
                    return `${field}: ${errorList.join(', ')}`;
                })
                .join('; ');
            errorMessage = fieldErrors || `Register failed: ${resp.status} ${resp.statusText}`;
        }
        
        throw new Error(errorMessage || `Register failed: ${resp.status} ${resp.statusText}`);
    }
    return await resp.json();
}

export interface LoginRequest {
    phone: string;
    otp?: string; // some backends accept otp in same endpoint
}

export async function requestLoginOtp(payload: { phone_number: string }) {
    const url = buildUrl('/users/request-otp/');
    const resp = await fetch(url, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.detail || `Request OTP failed: ${resp.status} ${resp.statusText}`);
    }
    return await resp.json();
}

export async function verifyOtpAndGetToken(payload: { phone_number: string; otp_code: string }) {
    const url = buildUrl('/users/login-otp/');
    const resp = await fetch(url, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.detail || `Verify OTP failed: ${resp.status} ${resp.statusText}`);
    }
    return await resp.json();
}

export async function passwordLogin(payload: { phone_number: string; password: string }) {
    const url = buildUrl('/users/login-password/');
    const resp = await fetch(url, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.detail || `Login failed: ${resp.status} ${resp.statusText}`);
    }
    return await resp.json();
}

export async function fetchProfile(token: string) {
    const url = buildUrl('/users/profile/');
    const resp = await fetch(url, {
        headers: authHeaders(token),
    });
    if (!resp.ok) throw new Error(`Profile fetch failed: ${resp.status} ${resp.statusText}`);
    return await resp.json();
}
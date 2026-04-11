import apiClient from '@/lib/api-client';

export interface SamagriRecommendation {
    id: number;
    puja_name: string;
    samagri_item: {
        id: number;
        name: string;
        base_price: string;
        primary_image_url: string | null;
    };
    confidence_score: number;
    is_essential: boolean;
    is_optional: boolean;
    category: string;
    quantity_default: number;
    unit: string;
    reason: string;
}

export interface PujaTemplate {
    id: number;
    name: string;
    puja_type: string;
    description: string;
    estimated_cost: string;
    is_featured: boolean;
    samagri_items: Array<{
        samagri_item: {
            id: number;
            name: string;
            base_price: string;
            primary_image_url: string | null;
        };
        quantity: number;
        unit: string;
        is_required: boolean;
    }>;
}

export const recommenderApi = {
    // 1. Get Standard/Rule-Based Recommendations for a Puja
    getRecommendationsByPuja: async (pujaId: number, limit = 10, minConfidence = 0.3) => {
        const response = await apiClient.get('/recommender/recommendations/by_puja/', {
            params: { puja_id: pujaId, limit, min_confidence: minConfidence }
        });
        return response.data;
    },

    // 2. Get Personalized Recommendations (favorites/frequent buys)
    getPersonalized: async (pujaId: number, limit = 10) => {
        const response = await apiClient.get('/recommender/recommendations/personalized/', {
            params: { puja_id: pujaId, limit }
        });
        return response.data;
    },

    // 3. Get Seasonal Recommendations (e.g., Shrawan month specific)
    getSeasonal: async (pujaId: number, limit = 10) => {
        const response = await apiClient.get('/recommender/recommendations/seasonal/', {
            params: { puja_id: pujaId, limit }
        });
        return response.data;
    },

    // 4. Templates (Admin Pre-configured bundles)
    getTemplates: async () => {
        const response = await apiClient.get('/recommender/templates/');
        return response.data;
    },
    
    // 5. User Preferences (Favorite or Never-recommend lists)
    getUserPreferences: async () => {
        const response = await apiClient.get('/recommender/user/preferences/');
        return response.data;
    },
    updatePreference: async (itemId: number, data: { is_favorite?: boolean, never_recommend?: boolean }) => {
        const response = await apiClient.post('/recommender/user/preferences/', {
            samagri_item_id: itemId,
            ...data
        });
        return response.data;
    },

    // 6. Analytics Logging
    // Trigger this when a user adds/removes items shown by the Recommender Engine
    logInteraction: async (bookingId: number, recommendationIds: number[], action: 'shown' | 'clicked' | 'purchased') => {
        // Note: The backend models map these to Booking tracking logic. 
        // We ensure data loop closes by sending stats back.
        const response = await apiClient.post('/recommender/logs/', {
            booking: bookingId,
            recommendation_ids: recommendationIds,
            action: action
        });
        return response.data;
    }
};

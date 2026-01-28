import { useState, useEffect } from 'react';
import { DateTime } from 'luxon';

export interface LocationData {
    latitude: number | null;
    longitude: number | null;
    timezone: string;
    isNepalTime: boolean;
    error: string | null;
    country: string | null;
    city: string | null;
    currency: 'NPR' | 'USD' | 'AUD';
    recommendedPaymentGateway: 'KHALTI' | 'STRIPE';
}

export const useLocation = () => {
    const [location, setLocation] = useState<LocationData>({
        latitude: null,
        longitude: null,
        timezone: DateTime.local().zoneName,
        isNepalTime: DateTime.local().zoneName === 'Asia/Kathmandu',
        error: null,
        country: null,
        city: null,
        currency: 'USD',
        recommendedPaymentGateway: 'STRIPE',
    });

    useEffect(() => {
        detectLocationAndTimezone();
    }, []);

    const detectLocationAndTimezone = async () => {
        // First, get browser timezone
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const isNepal = browserTimezone === 'Asia/Kathmandu';
        
        setLocation(prev => ({
            ...prev,
            timezone: browserTimezone,
            isNepalTime: isNepal,
            currency: isNepal ? 'NPR' : 'USD',
            recommendedPaymentGateway: isNepal ? 'KHALTI' : 'STRIPE'
        }));

        // Then try to get precise geolocation
        if (!navigator.geolocation) {
            setLocation(prev => ({ ...prev, error: 'Geolocation is not supported by your browser' }));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    // Reverse geocoding to get country/city
                    const locationData = await reverseGeocode(latitude, longitude);
                    
                    setLocation(prev => ({
                        ...prev,
                        latitude,
                        longitude,
                        country: locationData.country,
                        city: locationData.city,
                        currency: getCurrencyFromCountry(locationData.country),
                        recommendedPaymentGateway: getPaymentGatewayFromCountry(locationData.country),
                        error: null,
                    }));
                } catch (err) {
                    // Fallback to just coordinates
                    setLocation(prev => ({
                        ...prev,
                        latitude,
                        longitude,
                        error: null,
                    }));
                }
            },
            (error) => {
                setLocation(prev => ({ ...prev, error: error.message }));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes cache
            }
        );
    };

    const reverseGeocode = async (lat: number, lng: number) => {
        // Using a free geocoding service (you can replace with your preferred service)
        try {
            const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
            );
            const data = await response.json();
            return {
                country: data.countryName || null,
                city: data.city || data.locality || null,
            };
        } catch (error) {
            console.warn('Reverse geocoding failed:', error);
            return { country: null, city: null };
        }
    };

    const getCurrencyFromCountry = (country: string | null): 'NPR' | 'USD' | 'AUD' => {
        if (!country) return 'USD';
        
        const countryLower = country.toLowerCase();
        if (countryLower.includes('nepal')) return 'NPR';
        if (countryLower.includes('australia')) return 'AUD';
        return 'USD';
    };

    const getPaymentGatewayFromCountry = (country: string | null): 'KHALTI' | 'STRIPE' => {
        if (!country) return 'STRIPE';
        
        const countryLower = country.toLowerCase();
        if (countryLower.includes('nepal')) return 'KHALTI';
        return 'STRIPE';
    };

    /**
     * Converts any ISO date string or DateTime object to Nepal Time (Asia/Kathmandu)
     */
    const toNepalTime = (date: string | Date | DateTime) => {
        let dt: DateTime;
        if (typeof date === 'string') {
            dt = DateTime.fromISO(date);
        } else if (date instanceof Date) {
            dt = DateTime.fromJSDate(date);
        } else {
            dt = date;
        }
        return dt.setZone('Asia/Kathmandu');
    };

    /**
     * Formats a date for display, showing both local and Nepal time if they differ
     */
    const formatWithNepalTime = (date: string | Date | DateTime) => {
        const localDt = typeof date === 'string' ? DateTime.fromISO(date) : (date instanceof Date ? DateTime.fromJSDate(date) : date);
        const nepalDt = toNepalTime(date);

        const localStr = localDt.toFormat('ff');
        const nepalStr = nepalDt.toFormat('ff');

        if (location.isNepalTime) {
            return nepalStr;
        }

        return `${localStr} (Nepal: ${nepalStr})`;
    };

    /**
     * Get location context for AI recommendations
     */
    const getLocationContext = () => {
        return {
            timezone: location.timezone,
            country: location.country,
            city: location.city,
            currency: location.currency,
            coordinates: location.latitude && location.longitude ? 
                `${location.latitude},${location.longitude}` : null,
            isNepal: location.isNepalTime,
            recommendedGateway: location.recommendedPaymentGateway
        };
    };

    return {
        ...location,
        toNepalTime,
        formatWithNepalTime,
        getLocationContext,
        detectLocationAndTimezone,
    };
};

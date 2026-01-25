import { useState, useEffect } from 'react';
import { DateTime } from 'luxon';

export interface LocationData {
    latitude: number | null;
    longitude: number | null;
    timezone: string;
    isNepalTime: boolean;
    error: string | null;
}

export const useLocation = () => {
    const [location, setLocation] = useState<LocationData>({
        latitude: null,
        longitude: null,
        timezone: DateTime.local().zoneName,
        isNepalTime: DateTime.local().zoneName === 'Asia/Kathmandu',
        error: null,
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocation(prev => ({ ...prev, error: 'Geolocation is not supported by your browser' }));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation(prev => ({
                    ...prev,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    error: null,
                }));
            },
            (error) => {
                setLocation(prev => ({ ...prev, error: error.message }));
            }
        );
    }, []);

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

    return {
        ...location,
        toNepalTime,
        formatWithNepalTime,
    };
};

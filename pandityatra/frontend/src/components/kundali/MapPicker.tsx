import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Navigation, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Fix for default marker icon issue in Leaflet + Repact
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
    onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
    initialLat?: number;
    initialLng?: number;
    initialAddress?: string;
}

// Controller to update map view when search results are selected
const MapUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
};

const MapPicker: React.FC<MapPickerProps> = ({
    onLocationSelect,
    initialLat = 27.7172,
    initialLng = 85.3240,
    initialAddress = ''
}) => {
    const { t } = useTranslation();
    const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);
    const [searchQuery, setSearchQuery] = useState(initialAddress);
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Reverse geocode to get address from coordinates
    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            const address = data.display_name;
            setSearchQuery(address);
            onLocationSelect({ lat, lng, address });
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
        }
    };

    // Search for locations via Nominatim
    const handleSearch = async (query: string) => {
        if (!query) return;
        setLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
            );
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectResult = (result: any) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setPosition([lat, lng]);
        setSearchQuery(result.display_name);
        setSearchResults([]);
        onLocationSelect({ lat, lng, address: result.display_name });
    };

    // Map click handler
    const MapEvents = () => {
        useMapEvents({
            click(e) {
                const { lat, lng } = e.latlng;
                setPosition([lat, lng]);
                reverseGeocode(lat, lng);
            },
        });
        return null;
    };

    const handleMarkerDrag = (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        setPosition([lat, lng]);
        reverseGeocode(lat, lng);
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                            placeholder={t('search_location_placeholder', 'Search city or area...')}
                            className="pl-10"
                        />
                    </div>
                    <Button
                        onClick={() => handleSearch(searchQuery)}
                        disabled={loading}
                        variant="outline"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('search', 'Search')}
                    </Button>
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="absolute z-[1000] w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((result) => (
                            <button
                                key={result.place_id}
                                onClick={() => handleSelectResult(result)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-b last:border-0"
                            >
                                {result.display_name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-200 z-0">
                <MapContainer
                    center={position}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapEvents />
                    <MapUpdater center={position} />
                    <Marker
                        position={position}
                        draggable={true}
                        eventHandlers={{ dragend: handleMarkerDrag }}
                    />
                </MapContainer>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
                <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-orange-500" />
                    <span>Lat: {position[0].toFixed(4)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-orange-500" />
                    <span>Lng: {position[1].toFixed(4)}</span>
                </div>
                <div className="ml-auto flex items-center gap-1">
                    <Navigation className="h-3 w-3 text-blue-500" />
                    <span>Click to set, drag to refine</span>
                </div>
            </div>
        </div>
    );
};

export default MapPicker;

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Sun, Moon, Sparkles, ChevronRight } from 'lucide-react';
import { fetchPanchang } from '@/services/api';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import NepaliDate from 'bikram-sambat';

const NepaliMonthNames = ["Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];

const PanchangWidget: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const toNepaliNumeral = (num: number | string) => {
        const numerals: any = {
            '0': '०', '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'
        };
        return num.toString().split('').map(char => numerals[char] || char).join('');
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetchPanchang();
                if (response && response.length > 0) {
                    setData(response[0]);
                }
            } catch (err) {
                console.error('Panchang widget error:', err);
                setError(true);

                // Fallback logic using bikram-sambat library
                const today = new Date();
                const nepaliDate = new NepaliDate(today);
                setData({
                    date: format(today, 'yyyy-MM-dd'),
                    bs_date: nepaliDate.format('YYYY-MM-DD'),
                    tithi: "Loading...",
                    nakshatra: "Loading...",
                    festivals: [],
                    offline: true
                });
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <Card className="bg-white border-orange-100 shadow-sm overflow-hidden h-full">
                <CardHeader className="pb-2 border-b border-orange-50 bg-orange-50/30">
                    <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="group bg-white border-orange-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-orange-50 bg-gradient-to-r from-orange-50/50 to-white">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-orange-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-orange-600" />
                        Nepali Panchang
                    </CardTitle>
                    {data?.offline && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">
                            Offline
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 flex-grow">
                {/* BS Date Highlights */}
                <div className="text-center space-y-1">
                    <div className="text-3xl font-black text-[#3E2723] tracking-tighter flex items-center justify-center gap-2">
                        {NepaliMonthNames[data?.bs_month - 1]} {toNepaliNumeral(data?.bs_day)}
                    </div>
                    <div className="text-sm font-bold opacity-40 uppercase tracking-widest">
                        {toNepaliNumeral(data?.bs_year)} BS
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2">
                    <div className="bg-orange-50/40 p-3 rounded-2xl border border-orange-100/50 group-hover:bg-orange-50 transition-colors">
                        <div className="flex items-center gap-2 text-xs font-bold text-orange-800 mb-1">
                            <Sparkles className="w-3 h-3" />
                            Tithi
                        </div>
                        <div className="text-sm font-bold text-[#3E2723]">{data?.tithi}</div>
                    </div>
                    <div className="bg-yellow-50/30 p-3 rounded-2xl border border-yellow-100/50 group-hover:bg-yellow-50 transition-colors">
                        <div className="flex items-center gap-2 text-xs font-bold text-yellow-800 mb-1">
                            <Sun className="w-3 h-3" />
                            Nakshatra
                        </div>
                        <div className="text-sm font-bold text-[#3E2723]">{data?.nakshatra}</div>
                    </div>
                </div>

                {/* Festivals if any */}
                {data?.festivals && data.festivals.length > 0 && (
                    <div className="bg-red-50/50 border border-red-100 p-3 rounded-2xl animate-pulse">
                        <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Event / Festival</div>
                        <div className="text-sm font-bold text-red-800">{data.festivals[0]}</div>
                    </div>
                )}

                {!data?.festivals?.length && data?.muhurat_hints && (
                    <div className="flex items-start gap-2 text-sm text-[#3E2723]/70 font-medium">
                        <Moon className="w-4 h-4 text-orange-400 mt-0.5" />
                        <p className="leading-tight">{data.muhurat_hints}</p>
                    </div>
                )}
            </CardContent>

            <Link
                to="/calendar"
                className="p-4 bg-orange-50/30 border-t border-orange-50 group-hover:bg-orange-200/40 transition-all flex items-center justify-center gap-2 text-sm font-bold text-orange-800"
            >
                View Full Month
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
        </Card>
    );
};

export default PanchangWidget;

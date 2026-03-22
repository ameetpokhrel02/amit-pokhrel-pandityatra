import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useTranslation } from 'react-i18next';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ChevronLeft,
    ChevronRight,
    Sun,
    Moon,
    Sparkles,
    Calendar as CalendarIcon,
    AlertCircle,
    CalendarDays
} from 'lucide-react';
import { fetchPanchang } from '@/services/api';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    getDay,
    isSameDay,
    isToday
} from 'date-fns';

const NepaliMonthNames = ["Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];

const PanchangCalendar: React.FC = () => {
    const { t } = useTranslation();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [panchangData, setPanchangData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<any>(null);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDay = getDay(monthStart);

    useEffect(() => {
        const loadPanchang = async () => {
            setLoading(true);
            try {
                const data = await fetchPanchang(format(monthStart, 'yyyy-MM-dd'), 31);
                setPanchangData(data || []);

                const today = new Date();
                const initialSelected = isSameDay(today, currentMonth) ? today : monthStart;
                const found = data?.find((d: any) => isSameDay(new Date(d.date), initialSelected));
                setSelectedDate(found || null);
            } catch (err) {
                console.error('Failed to load month panchang:', err);
            } finally {
                setLoading(false);
            }
        };
        loadPanchang();
    }, [currentMonth]);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const setMonth = (monthIdx: string) => {
        const newDate = new Date(currentMonth.getFullYear(), parseInt(monthIdx), 1);
        setCurrentMonth(newDate);
    };
    const setYear = (year: string) => {
        const newDate = new Date(parseInt(year), currentMonth.getMonth(), 1);
        setCurrentMonth(newDate);
    };

    const getDayPanchang = (date: Date) => {
        return panchangData.find(d => isSameDay(new Date(d.date), date));
    };

    const toNepaliNumeral = (num: number | string | undefined | null) => {
        if (!num) return '';
        const numerals: any = {
            '0': '०', '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'
        };
        return num.toString().split('').map(char => numerals[char] || char).join('');
    };

    const renderHeader = () => {
        const years = Array.from({ length: 10 }, (_, i) => 2024 + i);
        const months = t('panchang.months', { returnObjects: true }) as string[];

        return (
            <div className="flex flex-col gap-4 mb-6 md:mb-10">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="bg-orange-600 p-1.5 md:p-2 rounded-lg md:rounded-xl text-white">
                                <CalendarDays className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <h1 className="text-2xl md:text-4xl font-black text-[#3E2723] tracking-tight">{t('panchang.nepali_patro')}</h1>
                        </div>
                        <p className="text-orange-600 font-bold uppercase tracking-[0.2em] text-[8px] md:text-[10px] ml-9 md:ml-11">
                            {t('panchang.spiritual_calendar_guidance')}
                        </p>
                    </div>
                    {/* Mobile prev/next arrows */}
                    <div className="flex gap-1 md:hidden">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-lg hover:bg-orange-100 text-orange-600 w-8 h-8">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-lg hover:bg-orange-100 text-orange-600 w-8 h-8">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 bg-white p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-orange-100 shadow-sm w-fit">
                    <Select value={currentMonth.getMonth().toString()} onValueChange={setMonth}>
                        <SelectTrigger className="w-[100px] md:w-[140px] border-none bg-orange-50/50 hover:bg-orange-50 font-bold text-orange-800 rounded-lg md:rounded-xl focus:ring-0 text-xs md:text-sm h-8 md:h-10">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-orange-100 shadow-xl">
                            {months.map((m, i) => (
                                <SelectItem key={m} value={i.toString()} className="font-medium text-[#3E2723] focus:bg-orange-50 focus:text-orange-700">
                                    {m}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={currentMonth.getFullYear().toString()} onValueChange={setYear}>
                        <SelectTrigger className="w-[80px] md:w-[100px] border-none bg-orange-50/50 hover:bg-orange-50 font-bold text-orange-800 rounded-lg md:rounded-xl focus:ring-0 text-xs md:text-sm h-8 md:h-10">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-orange-100 shadow-xl">
                            {years.map(y => (
                                <SelectItem key={y} value={y.toString()} className="font-medium text-[#3E2723] focus:bg-orange-50 focus:text-orange-700">
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="hidden md:block h-8 w-px bg-orange-100 mx-1" />

                    <div className="hidden md:flex gap-1">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl hover:bg-orange-100 text-orange-600">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl hover:bg-orange-100 text-orange-600">
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const shortDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        return (
            <div className="grid grid-cols-7 mb-3 md:mb-6 gap-1 md:gap-2">
                {days.map((day, i) => (
                    <div key={day} className="text-center">
                        <div className="bg-orange-600 text-white rounded-lg md:rounded-xl py-1.5 md:py-2 px-0.5 md:px-1 text-[8px] md:text-[10px] font-black uppercase tracking-wider shadow-sm shadow-orange-200">
                            <span className="hidden sm:inline">{day}</span>
                            <span className="sm:hidden">{shortDays[i]}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const cells = [];
        for (let i = 0; i < startDay; i++) {
            cells.push(<div key={`empty-${i}`} className="aspect-square opacity-0" />);
        }

        daysInMonth.forEach(day => {
            const data = getDayPanchang(day);
            const isTodayDate = isToday(day);
            const isSelected = selectedDate && isSameDay(new Date(selectedDate.date), day);
            const hasFestival = data?.festivals?.length > 0;

            cells.push(
                <div
                    key={day.toString()}
                    onClick={() => setSelectedDate(data)}
                    className={`
                        relative aspect-[1/1.1] md:aspect-square border-t border-l border-orange-100 cursor-pointer transition-all duration-300
                        hover:bg-orange-50/80 flex flex-col p-1 md:p-2 group rounded-lg md:rounded-xl
                        ${isTodayDate ? 'bg-orange-50 ring-2 ring-inset ring-orange-200 z-10' : 'bg-white'}
                        ${isSelected ? 'bg-[#FF6F00] border-none shadow-2xl md:scale-105 z-20' : ''}
                        ${hasFestival ? 'bg-red-50/40' : ''}
                    `}
                >
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <span className={`text-sm md:text-xl font-black leading-none ${isSelected ? 'text-white' : 'text-[#3E2723]'}`}>
                                {data ? toNepaliNumeral(data.bs_day) : ''}
                            </span>
                            <span className={`text-[7px] md:text-[9px] font-bold mt-0.5 md:mt-1 ${isSelected ? 'text-orange-100' : 'text-orange-600/60'}`}>
                                {data ? data.bs_day : ''}
                            </span>
                        </div>
                        <div className={`text-[7px] md:text-[10px] font-bold px-1 md:px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {format(day, 'd')}
                        </div>
                    </div>

                    {data && (
                        <div className="mt-auto space-y-0.5 md:space-y-1 overflow-hidden">
                            {hasFestival && (
                                <div className="flex items-center gap-0.5 md:gap-1">
                                    <Sparkles className={`w-2 h-2 md:w-2.5 md:h-2.5 flex-shrink-0 ${isSelected ? 'text-yellow-300' : 'text-red-500'}`} />
                                    <div className={`text-[5px] md:text-[7px] font-bold truncate ${isSelected ? 'text-white' : 'text-red-600'}`}>
                                        {data.festivals[0]}
                                    </div>
                                </div>
                            )}
                            <div className={`text-[6px] md:text-[8px] font-bold px-0.5 md:px-1 py-0.5 rounded bg-black/5 inline-block truncate max-w-full ${isSelected ? 'text-white bg-white/10' : 'text-[#3E2723]/60'}`}>
                                {data.tithi}
                            </div>
                        </div>
                    )}
                </div>
            );
        });

        const totalCells = Math.ceil((startDay + daysInMonth.length) / 7) * 7;
        for (let i = cells.length; i < totalCells; i++) {
            cells.push(<div key={`empty-end-${i}`} className="aspect-square opacity-20 bg-gray-50/30 rounded-xl" />);
        }

        return cells;
    };

    return (
        <div className="min-h-screen bg-[#FDFBF9] flex flex-col">
            <Navbar />

            <main className="flex-grow container mx-auto px-2 sm:px-4 py-16 md:py-20 lg:py-24 max-w-6xl">
                <div className="grid lg:grid-cols-3 gap-6 md:gap-12">
                    <div className="lg:col-span-2 order-2 lg:order-1">
                        {renderHeader()}
                        {renderDays()}
                        <div className="gap-1 md:gap-2 grid grid-cols-7 bg-white/50 p-1 md:p-2 rounded-2xl md:rounded-3xl border border-orange-100 shadow-inner overflow-hidden">
                            {renderCells()}
                        </div>

                        <div className="mt-4 md:mt-8 flex flex-wrap items-center gap-3 md:gap-6 justify-center text-[9px] md:text-xs font-bold text-orange-800/60 uppercase tracking-widest">
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#FF6F00]" /> Date
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-orange-50 ring-1 ring-orange-200" /> Today
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 text-red-400" /> Festival
                            </div>
                        </div>
                    </div>

                    <div className="order-1 lg:order-2">
                        {selectedDate ? (
                            <Card className="sticky top-24 bg-white border-orange-100 shadow-xl overflow-hidden animate-fade-in-up">
                                <div className="h-32 bg-gradient-to-br from-[#FF6F00] to-red-600 p-6 flex flex-col justify-end">
                                    <div className="text-3xl font-black text-white tracking-tighter flex items-baseline gap-2">
                                        {NepaliMonthNames[selectedDate.bs_month - 1]} {toNepaliNumeral(selectedDate.bs_day)}, {toNepaliNumeral(selectedDate.bs_year)}
                                    </div>
                                    <div className="text-orange-100 text-xs font-bold uppercase tracking-widest mt-1">
                                        {format(new Date(selectedDate.date), 'EEEE, MMMM do')} | BS {selectedDate.bs_year}-{selectedDate.bs_month}-{selectedDate.bs_day}
                                    </div>
                                </div>

                                <CardContent className="p-0">
                                    <div className="divide-y divide-orange-50">
                                        <DetailRow icon={<Sparkles />} label="Tithi" value={selectedDate.tithi} />
                                        <DetailRow icon={<Sun />} label="Nakshatra" value={selectedDate.nakshatra} />
                                        <DetailRow icon={<Moon />} label="Yoga" value={selectedDate.yoga} />
                                        <DetailRow icon={<CalendarIcon />} label="Karana" value={selectedDate.karana} />

                                        <div className="p-6 grid grid-cols-2 gap-4">
                                            <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100/50 text-center">
                                                <div className="text-[10px] font-bold text-orange-800 uppercase mb-1">Sunrise</div>
                                                <div className="text-sm font-black text-[#3E2723]">{selectedDate.sunrise}</div>
                                            </div>
                                            <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100/50 text-center">
                                                <div className="text-[10px] font-bold text-orange-800 uppercase mb-1">Sunset</div>
                                                <div className="text-sm font-black text-[#3E2723]">{selectedDate.sunset}</div>
                                            </div>
                                        </div>

                                        {selectedDate.festivals?.length > 0 && (
                                            <div className="p-6 bg-red-50/30">
                                                <div className="text-xs font-bold text-red-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4" />
                                                    Festivals & Events
                                                </div>
                                                <div className="space-y-2">
                                                    {selectedDate.festivals.map((f: string, idx: number) => (
                                                        <div key={idx} className="bg-white p-3 rounded-xl border border-red-100 shadow-sm text-sm font-bold text-red-800">
                                                            {f}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedDate.muhurat_hints && (
                                            <div className="p-6 bg-orange-50/20">
                                                <div className="text-xs font-bold text-orange-800 uppercase tracking-widest mb-2">Muhurat Guidance</div>
                                                <p className="text-sm font-medium text-[#3E2723]/70 italic leading-relaxed">
                                                    "{selectedDate.muhurat_hints}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-orange-50/20 rounded-3xl border-2 border-dashed border-orange-100 italic text-orange-800/40 font-medium">
                                <CalendarIcon className="w-12 h-12 mb-4 opacity-20" />
                                Select a date to view <br /> detailed Panchang
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

const DetailRow = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="p-4 flex items-center justify-between hover:bg-orange-50/30 transition-colors">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100/50 flex items-center justify-center text-orange-600">
                {React.cloneElement(icon, { className: 'w-4 h-4' })}
            </div>
            <span className="text-sm font-bold text-[#3E2723]/60">{label}</span>
        </div>
        <span className="text-sm font-bold text-[#3E2723]">{value}</span>
    </div>
);

export default PanchangCalendar;

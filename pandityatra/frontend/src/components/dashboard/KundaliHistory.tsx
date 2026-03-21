import React, { useEffect, useState } from 'react';
import { getSavedKundalis } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, MapPin, Eye, FileText, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FaSpinner } from 'react-icons/fa';
import { pdf } from '@react-pdf/renderer';
import { KundaliPDF } from '@/pages/Kundali/KundaliPDF';
import { KundaliChart } from '@/pages/Kundali/KundaliChart';

const KundaliHistory: React.FC = () => {
    const [charts, setCharts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChart, setSelectedChart] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    useEffect(() => {
        fetchCharts();
    }, []);

    const fetchCharts = async () => {
        try {
            const data = await getSavedKundalis();
            setCharts(data);
        } catch (error) {
            console.error("Failed to fetch Kundali history", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (chart: any) => {
        setSelectedChart(chart);
        setIsDetailOpen(true);
    };

    const handleDownloadPDF = async (chart: any) => {
        try {
            setDownloadingId(chart.id);
            const dobParts = chart.dob ? chart.dob.split('-') : [];
            const timeParts = chart.time ? String(chart.time).split(':') : [];
            const formData = {
                name: `Chart #${chart.id}`,
                gender: '',
                year: dobParts[0] || '',
                month: dobParts[1] || '',
                day: dobParts[2] || '',
                hour: timeParts[0] || '',
                minute: timeParts[1] || '',
                place: chart.place || `${chart.latitude}, ${chart.longitude}`,
            };
            const result = {
                planets: chart.planets || [],
                ai_prediction: chart.ai_prediction || 'No prediction available.',
                source: 'online' as const,
            };
            const pdfDoc = <KundaliPDF formData={formData} result={result} />;
            const blob = await pdf(pdfDoc).toBlob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `PanditYatra_Kundali_${chart.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("PDF download failed:", error);
        } finally {
            setDownloadingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (charts.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Saved Kundalis</h3>
                <p className="text-muted-foreground mb-6">Generate your birth chart to see it here.</p>
                <Button onClick={() => window.location.href = '/kundali'}>Generate Now</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {charts.map((chart) => (
                    <Card key={chart.id} className="hover:shadow-lg transition-all border-primary/10">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex justify-between items-center">
                                <span>Chart #{chart.id}</span>
                                <Badge variant="secondary" className="bg-orange-100 text-orange-700">Saved</Badge>
                            </CardTitle>
                            <CardDescription>{new Date(chart.created_at).toLocaleDateString()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" /> {chart.dob}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-4 w-4" /> {String(chart.time)}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="h-4 w-4 truncate" /> {chart.place}
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-primary text-primary hover:bg-orange-50"
                                    onClick={() => handleViewDetails(chart)}
                                >
                                    <Eye className="mr-2 h-4 w-4" /> View
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                                    onClick={() => handleDownloadPDF(chart)}
                                    disabled={downloadingId === chart.id}
                                >
                                    {downloadingId === chart.id ? (
                                        <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                                    ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                    )}
                                    PDF
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            🪐 Kundali Analysis
                        </DialogTitle>
                        <DialogDescription>
                            Comprehensive breakdown of your cosmic alignment.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedChart && (
                        <div className="space-y-8 mt-4">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Date</p>
                                    <p className="font-semibold text-[#3E2723]">{selectedChart.dob}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Time</p>
                                    <p className="font-semibold text-[#3E2723]">{String(selectedChart.time)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Place</p>
                                    <p className="font-semibold text-[#3E2723] truncate" title={selectedChart.place}>{selectedChart.place?.split(',')[0]}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Generated</p>
                                    <p className="font-semibold text-[#3E2723]">{new Date(selectedChart.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Lagna Chart */}
                            <div className="flex flex-col items-center">
                                <h4 className="font-bold text-[#E65100] mb-4 text-center text-lg uppercase tracking-widest">Lagna Chart (D1)</h4>
                                <KundaliChart 
                                    planets={selectedChart.planets || []} 
                                    lagna={selectedChart.lagna || 1} 
                                />
                            </div>

                            {/* Planetary Positions */}
                            {selectedChart.planets && selectedChart.planets.length > 0 && (
                                <div className="bg-muted/30 p-6 rounded-xl border">
                                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                        🌟 Planetary Positions
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedChart.planets.map((p: any) => (
                                            <div key={p.planet} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-sm">
                                                <span className="font-medium">{p.planet}</span>
                                                <div className="flex gap-4 text-muted-foreground">
                                                    <span>{p.rashi}</span>
                                                    <span className="text-xs bg-orange-50 px-2 py-0.5 rounded">{p.nakshatra}</span>
                                                    <span className="text-xs">{Number(p.longitude).toFixed(2)}°</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AI Prediction */}
                            {selectedChart.ai_prediction && (
                                <div className="bg-orange-50/50 p-6 rounded-xl border border-orange-100">
                                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                        🔮 AI Prediction
                                    </h4>
                                    <p className="text-sm text-[#3E2723]/80 whitespace-pre-line leading-relaxed">
                                        {selectedChart.ai_prediction}
                                    </p>
                                </div>
                            )}

                            {/* Download PDF */}
                            <Button
                                className="w-full bg-primary text-white hover:bg-primary/90"
                                onClick={() => handleDownloadPDF(selectedChart)}
                                disabled={downloadingId === selectedChart.id}
                            >
                                {downloadingId === selectedChart.id ? (
                                    <FaSpinner className="animate-spin mr-2" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                )}
                                Download Full PDF Report
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default KundaliHistory;

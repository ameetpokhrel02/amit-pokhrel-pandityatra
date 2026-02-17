import React, { useEffect, useState } from 'react';
import { getSavedKundalis } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, MapPin, Eye, FileText, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const KundaliHistory: React.FC = () => {
    const [charts, setCharts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChart, setSelectedChart] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

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
                                    <Clock className="h-4 w-4" /> {chart.time}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="h-4 w-4 truncate" /> {chart.place}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full mt-4 border-primary text-primary hover:bg-orange-50"
                                onClick={() => handleViewDetails(chart)}
                            >
                                <Eye className="mr-2 h-4 w-4" /> View Analysis
                            </Button>
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
                                    <p className="font-semibold text-[#3E2723]">{selectedChart.time}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Place</p>
                                    <p className="font-semibold text-[#3E2723] truncate" title={selectedChart.place}>{selectedChart.place.split(',')[0]}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Generated</p>
                                    <p className="font-semibold text-[#3E2723]">{new Date(selectedChart.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Planetes (Mock logic since list view doesn't have nested data by default, 
                                but in a real app we'd fetch specific ID details or backend would include them) */}
                            <div className="bg-muted/30 p-6 rounded-xl border">
                                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Eye className="h-5 w-5 text-primary" /> Visual Details
                                </h4>
                                <p className="text-muted-foreground">
                                    Detailed planetary data and visual charts are currently available in the download report.
                                    A full interactive SVG chart is being prepared for the next release.
                                </p>
                                <Button className="mt-4 bg-primary text-white hover:bg-primary/90" onClick={() => window.open('/kundali', '_blank')}>
                                    <Download className="mr-2 h-4 w-4" /> Download Full PDF
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default KundaliHistory;

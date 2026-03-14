import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PanditCalendar } from '@/components/pandit/PanditCalendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CalendarDays, Loader2 } from 'lucide-react';
import { fetchPanchang } from '@/services/api';
import { format } from 'date-fns';

type PanchangItem = {
  date: string;
  bs_date?: string;
  tithi?: string;
  festivals?: string[];
  muhurat_hints?: string;
};

const PanditCalendarPage = () => {
  const [panchangData, setPanchangData] = useState<PanchangItem[]>([]);
  const [loadingHighlights, setLoadingHighlights] = useState(true);

  useEffect(() => {
    const loadHighlights = async () => {
      setLoadingHighlights(true);
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const data = await fetchPanchang(today, 30);
        setPanchangData(Array.isArray(data) ? data : []);
      } catch {
        setPanchangData([]);
      } finally {
        setLoadingHighlights(false);
      }
    };
    loadHighlights();
  }, []);

  const upcomingFestivals = useMemo(() => {
    const items: Array<{
      date: string;
      bs_date?: string;
      festival: string;
      tithi?: string;
      muhurat_hints?: string;
    }> = [];

    for (const d of panchangData) {
      if (!Array.isArray(d.festivals) || d.festivals.length === 0) continue;
      for (const festival of d.festivals) {
        items.push({
          date: d.date,
          bs_date: d.bs_date,
          festival,
          tithi: d.tithi,
          muhurat_hints: d.muhurat_hints,
        });
      }
    }

    return items.slice(0, 8);
  }, [panchangData]);

  const festivalDateKeys = useMemo(() => {
    const set = new Set<string>();
    for (const d of panchangData) {
      if (Array.isArray(d.festivals) && d.festivals.length > 0) {
        set.add(d.date);
      }
    }
    return Array.from(set);
  }, [panchangData]);

  return (
    <DashboardLayout userRole="pandit">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">Manage your availability, blocked slots, and upcoming puja schedule.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PanditCalendar festivalDateKeys={festivalDateKeys} />
          </div>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
                Festival Highlights
              </CardTitle>
              <CardDescription>Upcoming festivals & auspicious days (next 30 days)</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHighlights ? (
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
                </div>
              ) : upcomingFestivals.length === 0 ? (
                <div className="text-sm text-muted-foreground">No highlighted festivals in the next 30 days.</div>
              ) : (
                <div className="space-y-3">
                  {upcomingFestivals.map((f, idx) => (
                    <div key={`${f.date}-${f.festival}-${idx}`} className="rounded-xl border p-3 bg-white">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm">{f.festival}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {format(new Date(f.date), 'EEE, MMM d')} {f.bs_date ? `• BS ${f.bs_date}` : ''}
                          </p>
                        </div>
                        {f.tithi ? <Badge variant="outline">{f.tithi}</Badge> : null}
                      </div>
                      {f.muhurat_hints ? (
                        <p className="text-xs text-orange-700 mt-2">{f.muhurat_hints}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PanditCalendarPage;

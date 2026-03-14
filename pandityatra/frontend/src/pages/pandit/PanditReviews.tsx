import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, Loader2 } from 'lucide-react';
import { fetchPanditMyReviews } from '@/lib/api';

type PanditReview = {
  id: number;
  customer_name: string;
  customer_avatar: string | null;
  pandit_name: string;
  service_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

const StarRow = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`h-4 w-4 ${s <= Math.round(rating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
      />
    ))}
  </div>
);

const PanditReviews = () => {
  const [reviews, setReviews] = useState<PanditReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPanditMyReviews();
        setReviews((data || []) as PanditReview[]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const summary = useMemo(() => {
    const total = reviews.length;
    const avg = total ? reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / total : 0;
    return { total, avg: Number(avg.toFixed(1)) };
  }, [reviews]);

  return (
    <DashboardLayout userRole="pandit">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground">Customer ratings and feedback for your completed pujas.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Average Rating</CardTitle>
              <CardDescription>Overall customer satisfaction</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-4xl font-bold">{summary.avg}</div>
              <StarRow rating={summary.avg} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Reviews</CardTitle>
              <CardDescription>Total reviews received so far</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{summary.total}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Customer Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-36 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="h-28 flex items-center justify-center text-muted-foreground">
                No reviews yet.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="p-4 rounded-xl border bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={r.customer_avatar || undefined} />
                          <AvatarFallback>{(r.customer_name || 'U').charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{r.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <StarRow rating={Number(r.rating)} />
                        <Badge variant="outline" className="mt-1">{r.service_name || 'Puja Service'}</Badge>
                      </div>
                    </div>
                    {r.comment ? <p className="mt-3 text-sm text-gray-700">{r.comment}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PanditReviews;

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquareHeart, Send, Star, CheckCircle2 } from 'lucide-react';
import { fetchSiteReviews, submitSiteReview } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const PanditAppFeedback = () => {
  const { toast } = useToast();
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackHover, setFeedbackHover] = useState(0);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [appAvgRating, setAppAvgRating] = useState(0);
  const [appTotalReviews, setAppTotalReviews] = useState(0);

  useEffect(() => {
    fetchSiteReviews()
      .then((data) => {
        setAppAvgRating(data.average_rating);
        setAppTotalReviews(data.total_reviews);
      })
      .catch(() => undefined);
  }, []);

  const handleFeedbackSubmit = async () => {
    if (feedbackRating === 0) {
      toast({ title: 'Please select a rating', variant: 'destructive' });
      return;
    }
    if (!feedbackComment.trim()) {
      toast({ title: 'Please write your feedback', variant: 'destructive' });
      return;
    }

    setFeedbackSubmitting(true);
    try {
      await submitSiteReview({ rating: feedbackRating, comment: feedbackComment.trim() });
      setFeedbackSubmitted(true);
      toast({ title: 'Feedback submitted', description: 'Thank you for your feedback.' });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to submit feedback.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <DashboardLayout userRole="pandit">
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">App Feedback</h1>
          <p className="text-muted-foreground">Rate your experience and suggest improvements for PanditYatra.</p>
        </div>

        <Card className="border-orange-100 bg-gradient-to-r from-orange-50/50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100">
                <Star className="h-6 w-6 text-orange-600 fill-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">PanditYatra App Rating</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={16} className={s <= Math.round(appAvgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                    ))}
                  </div>
                  <span className="font-bold text-lg">{appAvgRating}</span>
                  <span className="text-sm text-muted-foreground">({appTotalReviews} reviews)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {feedbackSubmitted ? (
          <Card className="border-green-200 bg-green-50/30">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-800">Thank You!</h3>
              <p className="text-green-600 mt-2">Your feedback has been submitted successfully.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareHeart className="h-5 w-5 text-orange-600" />
                Share Your Feedback
              </CardTitle>
              <CardDescription>How has your experience been as a pandit on our platform?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">How would you rate PanditYatra?</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFeedbackRating(s)}
                      onMouseEnter={() => setFeedbackHover(s)}
                      onMouseLeave={() => setFeedbackHover(0)}
                      className="transition-transform hover:scale-125 p-1"
                    >
                      <Star
                        size={32}
                        className={s <= (feedbackHover || feedbackRating) ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Your Feedback</label>
                <Textarea
                  placeholder="Share what you like and what can be improved..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  className="min-h-[120px] border-slate-200 focus:border-orange-400"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">{feedbackComment.length}/500</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleFeedbackSubmit}
                disabled={feedbackSubmitting}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold text-base py-5"
              >
                {feedbackSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
                Submit Feedback
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PanditAppFeedback;

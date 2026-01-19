
import type { PanditReview } from "@/lib/api";
import { RatingStars } from "./RatingStars";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ReviewsListProps {
    reviews: PanditReview[];
}

export const ReviewsList = ({ reviews }: ReviewsListProps) => {
    if (!reviews || reviews.length === 0) {
        return (
            <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                No reviews yet. Be the first to book!
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Reviews & Ratings</h3>
            {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start gap-4">
                        <Avatar className="w-10 h-10 border border-gray-200">
                            <AvatarImage src={review.customer_avatar || ""} />
                            <AvatarFallback>{review.customer_name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900">{review.customer_name || "Anonymous User"}</span>
                                <span className="text-xs text-gray-400">
                                    {new Date(review.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <RatingStars rating={review.rating} size={14} />
                            <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                                {review.comment}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};


import { Star, StarHalf } from "lucide-react";

interface RatingStarsProps {
    rating: number;
    count?: number; // Optional review count to display
    color?: string;
    size?: number;
}

export const RatingStars = ({ rating, count, color = "text-yellow-500", size = 16 }: RatingStarsProps) => {
    // Fill stars
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0; // Simplified

    return (
        <div className="flex items-center gap-1">
            <div className="flex">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={size}
                        className={`${i < fullStars
                                ? `${color} fill-current`
                                : i === fullStars && rating > i ? `${color} fill-current opacity-50` // Rough half star approximation or use distinct icon
                                    : "text-gray-300"
                            }`}
                    />
                ))}
            </div>
            {count !== undefined && (
                <span className="text-sm text-gray-500 ml-1">({count})</span>
            )}
        </div>
    );
};

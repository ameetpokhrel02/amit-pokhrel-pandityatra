
import type { Pandit } from "@/lib/api";
import { RatingStars } from "./RatingStars";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShieldCheck, MapPin, Languages } from "lucide-react";

interface ProfileHeaderProps {
    pandit: Pandit;
}

export const ProfileHeader = ({ pandit }: ProfileHeaderProps) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">

                {/* Photo */}
                <div className="w-full md:w-auto flex justify-center">
                    <Avatar className="w-32 h-32 border-4 border-orange-50 shadow-md">
                        <AvatarImage src={pandit.user_details.profile_pic_url || ""} />
                        <AvatarFallback className="text-4xl bg-orange-100 text-orange-600">
                            {pandit.user_details.full_name?.charAt(0) || "P"}
                        </AvatarFallback>
                    </Avatar>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                        <h1 className="text-3xl font-bold text-gray-900">{pandit.user_details.full_name}</h1>
                        {pandit.is_verified && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 gap-1 px-2.5 py-0.5">
                                <ShieldCheck size={14} />
                                Verified
                            </Badge>
                        )}
                    </div>

                    <div className="flex justify-center md:justify-start">
                        <RatingStars rating={pandit.rating} count={pandit.review_count} size={20} />
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 justify-center md:justify-start mt-2">
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={16} className="text-green-600" />
                            <span>{pandit.experience_years}+ Years Experience</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Languages size={16} className="text-orange-600" />
                            <span>{pandit.language}</span>
                        </div>
                    </div>

                    {/* Bio */}
                    <p className="text-gray-600 leading-relaxed mt-2 text-center md:text-left">
                        {pandit.bio || `Specialist in ${pandit.expertise} with over ${pandit.experience_years} years of experience practicing vedic rituals.`}
                    </p>

                    {/* Expertise Tags */}
                    <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                        {pandit.expertise.split(',').map((skill, index) => (
                            <Badge key={index} variant="outline" className="bg-gray-50 border-gray-200 text-gray-600">
                                {skill.trim()}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

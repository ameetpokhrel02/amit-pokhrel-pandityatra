import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FaRing, 
  FaHome, 
  FaBaby, 
  FaGraduationCap,
  FaStar,
  FaArrowRight
} from 'react-icons/fa';
import { 
  GiTempleDoor, 
  GiPrayerBeads, 
  GiLotusFlower,
  GiCandles,
  GiIncense,
  GiMeditation
} from 'react-icons/gi';

interface PujaCategory {
  id: number;
  name: string;
  icon: React.ReactNode;
  image: string;
  startingPrice: number;
  description: string;
  popularityRank: number;
  estimatedDuration: string;
  isPopular: boolean;
  gradient: string;
}

const PujaCategories: React.FC = () => {
  const categories: PujaCategory[] = [
    {
      id: 1,
      name: "Ganesh Puja",
      icon: <GiTempleDoor className="h-8 w-8" />,
      image: "/src/assets/images/religious.png",
      startingPrice: 2500,
      description: "Remove obstacles and bring prosperity",
      popularityRank: 1,
      estimatedDuration: "45-60 mins",
      isPopular: true,
      gradient: "from-primary to-primary/80"
    },
    {
      id: 2,
      name: "Lakshmi Puja",
      icon: <GiLotusFlower className="h-8 w-8" />,
      image: "/src/assets/images/aarati.png",
      startingPrice: 3000,
      description: "Attract wealth and abundance",
      popularityRank: 2,
      estimatedDuration: "60-75 mins",
      isPopular: true,
      gradient: "from-primary/80 to-primary"
    },
    {
      id: 3,
      name: "Marriage Ceremony",
      icon: <FaRing className="h-8 w-8" />,
      image: "/src/assets/images/marriage.png",
      startingPrice: 15000,
      description: "Sacred wedding rituals and blessings",
      popularityRank: 3,
      estimatedDuration: "3-4 hours",
      isPopular: true,
      gradient: "from-pink-400 to-red-500"
    },
    {
      id: 4,
      name: "Griha Pravesh",
      icon: <FaHome className="h-8 w-8" />,
      image: "/src/assets/images/grahiaprabesh.png",
      startingPrice: 5000,
      description: "House warming and blessing ceremony",
      popularityRank: 4,
      estimatedDuration: "90-120 mins",
      isPopular: false,
      gradient: "from-green-400 to-blue-500"
    },
    {
      id: 5,
      name: "Naming Ceremony",
      icon: <FaBaby className="h-8 w-8" />,
      image: "/src/assets/images/naming.png",
      startingPrice: 3500,
      description: "Namkaran ritual for newborns",
      popularityRank: 5,
      estimatedDuration: "60-90 mins",
      isPopular: false,
      gradient: "from-blue-400 to-purple-500"
    },
    {
      id: 6,
      name: "Thread Ceremony",
      icon: <FaGraduationCap className="h-8 w-8" />,
      image: "/src/assets/images/rakhi.png",
      startingPrice: 8000,
      description: "Sacred thread initiation ceremony",
      popularityRank: 6,
      estimatedDuration: "2-3 hours",
      isPopular: false,
      gradient: "from-indigo-400 to-purple-600"
    },
    {
      id: 7,
      name: "Durga Puja",
      icon: <GiCandles className="h-8 w-8" />,
      image: "/src/assets/images/religious.png",
      startingPrice: 4000,
      description: "Divine mother worship for protection",
      popularityRank: 7,
      estimatedDuration: "75-90 mins",
      isPopular: true,
      gradient: "from-red-400 to-pink-500"
    },
    {
      id: 8,
      name: "Saraswati Puja",
      icon: <GiIncense className="h-8 w-8" />,
      image: "/src/assets/images/aarati.png",
      startingPrice: 2800,
      description: "Goddess of knowledge and wisdom",
      popularityRank: 8,
      estimatedDuration: "45-60 mins",
      isPopular: false,
      gradient: "from-cyan-400 to-blue-500"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 mb-4">
            <GiPrayerBeads className="h-4 w-4 text-primary" />
            <span className="text-primary text-sm font-medium">Sacred Ceremonies</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Popular Puja Categories
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose from our wide range of traditional ceremonies and spiritual services
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categories.map((category, index) => (
            <Card 
              key={category.id}
              className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 border-0 shadow-lg cursor-pointer animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${category.image})` }}
              />
              
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t ${category.gradient} opacity-80 group-hover:opacity-90 transition-opacity duration-300`} />
              
              {/* Popular Badge */}
              {category.isPopular && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 animate-pulse">
                    <FaStar className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                </div>
              )}

              <CardContent className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
                {/* Icon and Title */}
                <div>
                  <div className="text-white/90 mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-200 transition-colors duration-300">
                    {category.name}
                  </h3>
                  <p className="text-white/90 text-sm mb-4 leading-relaxed">
                    {category.description}
                  </p>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">Duration:</span>
                    <span className="font-medium">{category.estimatedDuration}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white/80 text-sm">Starting from</span>
                      <div className="text-2xl font-bold text-yellow-200">
                        ₹{category.startingPrice.toLocaleString()}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
                    >
                      Book Now
                    </Button>
                  </div>
                </div>

                {/* Hover Effect Arrow */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <FaArrowRight className="h-5 w-5 text-yellow-200" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="text-3xl font-bold text-primary mb-2">50+</div>
            <div className="text-gray-600 text-sm">Puja Types</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="text-3xl font-bold text-primary mb-2">10K+</div>
            <div className="text-gray-600 text-sm">Ceremonies Done</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="text-3xl font-bold text-primary mb-2">500+</div>
            <div className="text-gray-600 text-sm">Expert Pandits</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="text-3xl font-bold text-primary mb-2">4.9★</div>
            <div className="text-gray-600 text-sm">Average Rating</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary to-primary/80 text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-8">
              <GiMeditation className="h-12 w-12 mx-auto mb-4 text-primary-foreground/80" />
              <h3 className="text-2xl font-bold mb-4">
                Can't Find Your Ceremony?
              </h3>
              <p className="text-primary-foreground/80 mb-6 leading-relaxed">
                We offer personalized puja services for all occasions. 
                Contact our experts to create a custom ceremony just for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/custom-puja">
                  <Button 
                    size="lg" 
                    variant="secondary"
                    className="bg-white text-primary hover:bg-gray-50 transition-all duration-300 hover:scale-110"
                  >
                    Request Custom Puja
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 transition-all duration-300 hover:scale-110"
                  >
                    Contact Expert
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PujaCategories;
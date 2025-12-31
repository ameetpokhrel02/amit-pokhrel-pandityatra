import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FaUserCheck,
  FaCalendarAlt,
  FaVideo,
  FaDownload,
  FaPlay,
  FaCheckCircle,
  FaArrowRight,
  FaClock,
  FaShoppingCart
} from 'react-icons/fa';
import {
  GiTempleDoor,
  GiPrayerBeads,
  GiIncense,
  GiScrollUnfurled
} from 'react-icons/gi';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}

const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);

  const steps: Step[] = [
    {
      id: 1,
      title: "Choose Pandit & Puja",
      description: "Select your preferred pandit and ceremony type from our verified experts",
      icon: <FaUserCheck className="h-8 w-8" />,
      details: [
        "Browse 500+ verified pandits",
        "Filter by location, language & expertise",
        "Read reviews and ratings",
        "Compare prices and availability"
      ],
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      id: 2,
      title: "Select Date & Samagri",
      description: "Pick your preferred date, time and choose from our curated samagri packages",
      icon: <FaCalendarAlt className="h-8 w-8" />,
      details: [
        "Choose convenient date & time",
        "Select samagri package or customize",
        "Add special requirements",
        "Confirm booking with secure payment"
      ],
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      id: 3,
      title: "Join Live Video Puja",
      description: "Participate in your personalized puja ceremony through high-quality video call",
      icon: <FaVideo className="h-8 w-8" />,
      details: [
        "HD video call with your pandit",
        "Real-time interaction and guidance",
        "Follow along with mantras",
        "Ask questions during ceremony"
      ],
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    },
    {
      id: 4,
      title: "Receive Recording & Kundali",
      description: "Get your puja recording and personalized Kundali report for future reference",
      icon: <FaDownload className="h-8 w-8" />,
      details: [
        "Download HD puja recording",
        "Receive detailed Kundali report",
        "Get mantras and instructions PDF",
        "Access lifetime in your account"
      ],
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    }
  ];

  const features = [
    {
      icon: <FaClock className="h-6 w-6" />,
      title: "24/7 Availability",
      description: "Book pujas anytime, anywhere"
    },
    {
      icon: <FaCheckCircle className="h-6 w-6" />,
      title: "100% Authentic",
      description: "Traditional rituals by verified pandits"
    },
    {
      icon: <FaShoppingCart className="h-6 w-6" />,
      title: "Complete Packages",
      description: "Samagri included in every booking"
    },
    {
      icon: <GiScrollUnfurled className="h-6 w-6" />,
      title: "Digital Records",
      description: "Lifetime access to recordings & reports"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-orange-50/30 to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-orange-100 rounded-full px-4 py-2 mb-4">
            <GiPrayerBeads className="h-4 w-4 text-orange-500" />
            <span className="text-orange-700 text-sm font-medium">Simple Process</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience authentic puja ceremonies in just four simple steps
          </p>
        </div>

        {/* Steps Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {steps.map((step) => (
            <Button
              key={step.id}
              variant={activeStep === step.id ? "default" : "outline"}
              className={`transition-all duration-300 hover:scale-105 ${activeStep === step.id
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "hover:bg-orange-50 border-orange-200"
                }`}
              onClick={() => setActiveStep(step.id)}
            >
              <span className="mr-2">{step.id}</span>
              {step.title}
            </Button>
          ))}
        </div>

        {/* Steps Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Steps Cards */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <Card
                key={step.id}
                className={`transition-all duration-500 cursor-pointer hover:shadow-xl ${activeStep === step.id
                    ? `${step.borderColor} border-2 shadow-lg scale-105`
                    : "border hover:border-orange-200"
                  } animate-in fade-in slide-in-from-left-4`}
                style={{ animationDelay: `${index * 150}ms` }}
                onClick={() => setActiveStep(step.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Step Number */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full ${step.bgColor} ${step.color} flex items-center justify-center font-bold text-lg transition-all duration-300 ${activeStep === step.id ? "scale-110" : ""
                      }`}>
                      {step.id}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`${step.color} transition-transform duration-300 ${activeStep === step.id ? "scale-110" : ""
                          }`}>
                          {step.icon}
                        </div>
                        <h3 className={`text-xl font-bold transition-colors duration-300 ${activeStep === step.id ? step.color : "text-gray-800"
                          }`}>
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 mb-4">
                        {step.description}
                      </p>

                      {/* Step Details */}
                      {activeStep === step.id && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          {step.details.map((detail, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                              <FaCheckCircle className={`h-4 w-4 ${step.color}`} />
                              <span>{detail}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Arrow for active step */}
                    {activeStep === step.id && (
                      <div className={`${step.color} animate-in zoom-in`}>
                        <FaArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Visual Representation */}
          <div className="relative">
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-2xl overflow-hidden">
              <CardContent className="p-8 relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-4">
                    <GiTempleDoor className="h-24 w-24" />
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <GiIncense className="h-20 w-20" />
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-4">
                      <FaPlay className="h-4 w-4" />
                      <span className="text-sm font-medium">Watch Demo</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-4">
                      Experience the Magic
                    </h3>
                    <p className="text-orange-100 leading-relaxed">
                      See how thousands of families have connected with their spiritual roots through our platform
                    </p>
                  </div>

                  {/* Demo Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                      <div className="text-2xl font-bold mb-1">15 min</div>
                      <div className="text-orange-200 text-sm">Avg. Setup Time</div>
                    </div>
                    <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                      <div className="text-2xl font-bold mb-1">HD Quality</div>
                      <div className="text-orange-200 text-sm">Video & Audio</div>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full bg-white text-orange-600 hover:bg-orange-50 transition-all duration-300 hover:scale-105"
                  >
                    <FaPlay className="h-5 w-5 mr-2" />
                    Watch How It Works
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="text-center hover:shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1 border-orange-100 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="text-orange-500 mb-4 flex justify-center transition-transform duration-300 hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-2 text-gray-800">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-4 mb-6">
                <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500">
                  <FaCheckCircle className="h-3 w-3 mr-1" />
                  Trusted by 10,000+ families
                </Badge>
              </div>
              <h3 className="text-3xl font-bold mb-4">
                Ready to Begin Your Spiritual Journey?
              </h3>
              <p className="text-orange-100 mb-8 text-lg leading-relaxed">
                Join thousands of satisfied customers who have experienced authentic puja ceremonies from the comfort of their homes
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-orange-600 hover:bg-orange-50 transition-all duration-300 hover:scale-110"
                >
                  Book Your First Puja
                  <FaArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 transition-all duration-300 hover:scale-110"
                >
                  Explore Pandits
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
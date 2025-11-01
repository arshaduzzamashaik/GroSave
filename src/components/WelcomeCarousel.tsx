// src/components/WelcomeCarousel.tsx
import { useMemo, useState } from 'react';
import { Coins, Calendar, MapPin, ChevronRight } from 'lucide-react';

interface Slide {
  icon: any;
  heading: string;
  description: string;
}

interface WelcomeCarouselProps {
  onGetStarted: () => void;
  /**
   * Optional: show the actual monthly credit if you already know it.
   * If not provided, we show a friendly default (4000).
   * This is intentionally *not* fetched here because onboarding
   * usually happens before the user is authenticated.
   */
  monthlyCredit?: number;
}

export function WelcomeCarousel({ onGetStarted, monthlyCredit = 4000 }: WelcomeCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Build slides from props to avoid hardcoding the monthly credit copy.
  const slides: Slide[] = useMemo(
    () => [
      {
        icon: Coins,
        heading: `Get ${monthlyCredit.toLocaleString()} Free GroCoins Monthly`,
        description: 'No subscription, no hidden costs. Shop for groceries using free coins.',
      },
      {
        icon: Calendar,
        heading: 'Near-Expiry Food, Safe & Nutritious',
        description:
          'Quality checked groceries before their best-before date. Save money, save the planet.',
      },
      {
        icon: MapPin,
        heading: 'Pickup from Nearby Hubs',
        description: 'Reserve online, collect from your neighborhood. Simple and convenient.',
      },
    ],
    [monthlyCredit]
  );

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((s) => s + 1);
    } else {
      onGetStarted();
    }
  };

  const goToSlide = (index: number) => setCurrentSlide(index);

  const CurrentIcon = slides[currentSlide].icon;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-12 flex justify-center">
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-100 to-green-100 flex items-center justify-center">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#3D3B6B] to-[#5CB85C] flex items-center justify-center">
                <CurrentIcon className="w-20 h-20 text-white" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          <h2 className="text-gray-900 text-2xl text-center mb-4">
            {slides[currentSlide].heading}
          </h2>
          <p className="text-gray-600 text-center text-lg mb-12">
            {slides[currentSlide].description}
          </p>

          <div className="flex justify-center gap-2 mb-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? 'bg-[#3D3B6B] w-8' : 'bg-gray-300 w-2'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-full bg-[#3D3B6B] text-white py-4 rounded-xl text-lg hover:bg-[#2d2950] transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            {currentSlide < slides.length - 1 ? (
              <>
                Next
                <ChevronRight className="w-5 h-5" />
              </>
            ) : (
              'Get Started'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

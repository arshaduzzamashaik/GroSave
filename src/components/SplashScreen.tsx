// src/components/SplashScreen.tsx
import { useEffect } from 'react';
import { ShoppingBasket, Leaf } from 'lucide-react';
import { getToken } from '../lib/api';

interface SplashScreenProps {
  onContinue: () => void;
  /** If true, skip splash automatically when a user token already exists */
  autoSkipIfLoggedIn?: boolean;
  /** Optional app name override */
  appName?: string;
  /** Optional tagline override */
  tagline?: string;
}

export function SplashScreen({
  onContinue,
  autoSkipIfLoggedIn = true,
  appName = 'GroSave',
  tagline = 'Affordable Nutrition, Zero Waste',
}: SplashScreenProps) {
  // If already authenticated, jump straight ahead
  useEffect(() => {
    if (!autoSkipIfLoggedIn) return;
    const token = getToken();
    if (token) {
      // small delay for a smoother UX
      const t = setTimeout(onContinue, 250);
      return () => clearTimeout(t);
    }
  }, [autoSkipIfLoggedIn, onContinue]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3D3B6B] to-[#5a5896] flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center mb-12">
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <ShoppingBasket className="w-20 h-20 text-white" strokeWidth={1.5} />
          </div>
          <div className="absolute -top-2 -right-2 w-16 h-16 rounded-full bg-[#5CB85C] flex items-center justify-center shadow-lg">
            <Leaf className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-white text-4xl mb-2 text-center">{appName}</h1>
        <p className="text-purple-200 text-center text-lg">{tagline}</p>
      </div>

      <button
        onClick={onContinue}
        className="bg-white text-[#3D3B6B] px-12 py-4 rounded-full text-lg hover:bg-gray-100 transition-colors shadow-lg"
        aria-label="Continue"
      >
        Continue
      </button>
    </div>
  );
}

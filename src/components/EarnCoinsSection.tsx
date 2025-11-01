// src/components/EarnCoinsSection.tsx
import { useState } from "react";
import { Play, Clipboard, Share2, Gift, Sparkles } from "lucide-react";
import { api } from "../lib/api";

type CardId = "ads" | "surveys" | "referral" | "special";

const baseEarnCards = [
  {
    id: "ads" as const,
    icon: Play,
    title: "Watch Video Ads",
    amount: 50,
    buttonText: "Watch Now",
    subtext: "Watch & earn instantly",
    isSpecial: false,
  },
  {
    id: "surveys" as const,
    icon: Clipboard,
    title: "Brand Surveys",
    amount: 100,
    buttonText: "Start Survey",
    subtext: "~2 minutes",
    isSpecial: false,
  },
  {
    id: "referral" as const,
    icon: Share2,
    title: "Invite a Friend",
    amount: 200,
    buttonText: "Share Link",
    subtext: "Earn when they join",
    isSpecial: false,
  },
  {
    id: "special" as const,
    icon: Gift,
    title: "Diwali Bonus",
    amount: 500,
    buttonText: "Claim Now",
    subtext: "Limited time offer",
    isSpecial: true,
  },
];

export function EarnCoinsSection() {
  // simple per-card UI state
  const [loading, setLoading] = useState<Record<CardId, boolean>>({
    ads: false,
    surveys: false,
    referral: false,
    special: false,
  });
  const [message, setMessage] = useState<Record<CardId, string | null>>({
    ads: null,
    surveys: null,
    referral: null,
    special: null,
  });
  // track ad progress locally (for UX only)
  const [adsWatchedToday, setAdsWatchedToday] = useState(0);

  async function handleEarnByAd() {
    setLoading((s) => ({ ...s, ads: true }));
    setMessage((m) => ({ ...m, ads: null }));
    try {
      // backend will credit (e.g., 10 coins per your demo); amount shown on the card is a marketing number
      const res = await api.earnByAd("demo-ad-1");
      setAdsWatchedToday((n) => n + 1);
      setMessage((m) => ({
        ...m,
        ads: res?.success
          ? `Credited +${res.credited} GroCoins`
          : "No credit available right now",
      }));
    } catch (e: any) {
      const err =
        e?.message ||
        e?.error ||
        (typeof e === "string" ? e : "Something went wrong");
      setMessage((m) => ({ ...m, ads: `Failed: ${err}` }));
    } finally {
      setLoading((s) => ({ ...s, ads: false }));
    }
  }

  function notYetImplemented(id: CardId) {
    setMessage((m) => ({
      ...m,
      [id]:
        id === "surveys"
          ? "Surveys coming soon"
          : id === "referral"
          ? "Referral rewards coming soon"
          : "Special bonus coming soon",
    }));
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-yellow-500" />
        <h2 className="text-gray-900">Earn Bonus Coins</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {baseEarnCards.map((card) => {
          const isAds = card.id === "ads";
          const isSpecial = card.isSpecial;
          const onClick =
            card.id === "ads"
              ? handleEarnByAd
              : () => notYetImplemented(card.id);
          const isLoading = loading[card.id];
          const msg = message[card.id];

          // derive subtext for ads (UX only)
          const subtext =
            card.id === "ads"
              ? `${adsWatchedToday}/5 ads watched today`
              : card.subtext;

          return (
            <div
              key={card.id}
              className={`rounded-xl p-4 shadow-sm ${
                isSpecial
                  ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300"
                  : "bg-white"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                  isSpecial
                    ? "bg-gradient-to-br from-yellow-400 to-orange-400"
                    : "bg-purple-100"
                }`}
              >
                <card.icon
                  className={`w-6 h-6 ${
                    isSpecial ? "text-white" : "text-[#3D3B6B]"
                  }`}
                />
              </div>

              <h3 className="text-gray-900 mb-2">{card.title}</h3>

              <div
                className={`inline-block px-3 py-1 rounded-full text-sm mb-3 ${
                  isSpecial
                    ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white"
                    : "bg-[#5CB85C] text-white"
                }`}
              >
                +{card.amount} GroCoins
              </div>

              <button
                onClick={onClick}
                disabled={isLoading || (isAds && adsWatchedToday >= 5)}
                className={`w-full py-2 rounded-lg transition-colors mb-2 ${
                  isSpecial
                    ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white hover:from-yellow-500 hover:to-orange-500 disabled:opacity-60"
                    : "border-2 border-[#3D3B6B] text-[#3D3B6B] hover:bg-purple-50 disabled:opacity-60"
                }`}
              >
                {isLoading ? "Processing..." : card.buttonText}
              </button>

              <p className="text-xs text-gray-500 text-center">
                {msg ? msg : subtext}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

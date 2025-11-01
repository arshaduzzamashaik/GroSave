// src/components/HomePage.tsx
import { useCallback, useState } from "react";
import { Header } from "./Header";
import { GroCoinWallet } from "./GroCoinWallet";
import { SearchBar } from "./SearchBar";
import { CategoryFilters } from "./CategoryFilters";
import { ProductGrid } from "./ProductGrid";
import { BottomNav } from "./BottomNav";
import type { Product } from "./ProductGrid";

interface HomePageProps {
  onProductClick: (product: Product) => void;
  onNavigate: (view: "home" | "wallet" | "orders" | "profile") => void;
}

export function HomePage({ onProductClick, onNavigate }: HomePageProps) {
  // Lifted state so SearchBar + CategoryFilters can drive ProductGrid queries
  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("All");

  const handleOpenNotifications = useCallback(() => {
    // Open notifications screen/sheet if you add one later.
  }, []);

  return (
    <div className="pb-20">
      <Header onOpenNotifications={handleOpenNotifications} />

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        <div className="animate-[fadeIn_0.5s_ease-out]">
          <GroCoinWallet />
        </div>

        <div className="animate-[fadeIn_0.5s_ease-out_0.1s_both]">
          {/* Keep only onSearch — remove defaultValue to match your SearchBar props */}
          <SearchBar onSearch={setSearch} />
        </div>

        <div className="animate-[fadeIn_0.5s_ease-out_0.2s_both]">
          {/* Keep only onChange — remove selected to match your CategoryFilters props */}
          <CategoryFilters onChange={setCategory} />
        </div>

        <div className="animate-[fadeIn_0.5s_ease-out_0.3s_both]">
          <ProductGrid category={category} search={search} onProductClick={onProductClick} />
        </div>
      </main>

      <BottomNav activeTab="home" onNavigate={onNavigate} />
    </div>
  );
}

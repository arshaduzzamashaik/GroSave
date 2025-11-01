// src/components/OrdersTabs.tsx
interface OrdersTabsProps {
  activeTab: "active" | "past";
  onTabChange: (tab: "active" | "past") => void;

  /** Optional: show counts fetched from the backend */
  activeCount?: number;
  pastCount?: number;

  /** Optional: if you're loading counts, show subtle placeholders */
  loadingCounts?: boolean;
}

export function OrdersTabs({
  activeTab,
  onTabChange,
  activeCount,
  pastCount,
  loadingCounts = false,
}: OrdersTabsProps) {
  const Tab = ({
    id,
    label,
    isActive,
    count,
  }: {
    id: "active" | "past";
    label: string;
    isActive: boolean;
    count?: number;
  }) => {
    const base =
      "pb-3 px-1 transition-colors relative inline-flex items-center gap-2";
    const active = isActive ? "text-[#3D3B6B]" : "text-gray-400 hover:text-gray-600";

    return (
      <button
        onClick={() => onTabChange(id)}
        className={`${base} ${active}`}
        role="tab"
        aria-selected={isActive}
        aria-controls={`panel-${id}`}
        id={`tab-${id}`}
      >
        <span>{label}</span>

        {/* Count badge (hidden if undefined) */}
        {typeof count === "number" && (
          <span
            className={`text-xs rounded-full px-2 py-0.5 ${
              isActive ? "bg-[#3D3B6B] text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            {loadingCounts ? "…" : count}
          </span>
        )}

        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3D3B6B]" />
        )}
      </button>
    );
  };

  return (
    <div
      className="flex gap-6 mb-6 border-b border-gray-200"
      role="tablist"
      aria-label="Orders tabs"
    >
      <Tab
        id="active"
        label="Active"
        isActive={activeTab === "active"}
        count={activeCount}
      />
      <Tab
        id="past"
        label="Past Orders"
        isActive={activeTab === "past"}
        count={pastCount}
      />
    </div>
  );
}

// src/components/ProfilePage.tsx
import { useCallback } from "react";
import { ProfileHeader } from "./ProfileHeader";
import { UserProfileCard } from "./UserProfileCard";
import { FamilyDetailsCard } from "./FamilyDetailsCard";
import { SettingsMenu } from "./SettingsMenu";
import { ImpactDashboard } from "./ImpactDashboard";
import { LogoutButton } from "./LogoutButton";
import { BottomNav } from "./BottomNav";

interface ProfilePageProps {
  onNavigate: (view: "home" | "wallet" | "orders" | "profile") => void;
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const handleEditProfile = useCallback(() => {
    console.info("Edit profile clicked");
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <ProfileHeader onEdit={handleEditProfile} showName />

      <main className="px-4 py-6 max-w-md mx-auto space-y-4">
        <UserProfileCard />
        <FamilyDetailsCard />
        <SettingsMenu />
        <ImpactDashboard />
        {/* Remove onLogout prop to match your current LogoutButtonProps */}
        <LogoutButton />
      </main>

      <BottomNav activeTab="profile" onNavigate={onNavigate} />
    </div>
  );
}

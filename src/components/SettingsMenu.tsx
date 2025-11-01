// src/components/SettingsMenu.tsx
import {
  Globe,
  Bell,
  MapPin,
  FileText,
  HelpCircle,
  Info,
  FileCheck,
  ChevronRight,
  Dot
} from 'lucide-react';
import { useMemo } from 'react';

type IconType = typeof Globe;

type SettingId =
  | 'language'
  | 'notifications'
  | 'hubs'
  | 'policy'
  | 'support'
  | 'about'
  | 'terms';

interface SettingItem {
  id: SettingId;
  icon: IconType;
  title: string;
  subtitle?: string;
  rightBadge?: string | null;
  emphasis?: boolean; // render accent dot if true (e.g., unread)
  onClick?: () => void;
}

export interface SettingsMenuProps {
  /** Handlers (wire these to your modals/routes/screens) */
  onOpenLanguage?: () => void;
  onOpenNotifications?: () => void;
  onOpenHubs?: () => void;
  onOpenPolicy?: () => void; // Fair Use / Household Limits
  onOpenSupport?: () => void; // FAQ / contact
  onOpenAbout?: () => void;
  onOpenTerms?: () => void;

  /** Dynamic values to surface */
  languageLabel?: string; // e.g., "English"
  hasUnreadNotifs?: boolean; // shows a subtle dot
  preferredHubsCount?: number; // e.g., 2 => "Manage your 2 hubs"
  fairUseSummary?: string; // override subtitle for policy
}

export function SettingsMenu({
  onOpenLanguage,
  onOpenNotifications,
  onOpenHubs,
  onOpenPolicy,
  onOpenSupport,
  onOpenAbout,
  onOpenTerms,
  languageLabel = 'English',
  hasUnreadNotifs = false,
  preferredHubsCount,
  fairUseSummary,
}: SettingsMenuProps) {
  const settings: SettingItem[] = useMemo(
    () => [
      {
        id: 'language',
        icon: Globe,
        title: 'Language Preference',
        subtitle: `Current: ${languageLabel}`,
        onClick: onOpenLanguage,
      },
      {
        id: 'notifications',
        icon: Bell,
        title: 'Notification Settings',
        subtitle: 'Price drops, new items, pickup reminders',
        emphasis: !!hasUnreadNotifs,
        onClick: onOpenNotifications,
      },
      {
        id: 'hubs',
        icon: MapPin,
        title: 'Preferred Pickup Hubs',
        subtitle:
          typeof preferredHubsCount === 'number'
            ? (preferredHubsCount > 0
                ? `Manage your ${preferredHubsCount} hub${preferredHubsCount > 1 ? 's' : ''}`
                : 'No hubs added yet')
            : 'Manage your favorite hubs',
        onClick: onOpenHubs,
      },
      {
        id: 'policy',
        icon: FileText,
        title: 'Fair Use Policy',
        subtitle: fairUseSummary ?? 'View household limits and guidelines',
        onClick: onOpenPolicy,
      },
      {
        id: 'support',
        icon: HelpCircle,
        title: 'Help & Support',
        subtitle: 'FAQs, contact support',
        onClick: onOpenSupport,
      },
      {
        id: 'about',
        icon: Info,
        title: 'About GroSave',
        subtitle: 'Our mission, CSR partners, impact metrics',
        onClick: onOpenAbout,
      },
      {
        id: 'terms',
        icon: FileCheck,
        title: 'Terms & Privacy',
        subtitle: 'Legal information',
        onClick: onOpenTerms,
      },
    ],
    [
      languageLabel,
      hasUnreadNotifs,
      preferredHubsCount,
      fairUseSummary,
      onOpenLanguage,
      onOpenNotifications,
      onOpenHubs,
      onOpenPolicy,
      onOpenSupport,
      onOpenAbout,
      onOpenTerms,
    ]
  );

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {settings.map((setting, index) => {
        const RightAdornment = () => (
          <div className="flex items-center gap-2">
            {setting.emphasis && (
              <span className="relative inline-flex items-center">
                <Dot className="w-5 h-5 text-[#FF8C42]" />
              </span>
            )}
            {setting.rightBadge ? (
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                {setting.rightBadge}
              </span>
            ) : null}
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </div>
        );

        const isLast = index === settings.length - 1;
        const Icon = setting.icon;

        return (
          <button
            key={setting.id}
            onClick={setting.onClick}
            className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
              !isLast ? 'border-b border-gray-100' : ''
            }`}
            aria-label={setting.title}
          >
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-[#3D3B6B]" />
            </div>

            <div className="flex-1 text-left min-w-0">
              <h3 className="text-gray-900 mb-0.5">{setting.title}</h3>
              {setting.subtitle && (
                <p className="text-sm text-gray-500 truncate">{setting.subtitle}</p>
              )}
            </div>

            <RightAdornment />
          </button>
        );
      })}
    </div>
  );
}

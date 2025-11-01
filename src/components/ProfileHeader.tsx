// src/components/ProfileHeader.tsx
import { Edit } from 'lucide-react';
import { useMemo } from 'react';

function decodeJWT<T = any>(token?: string | null): T | null {
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function getUserDisplayName(): string | null {
  try {
    const token = localStorage.getItem('token');
    const payload = decodeJWT<{ name?: string; phone?: string; sub?: string }>(token);
    return payload?.name || payload?.phone || null;
  } catch {
    return null;
  }
}

interface ProfileHeaderProps {
  /** Optional: handle Edit click (open profile form / sheet) */
  onEdit?: () => void;
  /** If true, shows the user name next to “Profile” when available */
  showName?: boolean;
}

export function ProfileHeader({ onEdit, showName = true }: ProfileHeaderProps) {
  const name = useMemo(() => (showName ? getUserDisplayName() : null), [showName]);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-[#3D3B6B]">
          Profile{ name ? <span className="text-gray-500"> · {name}</span> : null }
        </h1>

        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit profile"
          className="p-2 hover:bg-purple-50 rounded-full transition-colors"
        >
          <Edit className="w-6 h-6 text-[#3D3B6B]" />
        </button>
      </div>
    </header>
  );
}

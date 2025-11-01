// src/components/UserProfileCard.tsx
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { API_BASE, getToken } from '../lib/api';

type UserProfile = {
  id: string;
  name?: string | null;
  phone?: string | null;
  eligibilityStatus?: 'eligible' | 'ineligible' | 'pending' | string | null;
  isVerified?: boolean | null;
};

function initialsFromName(name?: string | null) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const chars = parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
  return chars || 'U';
}

export function UserProfileCard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Best-effort load of the current user profile
  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      try {
        const token = getToken();
        if (!token) {
          // no session — show a minimal placeholder
          if (mounted) {
            setProfile({
              id: 'anon',
              name: 'Guest',
              phone: '',
              eligibilityStatus: 'pending',
              isVerified: false,
            });
          }
          return;
        }

        // Try backend /api/users/me (recommended)
        const res = await fetch(`${API_BASE}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = (await res.json()) as UserProfile;
          if (mounted) setProfile(data);
        } else {
          // Fallback: decode name/phone from JWT (if present)
          const [, payload] = token.split('.');
          let decoded: any = {};
          try {
            decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
          } catch {
            // ignore
          }
          if (mounted) {
            setProfile({
              id: decoded?.sub ?? 'me',
              name: decoded?.name ?? 'You',
              phone: decoded?.phone ?? '',
              eligibilityStatus: decoded?.eligibilityStatus ?? 'pending',
              isVerified: !!decoded?.isVerified,
            });
          }
        }
      } catch {
        // Silent fallback to a safe placeholder
        if (mounted) {
          setProfile({
            id: 'me',
            name: 'You',
            phone: '',
            eligibilityStatus: 'pending',
            isVerified: false,
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const name = profile?.name || 'You';
  const phone = profile?.phone || '';
  const isVerified =
    profile?.isVerified === true || profile?.eligibilityStatus === 'eligible';

  const initials = useMemo(() => initialsFromName(name), [name]);

  if (loading) {
    // Simple skeleton
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col items-center">
          <div className="mb-4 h-24 w-24 rounded-full bg-gray-200 animate-pulse" />
          <div className="mb-2 h-5 w-40 rounded bg-gray-200 animate-pulse" />
          <div className="mb-3 h-4 w-48 rounded bg-gray-100 animate-pulse" />
          <div className="h-8 w-44 rounded-full bg-gray-100 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col items-center">
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#3D3B6B] bg-gradient-to-br from-[#3D3B6B] to-[#5CB85C] text-3xl text-white">
          {initials}
        </div>

        <h2 className="mb-1 text-gray-900">{name}</h2>
        {phone ? <p className="mb-3 text-gray-500">{phone}</p> : null}

        {isVerified ? (
          <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-[#5CB85C]">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Verified Household</span>
          </div>
        ) : (
          <div className="rounded-full bg-yellow-50 px-4 py-2 text-sm text-yellow-700">
            Verification pending
          </div>
        )}
      </div>
    </div>
  );
}

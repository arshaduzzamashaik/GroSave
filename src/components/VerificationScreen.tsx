// src/components/VerificationScreen.tsx
import { useState } from 'react';
import { ArrowLeft, Lock, Upload, Minus, Plus } from 'lucide-react';
import { api, API_BASE, getToken } from '../lib/api';

interface VerificationScreenProps {
  onComplete: () => void;
}

type Step = 1 | 2;

export function VerificationScreen({ onComplete }: VerificationScreenProps) {
  const [step, setStep] = useState<Step>(1);

  // Step 1 (OTP)
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Step 2 (Eligibility)
  const [aadhaar, setAadhaar] = useState('');
  const [income, setIncome] = useState('');
  const [children, setChildren] = useState(0);
  const [street, setStreet] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Quick validation helpers
  const isValidIndianPhone = (v: string) => /^\+?91?\s?\d{10}$/.test(v.replace(/\s+/g, ''));
  const maskedAadhaar = aadhaar.replace(/\s+/g, '').replace(/(\d{0,8})(\d{4})$/, (_, a, b) =>
    `${a.replace(/\d/g, 'X')}${b}`
  );

  async function handleSendOtp() {
    setOtpError(null);
    setOtpHint(null);
    if (!isValidIndianPhone(phone)) {
      setOtpError('Please enter a valid 10-digit Indian phone number (optionally with +91).');
      return;
    }
    try {
      setSendingOtp(true);
      const normalized = phone.startsWith('+') ? phone : `+91 ${phone.slice(-10)}`;
      const res = await api.sendOtp(normalized);
      // In local/dev, backend may echo an OTP for convenience
      if (res.otp) setOtpHint(`Dev hint OTP: ${res.otp}`);
    } catch (e: any) {
      setOtpError(e?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    setOtpError(null);
    if (!otp || otp.length < 4) {
      setOtpError('Enter the OTP you received.');
      return;
    }
    try {
      setVerifying(true);
      const normalized = phone.startsWith('+') ? phone : `+91 ${phone.slice(-10)}`;
      await api.verifyOtp(normalized, otp);
      // token persisted by api.verifyOtp → go to Step 2
      setStep(2);
    } catch (e: any) {
      setOtpError(e?.message || 'OTP verification failed.');
    } finally {
      setVerifying(false);
    }
  }

  async function saveEligibilityAndFinish(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);

    // Not strictly required by backend for demo, but we’ll best-effort POST
    const token = getToken();
    if (!token) {
      // If somehow not logged in, just complete the flow (demo-friendly)
      onComplete();
      return;
    }

    const payload = {
      aadhaarMasked: maskedAadhaar || undefined,
      incomeBracket: income || undefined,
      schoolGoingChildren: children,
      address: {
        street: street || undefined,
        city: city || undefined,
        pincode: pincode || undefined,
      },
      eligibilityStatus: income ? 'eligible' : 'pending',
      isVerified: !!income && children >= 0, // simplistic demo rule
    };

    try {
      setSaving(true);
      // Try common profile endpoint; ignore failures gracefully
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      // Even if backend doesn’t have this route yet, proceed.
      // If it does, ensure it's ok before continuing.
      if (!res.ok && res.status !== 404) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'Could not save your details.');
      }

      onComplete();
    } catch (err: any) {
      setSaveError(err?.message || 'Something went wrong while saving. You can try again.');
      // Still allow completion in pure demo mode if you prefer:
      // onComplete();
    } finally {
      setSaving(false);
    }
  }

  const canContinueStep1 = isValidIndianPhone(phone) && otp.length >= 4;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto max-w-md px-4 py-4">
          <button
            className="mb-2 rounded-full p-2 transition-colors hover:bg-purple-50"
            onClick={() => setStep((s) => (s === 2 ? 1 : 1))}
            type="button"
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6 text-[#3D3B6B]" />
          </button>
          <h1 className="mb-1 text-[#3D3B6B]">Verify Your Household</h1>
          <p className="text-sm text-gray-500">Step {step} of 2</p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        <form onSubmit={saveEligibilityAndFinish} className="space-y-6">
          {step === 1 ? (
            <>
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-gray-900">Contact Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm text-gray-700">Phone Number</label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-[#3D3B6B] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendingOtp || !isValidIndianPhone(phone)}
                        className="whitespace-nowrap rounded-lg bg-[#3D3B6B] px-4 py-3 text-white transition-colors hover:bg-[#2d2950] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sendingOtp ? 'Sending…' : 'Send OTP'}
                      </button>
                    </div>
                    {otpHint && (
                      <p className="mt-1 text-xs text-gray-500">{otpHint}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">Enter 6-digit OTP</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-center text-2xl tracking-widest focus:border-[#3D3B6B] focus:outline-none"
                    />
                    {otpError && <p className="mt-2 text-sm text-red-600">{otpError}</p>}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={!canContinueStep1 || verifying}
                className="w-full rounded-xl bg-[#3D3B6B] py-4 text-white transition-colors hover:bg-[#2d2950] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {verifying ? 'Verifying…' : 'Continue to Next Step'}
              </button>
            </>
          ) : (
            <>
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-gray-900">Eligibility Information</h2>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm text-gray-700">Aadhaar Number</label>
                    <input
                      type="text"
                      value={aadhaar}
                      onChange={(e) => setAadhaar(e.target.value.replace(/[^\d\s]/g, '').slice(0, 14))}
                      placeholder="XXXX XXXX 1234"
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-[#3D3B6B] focus:outline-none"
                    />
                    {aadhaar && (
                      <p className="mt-1 text-xs text-gray-500">
                        Will be stored as: <span className="font-medium">{maskedAadhaar}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">Annual Household Income</label>
                    <select
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-[#3D3B6B] focus:outline-none"
                    >
                      <option value="">Select income range</option>
                      <option value="below-1.5">Below ₹1.5 LPA</option>
                      <option value="1.5-2.5">₹1.5 - ₹2.5 LPA</option>
                      <option value="2.5-3.5">₹2.5 - ₹3.5 LPA</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">School-going Children</label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setChildren((c) => Math.max(0, c - 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#3D3B6B] transition-colors hover:bg-purple-50"
                        aria-label="Decrease children"
                      >
                        <Minus className="h-5 w-5 text-[#3D3B6B]" />
                      </button>
                      <span className="min-w-[3rem] text-center text-2xl text-gray-900">{children}</span>
                      <button
                        type="button"
                        onClick={() => setChildren((c) => Math.min(5, c + 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#3D3B6B] transition-colors hover:bg-purple-50"
                        aria-label="Increase children"
                      >
                        <Plus className="h-5 w-5 text-[#3D3B6B]" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">Street Address</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Enter your street address"
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-[#3D3B6B] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">Pincode</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="560003"
                        maxLength={6}
                        className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-[#3D3B6B] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Bangalore"
                        className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-[#3D3B6B] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-gray-900">Document Upload</h2>

                <div className="space-y-3">
                  <label className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 transition-colors hover:border-[#3D3B6B] hover:bg-purple-50">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-sm text-gray-600">Upload Proof of Income</span>
                    <input type="file" className="hidden" accept="image/*,.pdf" />
                  </label>

                  <label className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 transition-colors hover:border-[#3D3B6B] hover:bg-purple-50">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-sm text-gray-600">Upload Address Proof</span>
                    <input type="file" className="hidden" accept="image/*,.pdf" />
                  </label>
                </div>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-[#3D3B6B] focus:ring-[#3D3B6B]"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to{' '}
                    <button type="button" className="text-[#3D3B6B] hover:underline">
                      Fair Use Policy
                    </button>{' '}
                    and{' '}
                    <button type="button" className="text-[#3D3B6B] hover:underline">
                      Terms
                    </button>
                  </span>
                </label>
              </div>

              {saveError && <p className="text-sm text-red-600">{saveError}</p>}

              <button
                type="submit"
                disabled={!agreeToTerms || saving}
                className="w-full rounded-xl bg-[#3D3B6B] py-4 text-white transition-colors hover:bg-[#2d2950] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Complete Verification'}
              </button>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Lock className="h-4 w-4" />
                <span>Your data is secure</span>
              </div>
            </>
          )}
        </form>
      </main>
    </div>
  );
}

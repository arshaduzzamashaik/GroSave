function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const otpStore = new Map();

function storeOTP(phone, otp) {
  const expiresAt = Date.now() + 5 * 60 * 1000;
  otpStore.set(phone, { otp, expiresAt });
}

function verifyOTP(phone, otp) {
  const stored = otpStore.get(phone);
  if (!stored) return false;
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(phone);
    return false;
  }
  const isValid = stored.otp === otp;
  if (isValid) otpStore.delete(phone);
  return isValid;
}

module.exports = { generateOTP, storeOTP, verifyOTP };

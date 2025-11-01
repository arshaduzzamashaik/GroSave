const API_BASE_URL = 'http://localhost:5001/api';

export const api = {
  // Auth
  sendOTP: (phone) => 
    fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    }).then(r => r.json()),

  verifyOTP: (phone, otp) =>
    fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    }).then(r => r.json()),

  // Products
  getProducts: () =>
    fetch(`${API_BASE_URL}/products`).then(r => r.json()),

  // Wallet
  getWallet: (token) =>
    fetch(`${API_BASE_URL}/wallet/balance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()),

  // Orders
  createOrder: (token, orderData) =>
    fetch(`${API_BASE_URL}/orders/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    }).then(r => r.json()),
};

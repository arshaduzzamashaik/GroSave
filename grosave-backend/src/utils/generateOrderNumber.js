function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `GS24${timestamp}${random}`;
}

function generateVerificationCode(orderNumber) {
  return orderNumber.replace('GS24', '').replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3');
}

module.exports = { generateOrderNumber, generateVerificationCode };

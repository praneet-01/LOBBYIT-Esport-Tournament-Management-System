import api from './api';

/**
 * Loads Razorpay script dynamically if not already loaded
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Initiates Razorpay Checkout Modal
 * @param {Object} params
 * @param {string} params.tournamentId
 * @param {string} params.tournamentTitle
 * @param {string} params.teamName
 * @param {Object} params.user
 * @returns {Promise<Object>} Verification response with transaction ID
 */
export const launchRazorpayCheckout = async ({
  tournamentId,
  tournamentTitle,
  teamName,
  user
}) => {
  // 1. Ensure Razorpay SDK is loaded
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) {
    throw new Error('Could not load Razorpay payment gateway SDK. Please check your internet connection.');
  }

  // 2. Create order on the server
  const orderRes = await api.post('/payments/create-order', {
    tournamentId,
    teamName
  });

  const { orderId, amountInPaise, currency, keyId, isLiveGateway, amount } = orderRes.data;

  // 3. Return a promise that resolves when the Razorpay modal completes
  return new Promise((resolve, reject) => {
    try {
      const options = {
        key: keyId,
        amount: amountInPaise,
        currency: currency || 'INR',
        name: 'LOBBYIT Esports',
        description: `Entry Fee + ₹2 Platform Fee • ${tournamentTitle || 'Tournament'}`,
        order_id: isLiveGateway ? orderId : undefined, // If live order ID exists
        image: '/kriditam-logo.jpeg',
        prefill: {
          name: user?.name || teamName || 'Esports Player',
          email: user?.email || 'player@lobbyit.com',
          contact: user?.phone || '9999999999'
        },
        notes: {
          tournamentId,
          teamName
        },
        theme: {
          color: '#E6002B',
          backdrop_color: 'rgba(0,0,0,0.85)'
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay using UPI / QR Code',
                instruments: [
                  {
                    method: 'upi'
                  }
                ]
              },
              other: {
                name: 'Cards & NetBanking',
                instruments: [
                  {
                    method: 'card'
                  },
                  {
                    method: 'netbanking'
                  },
                  {
                    method: 'wallet'
                  }
                ]
              }
            },
            sequence: ['block.upi', 'block.other'],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment was cancelled by the user.'));
          }
        },
        handler: async (response) => {
          try {
            // 4. Verify payment on the server
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id || orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || 'sandbox_verified',
              paymentMethod: 'Razorpay Gateway (UPI/Card)'
            });

            resolve({
              success: true,
              txnId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id || orderId,
              amount: amount,
              paymentMethod: 'Razorpay Gateway',
              gatewayData: verifyRes.data
            });
          } catch (verifyErr) {
            reject(new Error(verifyErr.response?.data?.message || 'Payment verification failed on server.'));
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on('payment.failed', (failedRes) => {
        reject(new Error(failedRes.error?.description || 'Payment failed during checkout.'));
      });

      rzpInstance.open();
    } catch (err) {
      reject(err);
    }
  });
};

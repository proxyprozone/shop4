import React, { useEffect, useState } from 'react';
import { ShoppingCart, ShoppingBag, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Shop() {
  const [settings, setSettings] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [customerUpiId, setCustomerUpiId] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data || { site_title: 'My Shop', logo_url: '', bg_image_url: '' }));
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts);
  }, []);

  const handleBuyClick = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    if (settings.upi_id || settings.qr_image_url) {
      setSelectedProduct(product);
      setOrderSuccess(false);
      setCustomerUpiId('');
    } else if (product.payment_link) {
      window.open(product.payment_link, '_blank');
    } else {
      window.open('https://checkout.pay4.work/pay/8225ce9ae788a702fa5b59717c8e3f81be3ec967c12083442f64affee27aa860', '_blank');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerUpiId.trim() || !selectedProduct) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          customer_upi_id: customerUpiId
        })
      });
      
      if (res.ok) {
        setOrderSuccess(true);
      }
    } catch (err) {
      console.error('Failed to submit order', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!settings) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Hero Section with Background */}
      <div 
        className="relative h-80 bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${settings.bg_image_url})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center text-white flex flex-col items-center">
          {settings.logo_url && (
            <img src={settings.logo_url} alt="Logo" className="w-24 h-24 rounded-full border-4 border-white mb-4 object-cover" referrerPolicy="no-referrer" />
          )}
          <h1 className="text-5xl font-bold tracking-tight">{settings.site_title}</h1>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Our Products</h2>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors font-medium bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
              <ShoppingBag size={20} />
              <span>Cart (0)</span>
            </button>
            <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-900">Admin Login</Link>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No products available yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 flex flex-col">
                <div className="aspect-w-1 aspect-h-1 w-full bg-gray-200">
                  <img 
                    src={product.image_url} 
                    alt={product.title} 
                    className="w-full h-64 object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.title}</h3>
                  <p className="text-xl font-bold text-emerald-600 mb-6">{product.price}</p>
                  <div className="mt-auto">
                    <button 
                      onClick={(e) => handleBuyClick(product, e)}
                      className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 px-4 rounded-xl hover:bg-gray-800 transition-colors font-medium"
                    >
                      <ShoppingCart size={18} />
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Complete Payment</h3>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {orderSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart size={32} />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h4>
                  <p className="text-gray-600 mb-8">
                    Your payment request has been sent to the admin. We will process your order once the payment is confirmed.
                  </p>
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Order Summary */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <img src={selectedProduct.image_url} alt={selectedProduct.title} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <div className="font-medium text-gray-900">{selectedProduct.title}</div>
                      <div className="text-emerald-600 font-bold">{selectedProduct.price}</div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="text-center space-y-4">
                    <p className="text-sm text-gray-600">Please pay using the details below:</p>
                    
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm font-medium text-left leading-relaxed space-y-2">
                      <p>⚠️ <strong>Important:</strong> Please send the exact amount. If the paid amount does not match the product price, your payment will not be confirmed.</p>
                      <p>⚠️ <strong>ध्यान दें:</strong> कृपया बिल्कुल सही रकम ही भेजें। अगर भेजी गई रकम प्रोडक्ट के प्राइस से मैच नहीं होती है, तो आपका पेमेंट कन्फर्म नहीं किया जाएगा।</p>
                      <p>⚠️ <strong>Внимание:</strong> Пожалуйста, отправьте точную сумму. Если оплаченная сумма не совпадает с ценой товара, ваш платеж не будет подтвержден.</p>
                    </div>
                    
                    {settings.qr_image_url && (
                      <div className="flex justify-center">
                        <img src={settings.qr_image_url} alt="Payment QR Code" className="w-48 h-48 rounded-2xl border-2 border-gray-100 shadow-sm" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    
                    {settings.upi_id && (
                      <div className="bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-100 font-mono text-lg font-medium">
                        {settings.upi_id}
                      </div>
                    )}
                  </div>

                  {/* Confirmation Form */}
                  <form onSubmit={handlePaymentSubmit} className="pt-4 border-t border-gray-100">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your UPI ID (Required)
                      </label>
                      <input 
                        type="text" 
                        required
                        value={customerUpiId}
                        onChange={(e) => setCustomerUpiId(e.target.value)}
                        placeholder="e.g., yourname@upi"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Please enter the UPI ID from which you made the payment so we can verify it.
                      </p>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting || !customerUpiId.trim()}
                      className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'I have made the payment'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

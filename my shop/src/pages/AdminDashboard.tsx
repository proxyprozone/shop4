import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Plus, Trash2, LogOut, LayoutTemplate, ListOrdered, CheckCircle, XCircle, QrCode } from 'lucide-react';
import { adminToken, setAdminToken } from '../auth';

export default function AdminDashboard() {
  const [settings, setSettings] = useState({ site_title: '', logo_url: '', bg_image_url: '', upi_id: '', qr_image_url: '' });
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({ title: '', price: '', image_url: '', payment_link: '' });
  const [activeTab, setActiveTab] = useState<'settings' | 'payment' | 'products' | 'orders'>('settings');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const getToken = () => {
    try {
      return localStorage.getItem('admin_token') || adminToken;
    } catch (e) {
      return adminToken;
    }
  };

  const token = getToken();

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [token, navigate]);

  const fetchData = async () => {
    const [settingsRes, productsRes, ordersRes] = await Promise.all([
      fetch('/api/settings'),
      fetch('/api/products'),
      fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    const fetchedSettings = await settingsRes.json();
    setSettings(fetchedSettings || { site_title: '', logo_url: '', bg_image_url: '', upi_id: '', qr_image_url: '' });
    setProducts(await productsRes.json());
    if (ordersRes.ok) {
      setOrders(await ordersRes.json());
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });
    setSuccessMessage('Settings updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/products', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newProduct)
    });
    setNewProduct({ title: '', price: '', image_url: '', payment_link: '' });
    setSuccessMessage('Product added successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
    fetchData();
  };

  const handleDeleteProduct = async (id: number) => {
    // We avoid window.confirm in iframe
    await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setSuccessMessage('Product deleted!');
    setTimeout(() => setSuccessMessage(''), 3000);
    fetchData();
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, image_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateOrderStatus = async (id: number, status: string) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    setSuccessMessage(`Order marked as ${status}!`);
    setTimeout(() => setSuccessMessage(''), 3000);
    fetchData();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'qr_image_url' | 'logo_url' | 'bg_image_url') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('admin_token');
    } catch (e) {}
    setAdminToken(null);
    navigate('/');
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutTemplate size={24} />
            Admin Panel
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-colors ${activeTab === 'settings' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Settings size={20} />
            Site Settings
          </button>
          <button 
            onClick={() => setActiveTab('payment')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-colors ${activeTab === 'payment' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <QrCode size={20} />
            Payment QR & UPI
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-colors ${activeTab === 'products' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Plus size={20} />
            Manage Products
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-colors ${activeTab === 'orders' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <ListOrdered size={20} />
            Payment Requests
          </button>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto relative">
        {successMessage && (
          <div className="absolute top-8 right-8 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg border border-emerald-100 shadow-sm z-50">
            {successMessage}
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Site Settings</h2>
            <form onSubmit={handleUpdateSettings} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Title</label>
                <input 
                  type="text" 
                  value={settings.site_title}
                  onChange={e => setSettings({...settings, site_title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo Image</label>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo_url')}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">OR enter URL:</span>
                    <input 
                      type="text" 
                      value={settings.logo_url}
                      onChange={e => setSettings({...settings, logo_url: e.target.value})}
                      placeholder="URL to your logo"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                    />
                  </div>
                  {settings.logo_url && (
                    <div className="mt-4 p-4 border border-gray-100 rounded-xl bg-gray-50 inline-block">
                      <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Logo Preview</p>
                      <img src={settings.logo_url} alt="Logo Preview" className="w-16 h-16 rounded-full object-cover border border-gray-200 shadow-sm" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Background Image</label>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'bg_image_url')}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">OR enter URL:</span>
                    <input 
                      type="text" 
                      value={settings.bg_image_url}
                      onChange={e => setSettings({...settings, bg_image_url: e.target.value})}
                      placeholder="URL to your background image"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                    />
                  </div>
                  {settings.bg_image_url && (
                    <div className="mt-4 p-4 border border-gray-100 rounded-xl bg-gray-50 inline-block">
                      <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Background Preview</p>
                      <img src={settings.bg_image_url} alt="BG Preview" className="w-32 h-20 rounded object-cover border border-gray-200 shadow-sm" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors">
                Save Settings
              </button>
            </form>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment QR & UPI Settings</h2>
            <form onSubmit={handleUpdateSettings} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your UPI ID</label>
                <input 
                  type="text" 
                  value={settings.upi_id || ''}
                  onChange={e => setSettings({...settings, upi_id: e.target.value})}
                  placeholder="e.g., yourname@upi"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">QR Code Image</label>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'qr_image_url')}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">OR enter URL:</span>
                    <input 
                      type="text" 
                      value={settings.qr_image_url || ''}
                      onChange={e => setSettings({...settings, qr_image_url: e.target.value})}
                      placeholder="URL to your payment QR code"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                    />
                  </div>
                  {settings.qr_image_url && (
                    <div className="mt-4 p-4 border border-gray-100 rounded-xl bg-gray-50 inline-block">
                      <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">QR Code Preview</p>
                      <img src={settings.qr_image_url} alt="QR Preview" className="w-32 h-32 rounded-lg object-cover border border-gray-200 shadow-sm" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors">
                Save Payment Settings
              </button>
            </form>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="max-w-5xl mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h2>
              <form onSubmit={handleAddProduct} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Title</label>
                  <input 
                    type="text" required
                    value={newProduct.title}
                    onChange={e => setNewProduct({...newProduct, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (e.g., ₹999)</label>
                  <input 
                    type="text" required
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                  <div className="space-y-3">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleProductImageUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors"
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">OR URL:</span>
                      <input 
                        type="text"
                        value={newProduct.image_url}
                        onChange={e => setNewProduct({...newProduct, image_url: e.target.value})}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none"
                      />
                    </div>
                    {newProduct.image_url && (
                      <img src={newProduct.image_url} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-gray-200" referrerPolicy="no-referrer" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Link (Optional)</label>
                  <input 
                    type="url"
                    value={newProduct.payment_link}
                    onChange={e => setNewProduct({...newProduct, payment_link: e.target.value})}
                    placeholder="Leave empty to use QR/UPI"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors">
                    Add Product
                  </button>
                </div>
              </form>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Existing Products</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="p-4 font-medium text-gray-600">Image</th>
                      <th className="p-4 font-medium text-gray-600">Title</th>
                      <th className="p-4 font-medium text-gray-600">Price</th>
                      <th className="p-4 font-medium text-gray-600">Payment Link</th>
                      <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4">
                          <img src={product.image_url} alt={product.title} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                        </td>
                        <td className="p-4 font-medium text-gray-900">{product.title}</td>
                        <td className="p-4 text-emerald-600 font-medium">{product.price}</td>
                        <td className="p-4">
                          <a href={product.payment_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm truncate max-w-xs block">
                            {product.payment_link}
                          </a>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">No products found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Requests</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 font-medium text-gray-600">Date</th>
                    <th className="p-4 font-medium text-gray-600">Product</th>
                    <th className="p-4 font-medium text-gray-600">Customer UPI</th>
                    <th className="p-4 font-medium text-gray-600">Status</th>
                    <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{order.product_title}</div>
                        <div className="text-sm text-emerald-600">{order.product_price}</div>
                      </td>
                      <td className="p-4 font-mono text-sm text-gray-700">{order.customer_upi_id}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            order.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 
                            'bg-red-100 text-red-800'}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {order.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Confirm Payment"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button 
                              onClick={() => handleUpdateOrderStatus(order.id, 'rejected')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject Payment"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">No payment requests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

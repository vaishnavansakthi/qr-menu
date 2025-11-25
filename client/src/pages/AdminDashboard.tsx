import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { QRCodeCanvas } from 'qrcode.react';

interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    imageUrl: string;
}

interface Order {
    id: string;
    status: string;
    totalAmount: number;
    items: any[];
    createdAt: string;
    user?: { name: string; email: string };
    customerName?: string;
    customerContact?: string;
    sessionId?: string;
}

export const AdminDashboard: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'stats'>('menu');
    const { token, user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // New Product State
    const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', imageUrl: '' });
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    interface Shop {
        id: string;
        name: string;
        ownerId: string;
    }

    const [shops, setShops] = useState<Shop[]>([]);
    const [shopId, setShopId] = useState<string | null>(null);
    const [shopName, setShopName] = useState<string>('');
    const [menuUrl, setMenuUrl] = useState<string>('');

    const formatCurrency = (amount: number | string) => {
        const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
        const safeValue = Number.isFinite(numeric) ? numeric : 0;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(safeValue);
    };

    // ... (existing helper functions)

    useEffect(() => {
        if (user) {
            fetchShops();
        }
    }, [user]);

    useEffect(() => {
        if (shopId) {
            const selectedShop = shops.find(s => s.id === shopId);
            if (selectedShop) {
                setShopName(selectedShop.name);
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                setMenuUrl(origin ? `${origin}/menu/${shopId}` : '');
            }
            fetchProducts();
            fetchOrders();
        }
    }, [shopId, shops]);

    const fetchShops = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/shops`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShops(response.data);

            // If no shop selected yet, select the first one
            if (response.data.length > 0 && !shopId) {
                setShopId(response.data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch shops:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/products?shopId=${shopId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(response.data);
        } catch (error) {
            console.error('Failed to fetch products');
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/orders?shopId=${shopId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to fetch orders');
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shopId) {
            alert('You do not have a shop yet. Ask Super Admin.');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/products`, {
                ...newProduct,
                price: parseFloat(newProduct.price),
                shopId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            fetchProducts();
            setNewProduct({ name: '', price: '', description: '', imageUrl: '' });
        } catch (error) {
            console.error('Failed to add product');
        } finally {
            setLoading(false);
        }
    };

    const handleEditProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        setLoading(true);
        try {
            await axios.patch(`${API_BASE_URL}/products/${editingProduct.id}`, {
                name: editingProduct.name,
                price: editingProduct.price,
                description: editingProduct.description,
                imageUrl: editingProduct.imageUrl
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            fetchProducts();
            setEditingProduct(null);
        } catch (error) {
            console.error('Failed to update product');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            await axios.delete(`${API_BASE_URL}/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchProducts();
        } catch (error) {
            console.error('Failed to delete product');
        }
    };

    const handleStatusUpdate = async (orderId: string, status: string) => {
        try {
            await axios.patch(`${API_BASE_URL}/orders/${orderId}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchOrders();
        } catch (error) {
            console.error('Failed to update status');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const stats = {
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        totalRevenue: orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0),
        totalProducts: products.length
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="glass backdrop-blur-xl bg-white/10 border-b border-white/20 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-bold text-white gradient-text">
                                    Admin Dashboard
                                </h1>
                                {shops.length > 1 && (
                                    <select
                                        value={shopId || ''}
                                        onChange={(e) => setShopId(e.target.value)}
                                        className="bg-white/10 border border-white/20 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5"
                                    >
                                        {shops.map((shop) => (
                                            <option key={shop.id} value={shop.id} className="text-black">
                                                {shop.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <p className="text-gray-300 text-sm mt-1">
                                {shopName ? `Managing ${shopName}` : 'Welcome back, ' + user?.name}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-xl transition-all border border-red-500/50"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* QR download card */}
                <div className="glass backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6 mb-8 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex-1">
                        <p className="text-sm uppercase tracking-wider text-gray-400 mb-2">Customer QR</p>
                        <h2 className="text-2xl font-bold text-white mb-2">Share your menu instantly</h2>
                        <p className="text-gray-300 mb-4">
                            Print or download this QR so guests can open your menu at{' '}
                            <span className="text-purple-200 font-semibold">{menuUrl || '...'}</span>
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => {
                                    const canvas = document.getElementById('shop-qr-code') as HTMLCanvasElement | null;
                                    if (!canvas) return;
                                    const pngUrl = canvas
                                        .toDataURL('image/png')
                                        .replace('image/png', 'image/octet-stream');
                                    const downloadLink = document.createElement('a');
                                    downloadLink.href = pngUrl;
                                    downloadLink.download = `${shopName || 'qr-menu'}-qr.png`;
                                    document.body.appendChild(downloadLink);
                                    downloadLink.click();
                                    document.body.removeChild(downloadLink);
                                }}
                                disabled={!menuUrl}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg transition disabled:opacity-40"
                            >
                                Download QR
                            </button>
                            <button
                                onClick={() => menuUrl && navigator.clipboard.writeText(menuUrl)}
                                disabled={!menuUrl}
                                className="px-6 py-3 bg-white/10 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition disabled:opacity-40"
                            >
                                Copy Link
                            </button>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-xl self-start">
                        {menuUrl ? (
                            <QRCodeCanvas
                                id="shop-qr-code"
                                value={menuUrl}
                                size={180}
                                level="H"
                                includeMargin
                                className="mx-auto"
                            />
                        ) : (
                            <p className="text-gray-500 w-40 text-center">Assigning shop...</p>
                        )}
                    </div>
                </div>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fadeIn">
                    <div className="glass backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-6 rounded-2xl border border-blue-500/30 card-hover">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-200 text-sm font-medium">Total Orders</p>
                                <p className="text-3xl font-bold text-white mt-2">{stats.totalOrders}</p>
                            </div>
                            <div className="bg-blue-500/30 p-3 rounded-xl">
                                <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="glass backdrop-blur-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 p-6 rounded-2xl border border-yellow-500/30 card-hover">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-yellow-200 text-sm font-medium">Pending</p>
                                <p className="text-3xl font-bold text-white mt-2">{stats.pendingOrders}</p>
                            </div>
                            <div className="bg-yellow-500/30 p-3 rounded-xl">
                                <svg className="w-8 h-8 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="glass backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-green-600/20 p-6 rounded-2xl border border-green-500/30 card-hover">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-200 text-sm font-medium">Revenue</p>
                                <p className="text-3xl font-bold text-white mt-2">{formatCurrency(stats.totalRevenue)}</p>
                            </div>
                            <div className="bg-green-500/30 p-3 rounded-xl">
                                <svg className="w-8 h-8 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="glass backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-6 rounded-2xl border border-purple-500/30 card-hover">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-200 text-sm font-medium">Products</p>
                                <p className="text-3xl font-bold text-white mt-2">{stats.totalProducts}</p>
                            </div>
                            <div className="bg-purple-500/30 p-3 rounded-xl">
                                <svg className="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="glass backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-2 mb-8 flex gap-2 animate-slideIn">
                    <button
                        className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${activeTab === 'menu' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-gray-300 hover:bg-white/5'}`}
                        onClick={() => setActiveTab('menu')}
                    >
                        Menu Management
                    </button>
                    <button
                        className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${activeTab === 'orders' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-gray-300 hover:bg-white/5'}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        Orders
                    </button>
                </div>

                {/* Menu Management Tab */}
                {activeTab === 'menu' && (
                    <div className="space-y-8 animate-fadeIn">
                        {/* Add/Edit Product Form */}
                        <div className="glass backdrop-blur-xl bg-white/10 p-8 rounded-2xl border border-white/20">
                            <h2 className="text-2xl font-bold text-white mb-6">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <form onSubmit={editingProduct ? handleEditProduct : handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <input
                                    type="text"
                                    placeholder="Product Name"
                                    className="bg-white/10 border border-white/20 text-white placeholder-gray-400 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                    value={editingProduct ? editingProduct.name : newProduct.name}
                                    onChange={(e) => editingProduct
                                        ? setEditingProduct({ ...editingProduct, name: e.target.value })
                                        : setNewProduct({ ...newProduct, name: e.target.value })}
                                    required
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Price"
                                    className="bg-white/10 border border-white/20 text-white placeholder-gray-400 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                    value={editingProduct ? editingProduct.price : newProduct.price}
                                    onChange={(e) => editingProduct
                                        ? setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })
                                        : setNewProduct({ ...newProduct, price: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Description"
                                    className="bg-white/10 border border-white/20 text-white placeholder-gray-400 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all md:col-span-2"
                                    value={editingProduct ? editingProduct.description : newProduct.description}
                                    onChange={(e) => editingProduct
                                        ? setEditingProduct({ ...editingProduct, description: e.target.value })
                                        : setNewProduct({ ...newProduct, description: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="Image URL"
                                    className="bg-white/10 border border-white/20 text-white placeholder-gray-400 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all md:col-span-2"
                                    value={editingProduct ? editingProduct.imageUrl : newProduct.imageUrl}
                                    onChange={(e) => editingProduct
                                        ? setEditingProduct({ ...editingProduct, imageUrl: e.target.value })
                                        : setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                                />
                                <div className="md:col-span-2 flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold p-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50 btn-hover"
                                    >
                                        {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                                    </button>
                                    {editingProduct && (
                                        <button
                                            type="button"
                                            onClick={() => setEditingProduct(null)}
                                            className="px-6 bg-gray-600/50 text-white font-semibold rounded-xl hover:bg-gray-600/70 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map((product) => (
                                <div key={product.id} className="glass backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden card-hover">
                                    <img
                                        src={product.imageUrl || 'https://via.placeholder.com/400x300'}
                                        alt={product.name}
                                        className="w-full h-48 object-cover"
                                    />
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                                        <p className="text-2xl font-bold text-green-400 mb-2">{formatCurrency(product.price)}</p>
                                        <p className="text-gray-300 text-sm mb-4">{product.description}</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingProduct(product)}
                                                className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 py-2 rounded-lg transition-all border border-blue-500/50"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id)}
                                                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 py-2 rounded-lg transition-all border border-red-500/50"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <div className="space-y-4 animate-fadeIn">
                        {orders.length === 0 ? (
                            <div className="glass backdrop-blur-xl bg-white/10 p-12 rounded-2xl border border-white/20 text-center">
                                <p className="text-gray-300 text-lg">No orders yet</p>
                            </div>
                        ) : (
                            orders.map((order) => (
                                <div key={order.id} className="glass backdrop-blur-xl bg-white/10 p-6 rounded-2xl border border-white/20 card-hover">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-white">Order #{order.id.slice(0, 8)}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/50' :
                                                    order.status === 'preparing' ? 'bg-blue-500/20 text-blue-200 border border-blue-500/50' :
                                                        order.status === 'ready' ? 'bg-green-500/20 text-green-200 border border-green-500/50' :
                                                            'bg-gray-500/20 text-gray-200 border border-gray-500/50'
                                                    }`}>
                                                    {order.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-gray-300 text-sm">Total: <span className="text-green-400 font-semibold">{formatCurrency(order.totalAmount)}</span></p>
                                            {order.customerName && (
                                                <p className="text-purple-200 text-sm">
                                                    Guest: {order.customerName}
                                                    {order.customerContact ? ` (${order.customerContact})` : ''}
                                                </p>
                                            )}
                                            {order.user && <p className="text-gray-400 text-sm">Customer: {order.user.name}</p>}
                                            <p className="text-gray-500 text-xs mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'preparing')}
                                                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-lg text-sm font-medium transition-all border border-blue-500/50"
                                            >
                                                Preparing
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'ready')}
                                                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded-lg text-sm font-medium transition-all border border-green-500/50"
                                            >
                                                Ready
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'completed')}
                                                className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg text-sm font-medium transition-all border border-gray-500/50"
                                            >
                                                Completed
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

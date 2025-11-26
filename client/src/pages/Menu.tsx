import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    imageUrl: string;
}

interface CartItem extends Product {
    quantity: number;
}

interface Shop {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    isActive: boolean;
}

interface SessionOrder {
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
}

const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

export const Menu: React.FC = () => {
    const { shopId } = useParams<{ shopId: string }>();
    const [products, setProducts] = useState<Product[]>([]);
    const [shop, setShop] = useState<Shop | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isShopInactive, setIsShopInactive] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [locationGranted, setLocationGranted] = useState(false);
    const [showCart, setShowCart] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const [customerName, setCustomerName] = useState<string>('');
    const [customerContact, setCustomerContact] = useState<string>('');
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [sessionOrders, setSessionOrders] = useState<SessionOrder[]>([]);
    const [ordersRefreshing, setOrdersRefreshing] = useState(false);
    const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);

    const formatCurrency = (amount: number | string) => {
        const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
        const safeValue = Number.isFinite(numeric) ? numeric : 0;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(safeValue);
    };

    const fetchSessionOrders = useCallback(async () => {
        if (!shopId || !sessionId) return;
        setOrdersRefreshing(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/orders/guest`, {
                params: { shopId, sessionId }
            });
            setSessionOrders(response.data);
        } catch (error) {
            console.error('Failed to fetch guest orders', error);
        } finally {
            setOrdersRefreshing(false);
        }
    }, [shopId, sessionId]);

    useEffect(() => {
        requestLocation();
    }, []);

    useEffect(() => {
        if (locationGranted && shopId) {
            fetchShopAndProducts();
        }
    }, [locationGranted, shopId]);

    useEffect(() => {
        if (!shopId) return;
        const storageKey = `qr-menu-session-${shopId}`;
        const savedSession = localStorage.getItem(storageKey);
        if (savedSession) {
            try {
                const parsed = JSON.parse(savedSession);
                const savedAt = parsed.savedAt ?? 0;
                const isExpired = savedAt === 0 || (Date.now() - savedAt) > SESSION_TIMEOUT_MS;
                if (isExpired) {
                    localStorage.removeItem(storageKey);
                    resetSessionState(true);
                } else {
                    setSessionId(parsed.sessionId);
                    setCustomerName(parsed.customerName);
                    setCustomerContact(parsed.customerContact);
                    setSessionExpiresAt(savedAt + SESSION_TIMEOUT_MS);
                }
            } catch {
                localStorage.removeItem(storageKey);
                resetSessionState(true);
            }
        } else {
            setShowSessionModal(true);
        }
    }, [shopId]);

    useEffect(() => {
        if (!sessionId || !shopId) return;
        fetchSessionOrders();
        const interval = setInterval(fetchSessionOrders, 15000);
        return () => clearInterval(interval);
    }, [shopId, sessionId, fetchSessionOrders]);

    const resetSessionState = (showModal = true) => {
        setSessionId('');
        setCustomerName('');
        setCustomerContact('');
        setSessionOrders([]);
        setSessionExpiresAt(null);
        setCart([]);
        if (showModal) {
            setShowSessionModal(true);
        }
    };

    const persistSession = (nextSessionId: string, name: string, contact: string) => {
        if (!shopId) return;
        const storageKey = `qr-menu-session-${shopId}`;
        const payload = {
            sessionId: nextSessionId,
            customerName: name,
            customerContact: contact,
            savedAt: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
        setSessionId(nextSessionId);
        setCustomerName(name);
        setCustomerContact(contact);
        setSessionExpiresAt(payload.savedAt + SESSION_TIMEOUT_MS);
    };

    const setupSession = (name: string, contact: string) => {
        const nextSessionId =
            typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        persistSession(nextSessionId, name, contact);
        setShowSessionModal(false);
    };

    useEffect(() => {
        if (!shopId || !sessionId) return;
        const storageKey = `qr-menu-session-${shopId}`;
        const checkTimeout = () => {
            const savedSession = localStorage.getItem(storageKey);
            if (!savedSession) return;
            try {
                const parsed = JSON.parse(savedSession);
                const savedAt = parsed.savedAt ?? 0;
                if (savedAt === 0 || (Date.now() - savedAt) > SESSION_TIMEOUT_MS) {
                    localStorage.removeItem(storageKey);
                    resetSessionState();
                }
            } catch {
                localStorage.removeItem(storageKey);
            }
        };

        checkTimeout();
        const interval = setInterval(checkTimeout, 60_000);
        return () => clearInterval(interval);
    }, [shopId, sessionId]);

    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const remainingTime = useMemo(() => {
        if (!sessionExpiresAt) return null;
        const diff = sessionExpiresAt - now;
        if (diff <= 0) return 'Expired';
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    }, [sessionExpiresAt, now]);

    const requestLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocationGranted(true);
                    validateLocation(position.coords.latitude, position.coords.longitude);
                },
                () => {
                    setLocationError('Location access is required to view the menu. Please enable location services.');
                    setLoading(false);
                }
            );
        } else {
            setLocationError('Geolocation is not supported by your browser.');
            setLoading(false);
        }
    };

    const validateLocation = async (userLat: number, userLng: number) => {
        try {
            const shopRes = await axios.get(`${API_BASE_URL}/shops/${shopId}`);
            const shop = shopRes.data;

            if (shop.isActive === false) {
                setIsShopInactive(true);
                setLoading(false);
                return;
            }

            setShop(shop);

            // Calculate distance using Haversine formula
            const distance = calculateDistance(userLat, userLng, shop.latitude, shop.longitude);

            if (distance > 10000) {
                setLocationError(`You are too far from this restaurant (${(distance / 1000).toFixed(2)} km away). You must be within 10 km to place an order.`);
                setLoading(false);
            } else {
                setLoading(false);
            }
        } catch (error) {
            setLocationError('Failed to load shop information.');
            setLoading(false);
        }
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    const fetchShopAndProducts = async () => {
        try {
            const productsRes = await axios.get(`${API_BASE_URL}/products?shopId=${shopId}`);
            setProducts(productsRes.data);
        } catch (error) {
            console.error('Failed to fetch products');
        }
    };

    const addToCart = (product: Product) => {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            setCart(cart.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity === 0) {
            removeFromCart(productId);
        } else {
            setCart(cart.map(item =>
                item.id === productId ? { ...item, quantity } : item
            ));
        }
    };

    const getTotalAmount = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return;
        if (!sessionId || !customerName) {
            setShowSessionModal(true);
            return;
        }

        setPlacingOrder(true);
        try {
            const orderData = {
                shopId,
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                totalAmount: getTotalAmount(),
                sessionId,
                customerName,
                customerContact
            };

            // For now, we'll need authentication. In a real app, you might allow guest orders
            // or have a simplified auth flow for customers
            const token = localStorage.getItem('token');
            const endpoint = token ? `${API_BASE_URL}/orders` : `${API_BASE_URL}/orders/guest`;
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;

            await axios.post(endpoint, orderData, config);

            alert('Order placed successfully!');
            setCart([]);
            setShowCart(false);
            fetchSessionOrders();
        } catch (error) {
            alert('Failed to place order. Please try again.');
        } finally {
            setPlacingOrder(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="glass backdrop-blur-xl bg-white/10 p-12 rounded-3xl border border-white/20 text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading menu...</p>
                </div>
            </div>
        );
    }

    if (isShopInactive) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <div className="glass backdrop-blur-xl bg-white/10 p-12 rounded-3xl border border-red-500/30 text-center max-w-md">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">QR Menu Inactive</h2>
                    <p className="text-gray-300 mb-6">
                        This QR Menu feature is currently inactive. Please contact the staff for assistance.
                    </p>
                </div>
            </div>
        );
    }

    if (locationError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <div className="glass backdrop-blur-xl bg-white/10 p-12 rounded-3xl border border-red-500/50 text-center max-w-md">
                    <div className="text-6xl mb-4">📍</div>
                    <h2 className="text-2xl font-bold text-white mb-4">Location Required</h2>
                    <p className="text-gray-300 mb-6">{locationError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="glass backdrop-blur-xl bg-white/10 border-b border-white/20 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-white">{shop?.name}</h1>
                            <p className="text-gray-300 text-sm">
                                {customerName ? `Ordering as ${customerName}` : 'Browse our menu'}
                            </p>
                            {remainingTime && (
                                <p className="text-xs text-purple-200 mt-1">
                                    Session expires in {remainingTime}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => setShowCart(true)}
                            className="relative px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
                        >
                            🛒 Cart
                            {cart.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Session Orders */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="glass backdrop-blur-xl bg-white/10 p-6 rounded-2xl border border-white/20 mb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-white">Your Orders</h2>
                            <p className="text-gray-300 text-sm">
                                {sessionOrders.length > 0 ? 'Track the status of your recent orders.' : 'Orders will appear here once you place them.'}
                            </p>
                        </div>
                        <button
                            onClick={fetchSessionOrders}
                            disabled={ordersRefreshing || !sessionId}
                            className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition disabled:opacity-50"
                        >
                            {ordersRefreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                    {sessionOrders.length === 0 ? (
                        <p className="text-gray-400 text-sm">No orders yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {sessionOrders.map((order) => (
                                <div key={order.id} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                                    <div>
                                        <p className="text-white font-semibold">Order #{order.id.slice(0, 8)}</p>
                                        <p className="text-gray-400 text-xs">{new Date(order.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-300 mb-1">{formatCurrency(order.totalAmount)}</p>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/40' :
                                            order.status === 'preparing' ? 'bg-blue-500/20 text-blue-200 border border-blue-500/40' :
                                                order.status === 'ready' ? 'bg-green-500/20 text-green-200 border border-green-500/40' :
                                                    order.status === 'completed' ? 'bg-gray-500/20 text-gray-200 border border-gray-500/40' :
                                                        'bg-purple-500/20 text-purple-200 border border-purple-500/40'
                                            }`}>
                                            {order.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Products Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                {products.length === 0 ? (
                    <div className="glass backdrop-blur-xl bg-white/10 p-12 rounded-2xl border border-white/20 text-center">
                        <p className="text-gray-300 text-lg">No items available yet</p>
                    </div>
                ) : (
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
                                    <button
                                        onClick={() => addToCart(product)}
                                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg btn-hover"
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Cart Sidebar */}
            {showCart && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
                    <div className="w-full max-w-md bg-gradient-to-br from-slate-900 to-purple-900 h-full overflow-y-auto shadow-2xl animate-slideIn">
                        <div className="sticky top-0 glass backdrop-blur-xl bg-white/10 border-b border-white/20 p-6 z-10">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white">Your Cart</h2>
                                <button
                                    onClick={() => setShowCart(false)}
                                    className="text-white hover:text-gray-300 text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {cart.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-300 text-lg">Your cart is empty</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4 mb-6">
                                        {cart.map((item) => (
                                            <div key={item.id} className="glass backdrop-blur-xl bg-white/10 p-4 rounded-xl border border-white/20">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-white font-semibold">{item.name}</h3>
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                                <p className="text-green-400 font-semibold mb-2">{formatCurrency(item.price)}</p>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold transition-all"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="text-white font-semibold">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold transition-all"
                                                    >
                                                        +
                                                    </button>
                                                    <span className="text-gray-300 ml-auto">
                                                        {formatCurrency(item.price * item.quantity)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="glass backdrop-blur-xl bg-white/10 p-4 rounded-xl border border-white/20 mb-6">
                                        <div className="flex items-center justify-between text-sm text-gray-300">
                                            <div>
                                                <p className="font-semibold text-white">Session</p>
                                                <p>{customerName}</p>
                                                {customerContact && <p>{customerContact}</p>}
                                                {remainingTime && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Remaining: {remainingTime}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setShowSessionModal(true)}
                                                className="text-purple-300 hover:text-purple-200 underline"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>

                                    <div className="glass backdrop-blur-xl bg-white/10 p-6 rounded-xl border border-white/20 mb-6">
                                        <div className="flex justify-between items-center text-xl font-bold text-white">
                                            <span>Total:</span>
                                            <span className="text-green-400">{formatCurrency(getTotalAmount())}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={placingOrder}
                                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50 btn-hover"
                                    >
                                        {placingOrder ? 'Placing Order...' : 'Place Order'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Session Modal */}
            {showSessionModal && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
                    <div className="glass backdrop-blur-2xl bg-white/10 p-8 rounded-3xl border border-white/20 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-white mb-4">Who is ordering?</h2>
                        <p className="text-gray-300 mb-6">
                            Please share a name or table/phone number so staff can match your order.
                        </p>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (!customerName.trim()) return;
                                setupSession(customerName.trim(), customerContact.trim());
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="e.g. John D / Table 4"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Number (optional)</label>
                                <input
                                    type="text"
                                    value={customerContact}
                                    onChange={(e) => setCustomerContact(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Phone or table number"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
                            >
                                Continue
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

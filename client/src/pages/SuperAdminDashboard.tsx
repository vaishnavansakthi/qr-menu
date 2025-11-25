import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { extractCoordinatesFromMapsUrl, validateCoordinates } from '../utils/mapsUtils';

interface Admin {
    id: string;
    email: string;
    name: string;
}

interface Shop {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    qrCodeUrl: string;
    ownerId: string;
    owner?: { name: string; email: string };
}

export const SuperAdminDashboard: React.FC = () => {
    const [shops, setShops] = useState<Shop[]>([]);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [name, setName] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [mapsUrl, setMapsUrl] = useState('');
    const [selectedAdminId, setSelectedAdminId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);
    const { token, user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchShops();
        fetchAdmins();
    }, []);

    const fetchShops = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/shops`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShops(response.data);
        } catch (error) {
            console.error('Failed to fetch shops');
        }
    };

    const fetchAdmins = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/users/admins`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAdmins(response.data);
        } catch (error) {
            console.error('Failed to fetch admins');
        }
    };

    const handleCreateShop = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const shopData: any = {
                name,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            };

            // If an admin is selected, assign the shop to them
            if (selectedAdminId) {
                shopData.ownerId = selectedAdminId;
            }

            await axios.post(`${API_BASE_URL}/shops`, shopData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchShops();
            setName('');
            setLatitude('');
            setLongitude('');
            setMapsUrl('');
            setSelectedAdminId('');
        } catch (error) {
            console.error('Failed to create shop');
        } finally {
            setLoading(false);
        }
    };

    const handleEditShop = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingShop) return;

        setLoading(true);
        try {
            await axios.patch(`${API_BASE_URL}/shops/${editingShop.id}`, {
                name: editingShop.name,
                latitude: editingShop.latitude,
                longitude: editingShop.longitude
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchShops();
            setEditingShop(null);
        } catch (error) {
            console.error('Failed to update shop');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteShop = async (id: string) => {
        if (!confirm('Are you sure you want to delete this shop? This will also delete all associated products and orders.')) return;

        try {
            await axios.delete(`${API_BASE_URL}/shops/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchShops();
        } catch (error) {
            console.error('Failed to delete shop', error);
            alert('Failed to delete shop. See console for details.');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLatitude(position.coords.latitude.toString());
                    setLongitude(position.coords.longitude.toString());
                },
                () => {
                    alert('Unable to get location. Please enter manually.');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    };

    const handleMapsUrlChange = (url: string) => {
        setMapsUrl(url);
        if (url.trim()) {
            const coords = extractCoordinatesFromMapsUrl(url);
            if (coords && validateCoordinates(coords.latitude, coords.longitude)) {
                setLatitude(coords.latitude.toString());
                setLongitude(coords.longitude.toString());
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
            {/* Header */}
            <header className="glass backdrop-blur-xl bg-white/10 border-b border-white/20 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white gradient-text">Super Admin Dashboard</h1>
                            <p className="text-gray-300 text-sm mt-1">Welcome back, {user?.name}</p>
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
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fadeIn">
                    <div className="glass backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-6 rounded-2xl border border-blue-500/30 card-hover">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-200 text-sm font-medium">Total Shops</p>
                                <p className="text-3xl font-bold text-white mt-2">{shops.length}</p>
                            </div>
                            <div className="bg-blue-500/30 p-3 rounded-xl">
                                <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="glass backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-6 rounded-2xl border border-purple-500/30 card-hover">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-200 text-sm font-medium">Active Shops</p>
                                <p className="text-3xl font-bold text-white mt-2">{Array.isArray(shops) ? shops.filter(s => s.ownerId).length : 0}</p>
                            </div>
                            <div className="bg-purple-500/30 p-3 rounded-xl">
                                <svg className="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="glass backdrop-blur-xl bg-gradient-to-br from-pink-500/20 to-pink-600/20 p-6 rounded-2xl border border-pink-500/30 card-hover">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-pink-200 text-sm font-medium">Unassigned</p>
                                <p className="text-3xl font-bold text-white mt-2">{Array.isArray(shops) ? shops.filter(s => !s.ownerId).length : 0}</p>
                            </div>
                            <div className="bg-pink-500/30 p-3 rounded-xl">
                                <svg className="w-8 h-8 text-pink-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Create/Edit Shop Form */}
                <div className="glass backdrop-blur-xl bg-white/10 p-8 rounded-2xl border border-white/20 mb-8 animate-slideIn">
                    <h2 className="text-2xl font-bold text-white mb-6">
                        {editingShop ? 'Edit Shop' : 'Create New Shop'}
                    </h2>
                    <form onSubmit={editingShop ? handleEditShop : handleCreateShop} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <input
                                type="text"
                                placeholder="Shop Name"
                                className="bg-white/10 border border-white/20 text-white placeholder-gray-400 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                value={editingShop ? editingShop.name : name}
                                onChange={(e) => editingShop
                                    ? setEditingShop({ ...editingShop, name: e.target.value })
                                    : setName(e.target.value)}
                                required
                            />

                            {!editingShop && (
                                <div>
                                    <input
                                        type="text"
                                        placeholder="🗺️ Paste Google Maps URL (e.g., https://maps.google.com/...)"
                                        className="bg-white/10 border border-white/20 text-white placeholder-gray-400 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all w-full"
                                        value={mapsUrl}
                                        onChange={(e) => handleMapsUrlChange(e.target.value)}
                                    />
                                    <p className="text-gray-400 text-xs mt-2">
                                        💡 Paste a Google Maps link to automatically extract coordinates
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="Latitude"
                                    className="bg-white/10 border border-white/20 text-white placeholder-gray-400 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                    value={editingShop ? editingShop.latitude : latitude}
                                    onChange={(e) => editingShop
                                        ? setEditingShop({ ...editingShop, latitude: parseFloat(e.target.value) })
                                        : setLatitude(e.target.value)}
                                    required
                                />
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="Longitude"
                                    className="bg-white/10 border border-white/20 text-white placeholder-gray-400 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                    value={editingShop ? editingShop.longitude : longitude}
                                    onChange={(e) => editingShop
                                        ? setEditingShop({ ...editingShop, longitude: parseFloat(e.target.value) })
                                        : setLongitude(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Admin Selection - Show for both creating and editing */}
                        <div>
                            <label className="block text-white text-sm font-medium mb-2">
                                {editingShop ? 'Reassign to Admin (Optional)' : 'Assign to Admin (Optional)'}
                            </label>
                            <select
                                className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                value={editingShop ? (editingShop.ownerId || '') : selectedAdminId}
                                onChange={(e) => editingShop
                                    ? setEditingShop({ ...editingShop, ownerId: e.target.value || '' })
                                    : setSelectedAdminId(e.target.value)}
                            >
                                <option value="" className="bg-gray-800">No assignment (leave unassigned)</option>
                                {admins.map((admin) => (
                                    <option key={admin.id} value={admin.id} className="bg-gray-800">
                                        {admin.name} ({admin.email})
                                    </option>
                                ))}
                            </select>
                            <p className="text-gray-400 text-xs mt-2">
                                {editingShop
                                    ? '💡 Change the admin assigned to this shop, or leave unassigned'
                                    : '💡 Select an admin to assign this shop to them, or leave unassigned to assign later'}
                            </p>
                        </div>

                        <div className="flex gap-4">
                            {!editingShop && (
                                <button
                                    type="button"
                                    onClick={getCurrentLocation}
                                    className="px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-xl transition-all border border-blue-500/50 font-medium"
                                >
                                    📍 Use My Location
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold p-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50 btn-hover"
                            >
                                {loading ? 'Saving...' : (editingShop ? 'Update Shop' : 'Create Shop')}
                            </button>
                            {editingShop && (
                                <button
                                    type="button"
                                    onClick={() => setEditingShop(null)}
                                    className="px-6 bg-gray-600/50 text-white font-semibold rounded-xl hover:bg-gray-600/70 transition-all"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Shops Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {shops.map((shop) => (
                        <div key={shop.id} className="glass backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6 card-hover">
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">{shop.name}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${shop.ownerId
                                    ? 'bg-green-500/20 text-green-200 border border-green-500/50'
                                    : 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/50'
                                    }`}>
                                    {shop.ownerId ? 'Active' : 'Unassigned'}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <p className="text-gray-300 text-sm">
                                    📍 {Number(shop.latitude).toFixed(6)}, {Number(shop.longitude).toFixed(6)}
                                </p>
                                {shop.owner && (
                                    <p className="text-gray-400 text-sm">
                                        👤 {shop.owner.name}
                                    </p>
                                )}
                            </div>

                            {shop.qrCodeUrl && (
                                <div className="mb-4 bg-white p-3 rounded-xl">
                                    <img src={shop.qrCodeUrl} alt="Shop QR Code" className="w-full h-auto" />
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingShop(shop)}
                                    className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 py-2 rounded-lg transition-all border border-blue-500/50 font-medium"
                                >
                                    Edit
                                </button>
                                {/* Download QR */}
                                {shop.qrCodeUrl && (
                                    <a
                                        href={shop.qrCodeUrl}
                                        download={`qr-${shop.name}.png`}
                                        className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-200 py-2 rounded-lg transition-all border border-green-500/50 font-medium text-center"
                                    >
                                        Download QR
                                    </a>
                                )}
                                {/* Delete button */}
                                <button
                                    onClick={() => handleDeleteShop(shop.id)}
                                    className="px-4 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-all border border-red-500/50"
                                >
                                    🗑️
                                </button>


                            </div>
                            {/* Shop URL and copy button */}
                            {shop.qrCodeUrl && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-sm text-gray-300 break-all">
                                        {`${window.location.origin}/shop/${shop.id}`}
                                    </span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/shop/${shop.id}`);
                                            alert('Shop URL copied to clipboard');
                                        }}
                                        className="px-2 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 rounded"
                                    >
                                        Copy URL
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

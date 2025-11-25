import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export const Register: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('user');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        if (value && !validateEmail(value)) {
            setEmailError('Please enter a valid email address');
        } else {
            setEmailError('');
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        if (value && value.length < 6) {
            setPasswordError('Password must be at least 6 characters');
        } else {
            setPasswordError('');
        }
        // Check confirm password match
        if (confirmPassword && value !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
        } else {
            setConfirmPasswordError('');
        }
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setConfirmPassword(value);
        if (value && value !== password) {
            setConfirmPasswordError('Passwords do not match');
        } else {
            setConfirmPasswordError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address');
            return;
        }
        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await axios.post(`${API_BASE_URL}/auth/register`, { email, password, name, role });
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-4 animate-fadeIn">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse top-0 right-0"></div>
                <div className="absolute w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse bottom-0 left-0" style={{ animationDelay: '1s' }}></div>
                <div className="absolute w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative glass backdrop-blur-xl bg-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold text-white mb-2 gradient-text">Create Account</h2>
                    <p className="text-gray-300">Join QR Menu today</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm animate-slideIn">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-white font-medium mb-2">Full Name</label>
                        <input
                            type="text"
                            className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-white font-medium mb-2">Email Address</label>
                        <input
                            type="email"
                            className={`w-full bg-white/10 border ${emailError ? 'border-red-500' : 'border-white/20'} text-white placeholder-gray-400 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                            placeholder="you@example.com"
                            value={email}
                            onChange={handleEmailChange}
                            required
                        />
                        {emailError && <p className="text-red-400 text-sm mt-1">{emailError}</p>}
                    </div>

                    <div>
                        <label className="block text-white font-medium mb-2">Password</label>
                        <input
                            type="password"
                            className={`w-full bg-white/10 border ${passwordError ? 'border-red-500' : 'border-white/20'} text-white placeholder-gray-400 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                            placeholder="••••••••"
                            value={password}
                            onChange={handlePasswordChange}
                            required
                        />
                        {passwordError && <p className="text-red-400 text-sm mt-1">{passwordError}</p>}
                    </div>

                    <div>
                        <label className="block text-white font-medium mb-2">Confirm Password</label>
                        <input
                            type="password"
                            className={`w-full bg-white/10 border ${confirmPasswordError ? 'border-red-500' : 'border-white/20'} text-white placeholder-gray-400 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            required
                        />
                        {confirmPasswordError && <p className="text-red-400 text-sm mt-1">{confirmPasswordError}</p>}
                    </div>

                    <div>
                        <label className="block text-white font-medium mb-2">Account Type</label>
                        <select
                            className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="user" className="bg-gray-800">Customer</option>
                            <option value="admin" className="bg-gray-800">Shop Owner</option>
                            <option value="super_admin" className="bg-gray-800">Super Admin</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !!emailError || !!passwordError || !!confirmPasswordError}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold p-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none btn-hover"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating account...
                            </div>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-300">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

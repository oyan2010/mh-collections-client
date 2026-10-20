import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import BottomNav from '../components/BottomNav';

export default function Account() {
    const navigate = useNavigate();
    const { user, isAdmin, userData, logout, login } = useAuthStore();
    const [showLogin, setShowLogin] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                setShowLogin(false);
                if (result.isAdmin) {
                    navigate('/admin');
                }
            } else {
                setError(result.error || 'Login failed');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-primary font-display antialiased pb-20">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-100 p-4">
                <h1 className="text-xl font-bold text-center">Account</h1>
            </div>

            <div className="p-5">
                {user ? (
                    <div className="space-y-6">
                        {/* User Info */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold">
                                    {user.email?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-lg">{userData?.name || 'User'}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                    {isAdmin && (
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-primary text-white text-xs font-medium rounded">
                                            Admin
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                            <Link to="/tracking" className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-gray-500">local_shipping</span>
                                    <span className="font-medium">Track Orders</span>
                                </div>
                                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                            </Link>

                            {isAdmin && (
                                <Link to="/admin" className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-gray-500">inventory_2</span>
                                        <span className="font-medium">Admin Dashboard</span>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                                </Link>
                            )}

                            <Link to="/addresses" className="w-full flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-gray-500">location_on</span>
                                    <span className="font-medium">Saved Addresses</span>
                                </div>
                                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                            </Link>

                            <Link to="/settings" className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-gray-500">settings</span>
                                    <span className="font-medium">Settings</span>
                                </div>
                                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                            </Link>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-red-500 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Login Prompt */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 text-center">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-4xl text-gray-400">person</span>
                            </div>
                            <h2 className="text-xl font-bold mb-2">Welcome to MH</h2>
                            <p className="text-gray-500 text-sm mb-6">Sign in to track orders and manage your account</p>

                            {!showLogin ? (
                                <button
                                    onClick={() => setShowLogin(true)}
                                    className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-black/90 transition-colors"
                                >
                                    Sign In
                                </button>
                            ) : (
                                <form onSubmit={handleLogin} className="space-y-4 text-left">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full h-12 px-4 border border-gray-200 rounded-lg focus:border-primary focus:ring-0"
                                        placeholder="Email"
                                        required
                                    />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-12 px-4 border border-gray-200 rounded-lg focus:border-primary focus:ring-0"
                                        placeholder="Password"
                                        required
                                    />
                                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Signing in...' : 'Sign In'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowLogin(false)}
                                        className="w-full text-gray-500 text-sm"
                                    >
                                        Cancel
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Guest Options */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                            <Link to="/tracking" className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-gray-500">local_shipping</span>
                                    <span className="font-medium">Track an Order</span>
                                </div>
                                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}

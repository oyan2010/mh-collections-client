import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

// Simple CAPTCHA Component
function Captcha({ value, onRefresh }) {
    const handleCopy = (e) => {
        e.preventDefault();
        // Replace copied text with message
        e.clipboardData.setData('text/plain', 'Please Enter code by yourself');
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Security Code
            </label>
            <div className="flex gap-2">
                <div 
                    onCopy={handleCopy}
                    onContextMenu={handleContextMenu}
                    className="flex-1 h-12 px-4 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center select-none"
                    style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none' }}
                >
                    <span className="text-2xl font-mono font-bold text-primary tracking-widest">
                        {value}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onRefresh}
                    className="h-12 px-4 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                    title="Refresh Code"
                >
                    <span className="material-symbols-outlined">refresh</span>
                </button>
            </div>
        </div>
    );
}

export default function Login() {
    const navigate = useNavigate();
    const { signup, login, user, isAdmin, loading: authLoading } = useAuthStore();
    const [isSignup, setIsSignup] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        captchaInput: ''
    });
    const [captchaCode, setCaptchaCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Generate random captcha code
    const generateCaptcha = () => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setCaptchaCode(code);
    };

    useEffect(() => {
        generateCaptcha();
    }, []);

    useEffect(() => {
        if (user && !authLoading) {
            if (isAdmin) {
                navigate('/admin');
            } else {
                navigate('/');
            }
        }
    }, [user, isAdmin, authLoading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSignup) {
                // Validate Captcha
                if (formData.captchaInput !== captchaCode) {
                    setError('Security code is incorrect. Please try again.');
                    setLoading(false);
                    generateCaptcha();
                    setFormData({ ...formData, captchaInput: '' });
                    return;
                }

                // Signup Flow
                if (formData.password !== formData.confirmPassword) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }
                if (formData.password.length < 6) {
                    setError('Password must be at least 6 characters');
                    setLoading(false);
                    return;
                }
                
                const result = await signup(formData.email, formData.password, formData.name);
                if (result.success) {
                    toast.success('Account created successfully!');
                    navigate('/');
                } else {
                    // Custom error handling for signup
                    if (result.error.includes('email-already-in-use')) {
                        setError('Email already registered. Please login instead.');
                    } else if (result.error.includes('invalid-email')) {
                        setError('Invalid email address');
                    } else if (result.error.includes('weak-password')) {
                        setError('Password is too weak. Use at least 6 characters.');
                    } else {
                        setError('Failed to create account. Please try again.');
                    }
                    generateCaptcha();
                    setFormData({ ...formData, captchaInput: '' });
                }
            } else {
                // Login Flow
                const result = await login(formData.email, formData.password);
                if (result.success) {
                    toast.success('Logged in successfully!');
                    if (result.isAdmin) {
                        navigate('/admin');
                    } else {
                        navigate('/');
                    }
                } else {
                    // Custom error handling for login
                    if (result.error.includes('user-not-found') || result.error.includes('invalid-credential')) {
                        setError('User not found. Please create an account.');
                        // Auto-switch to signup mode after 2 seconds
                        setTimeout(() => {
                            setIsSignup(true);
                            setError('');
                            generateCaptcha();
                        }, 2000);
                    } else if (result.error.includes('wrong-password')) {
                        setError('Incorrect password. Please try again.');
                    } else if (result.error.includes('invalid-email')) {
                        setError('Invalid email address');
                    } else if (result.error.includes('too-many-requests')) {
                        setError('Too many failed attempts. Please try again later.');
                    } else {
                        setError('Login failed. Please check your credentials.');
                    }
                }
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            if (isSignup) {
                generateCaptcha();
                setFormData({ ...formData, captchaInput: '' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleMode = () => {
        setIsSignup(!isSignup);
        setError('');
        setFormData({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            captchaInput: ''
        });
        if (!isSignup) {
            generateCaptcha();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4 font-display">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <img src="/mha.png" alt="MH Collections" className="h-16 w-auto mx-auto mb-4" />
                    <h2 className="text-2xl font-black mb-2">{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
                    <p className="text-sm text-gray-500">
                        {isSignup ? 'Sign up to start shopping' : 'Sign in to your account'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignup && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-primary dark:text-white focus:border-primary dark:focus:border-white focus:ring-0 transition-colors"
                                placeholder="Enter your name"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-primary dark:text-white focus:border-primary dark:focus:border-white focus:ring-0 transition-colors"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-primary dark:text-white focus:border-primary dark:focus:border-white focus:ring-0 transition-colors"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    {isSignup && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-primary dark:text-white focus:border-primary dark:focus:border-white focus:ring-0 transition-colors"
                                    placeholder="Confirm your password"
                                    required
                                />
                            </div>

                            {/* CAPTCHA */}
                            <Captcha value={captchaCode} onRefresh={generateCaptcha} />
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Enter Security Code
                                </label>
                                <input
                                    type="text"
                                    name="captchaInput"
                                    value={formData.captchaInput}
                                    onChange={handleInputChange}
                                    className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-primary dark:text-white focus:border-primary dark:focus:border-white focus:ring-0 transition-colors"
                                    placeholder="Enter the code above"
                                    required
                                    autoComplete="off"
                                />
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm text-center py-3 px-4 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-primary dark:bg-white text-white dark:text-primary font-bold rounded-lg hover:bg-black/90 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        {loading ? (isSignup ? 'Creating Account...' : 'Signing in...') : (isSignup ? 'Create Account' : 'Sign In')}
                    </button>
                </form>

                {/* Toggle Signup/Login */}
                <div className="text-center mt-6">
                    <button
                        onClick={toggleMode}
                        className="text-sm text-gray-500 hover:text-primary transition-colors"
                    >
                        {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                </div>

                {/* Back Link */}
                <div className="text-center mt-4">
                    <button
                        onClick={() => navigate('/')}
                        className="text-sm text-gray-400 hover:text-primary transition-colors"
                    >
                        ← Back to Store
                    </button>
                </div>
            </div>
        </div>
    );
}

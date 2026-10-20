import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useCartStore } from '../stores/cartStore';
import { useLocationStore } from '../stores/locationStore';
import { useAuthStore } from '../stores/authStore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

const IMGBB_API_KEY = 'fa4b108fcccbf1cb9e69b64ae7e7212e';
const PAK_PROVINCES = ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad', 'Gilgit-Baltistan', 'Azad Kashmir'];

export default function Checkout() {
    const navigate = useNavigate();
    const { items, getCartTotal, clearCart, updateQuantity, removeFromCart } = useCartStore();
    const { lat, lng } = useLocationStore();
    const { user, updateUserData, login } = useAuthStore();

    const [step, setStep] = useState('form'); // form, success
    const [placedOrderId, setPlacedOrderId] = useState(null);

    const [formData, setFormData] = useState({
        fullName: user?.displayName || '',
        phone: '',
        address: '',
        city: '',
        province: 'Punjab',
        zip: '', // Optional
    });

    const [paymentMethod, setPaymentMethod] = useState('COD'); // COD, Easypaisa
    const [easypaisaDetails, setEasypaisaDetails] = useState({ trxId: '', screenshot: null });
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(false);

    // Guest vs Login Logic
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const uploadScreenshot = async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData, {
            onUploadProgress: (ev) => setUploadProgress(Math.round((ev.loaded * 100) / ev.total))
        });
        return res.data.data.url;
    };

    const handleSubmit = async () => {
        if (items.length === 0) return toast.error('Cart is empty');
        if (!formData.fullName || !formData.phone || !formData.address || !formData.city) {
            return toast.error('Please fill in all required fields');
        }

        if (paymentMethod === 'Easypaisa') {
            if (!easypaisaDetails.trxId || !easypaisaDetails.screenshot) {
                return toast.error('Please provide Transaction ID and upload screenshot');
            }
        }

        setLoading(true);
        const loadingToast = toast.loading('Processing Order...');

        try {
            let screenshotUrl = null;
            if (paymentMethod === 'Easypaisa') {
                screenshotUrl = await uploadScreenshot(easypaisaDetails.screenshot);
            }

            const orderId = `MH-${Date.now().toString().slice(-6)}`;
            const orderData = {
                orderId,
                customer: {
                    name: formData.fullName,
                    phone: formData.phone,
                    address: `${formData.address}, ${formData.city}, ${formData.province}`,
                    rawAddress: formData,
                },
                cartItems: items,
                totalAmount: getCartTotal(),
                status: 'Placed',
                paymentMethod,
                paymentDetails: paymentMethod === 'Easypaisa' ? {
                    trxId: easypaisaDetails.trxId,
                    screenshotUrl,
                    verified: false
                } : null,
                location: lat && lng ? { lat, lng } : null,
                userId: user ? user.uid : 'guest',
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'orders'), orderData);

            // Save address if logged in
            if (user) {
                await updateUserData({
                    phone: formData.phone,
                    address: orderData.customer.address
                });
            }

            setPlacedOrderId(orderId);
            clearCart();
            toast.success('Order Placed Successfully!', { id: loadingToast });
            setStep('success');

        } catch (error) {
            console.error('Order Error:', error);
            toast.error('Failed to place order: ' + error.message, { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    const handleLoginToSave = async (e) => {
        e.preventDefault();
        try {
            const res = await login(loginEmail, loginPassword);
            if (res.success) {
                toast.success('Logged in & Saved!');
                navigate('/tracking?orderId=' + placedOrderId);
            } else {
                toast.error(res.error);
            }
        } catch (err) {
            toast.error('Login failed');
        }
    };

    const handleGetLocation = () => {
        if ("geolocation" in navigator) {
            toast.promise(
                new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            // In a real app we would reverse geocode
                            resolve(position);
                        },
                        (error) => reject(error)
                    );
                }),
                {
                    loading: 'Detecting location...',
                    success: 'Location detected! (Address auto-fill simulated)',
                    error: 'Could not get location',
                }
            ).then(() => {
                // Simulate auto-fill
                setFormData({ ...formData, city: 'Lahore', province: 'Punjab' });
            });
        } else {
            toast.error("Geolocation not supported");
        }
    };

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-green-600">check_circle</span>
                </div>
                <h1 className="text-2xl font-black uppercase mb-2">Order Placed!</h1>
                <p className="text-gray-500 mb-8">Thank you for shopping with MH Collections.</p>

                <div className="bg-gray-50 p-6 rounded-xl w-full max-w-sm border border-dashed border-gray-300 mb-8">
                    <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">Order ID</p>
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl font-black font-mono tracking-tight">{placedOrderId}</span>
                        <button onClick={() => { navigator.clipboard.writeText(placedOrderId); toast.success('Copied!'); }} className="text-primary hover:bg-gray-200 p-1 rounded">
                            <span className="material-symbols-outlined text-lg">content_copy</span>
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Save this ID to track your order.</p>
                </div>

                {!user ? (
                    <div className="w-full max-w-sm space-y-4">
                        {!showLoginPrompt ? (
                            <>
                                <Link to={`/tracking?orderId=${placedOrderId}`} className="block w-full py-4 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
                                    Track Order Now
                                </Link>
                                <button onClick={() => setShowLoginPrompt(true)} className="block w-full py-4 border border-gray-200 font-bold rounded-xl hover:bg-gray-50">
                                    Save Order to Account
                                </button>
                            </>
                        ) : (
                            <form onSubmit={handleLoginToSave} className="space-y-3 bg-white border border-gray-100 p-4 rounded-xl shadow-lg">
                                <h3 className="font-bold">Login to Save</h3>
                                <input type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-3 border rounded-lg" required />
                                <input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full p-3 border rounded-lg" required />
                                <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-lg">Login</button>
                            </form>
                        )}
                    </div>
                ) : (
                    <Link to={`/tracking?orderId=${placedOrderId}`} className="w-full max-w-sm py-4 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
                        Track Order
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light pb-28 font-display">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm p-4 border-b border-gray-100 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="hover:bg-gray-100 p-2 rounded-full"><span className="material-symbols-outlined">arrow_back</span></button>
                <h1 className="text-xl font-bold">Checkout</h1>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6">

                {/* Cart Summary */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <h2 className="font-bold text-lg">Your Cart ({items.length})</h2>
                    {items.map(item => (
                        <div key={`${item.id}-${item.size}`} className="flex gap-4">
                            <img src={item.imageUrl} alt={item.title} className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-medium line-clamp-1">{item.title}</h3>
                                    <p className="text-sm text-gray-500">Size: {item.size}</p>
                                </div>
                                <div className="flex justify-between items-end">
                                    <p className="font-bold">${item.price}</p>
                                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-2 py-1">
                                        <button onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.size, item.quantity - 1) : removeFromCart(item.id, item.size)} className="w-6 h-6 flex items-center justify-center bg-white shadow-sm rounded-full text-sm">-</button>
                                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-white shadow-sm rounded-full text-sm">+</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-gray-500">Total</span>
                        <span className="text-2xl font-black">${getCartTotal().toFixed(2)}</span>
                    </div>
                </div>

                {/* Shipping Info */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            <span className="material-symbols-outlined">local_shipping</span> Shipping Details
                        </h2>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleGetLocation}
                            className="text-xs bg-gray-50 hover:bg-gray-100 text-primary font-bold px-3 py-2 rounded-lg flex items-center gap-1 transition-colors border border-gray-200"
                        >
                            <span className="material-symbols-outlined text-[16px]">my_location</span> Use Location
                        </motion.button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <input name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleInputChange} className="input-field p-3 border rounded-lg w-full" />
                        <input name="phone" placeholder="Phone Number (03...)" type="tel" value={formData.phone} onChange={handleInputChange} className="input-field p-3 border rounded-lg w-full" />
                        <div className="grid grid-cols-2 gap-4">
                            <select name="province" value={formData.province} onChange={handleInputChange} className="input-field p-3 border rounded-lg w-full bg-white">
                                {PAK_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <input name="city" placeholder="City" value={formData.city} onChange={handleInputChange} className="input-field p-3 border rounded-lg w-full" />
                        </div>
                        <textarea name="address" placeholder="Complete Address (House #, Street, Area)" value={formData.address} onChange={handleInputChange} rows={2} className="input-field p-3 border rounded-lg w-full" />
                    </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <span className="material-symbols-outlined">payments</span> Payment Method
                    </h2>

                    <div className="grid grid-cols-2 gap-3">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setPaymentMethod('COD')}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'COD' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                            <span className="material-symbols-outlined text-3xl">local_atm</span>
                            <span className="font-bold text-sm">Cash on Delivery</span>
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setPaymentMethod('Easypaisa')}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'Easypaisa' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                            <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
                            <span className="font-bold text-sm">Easypaisa</span>
                        </motion.button>
                    </div>

                    {paymentMethod === 'Easypaisa' && (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100 space-y-4 animate-in fade-in duration-300">
                            <div className="text-center">
                                <p className="text-sm text-green-800 font-medium">Send Amount to Easypaisa Account</p>
                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <p className="text-2xl font-black text-green-700 tracking-wider">0312 1714534</p>
                                    <button onClick={() => { navigator.clipboard.writeText('03121714534'); toast.success('Copied!'); }} className="p-1 hover:bg-green-200 rounded"><span className="material-symbols-outlined text-sm">content_copy</span></button>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2 border-t border-green-200">
                                <div>
                                    <label className="text-xs font-bold uppercase text-green-800">Transaction ID</label>
                                    <input
                                        placeholder="Enter Trx ID from SMS"
                                        value={easypaisaDetails.trxId}
                                        onChange={e => setEasypaisaDetails({ ...easypaisaDetails, trxId: e.target.value })}
                                        className="w-full p-3 mt-1 border border-green-200 rounded-lg focus:ring-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-green-800">Upload Screenshot</label>
                                    <input
                                        type="file" accept="image/*"
                                        onChange={e => setEasypaisaDetails({ ...easypaisaDetails, screenshot: e.target.files[0] })}
                                        className="w-full mt-1 text-sm text-green-800"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 flex gap-4 items-center justify-between z-30">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium uppercase">Total to Pay</span>
                    <span className="text-xl font-black">${getCartTotal().toFixed(2)}</span>
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    disabled={loading || items.length === 0}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wide hover:opacity-90 disabled:opacity-50 flex items-center gap-2 min-w-[200px] justify-center shadow-lg shadow-primary/20"
                >
                    {loading ? (paymentMethod === 'Easypaisa' && uploadProgress < 100 ? `Uploading ${uploadProgress}%` : 'Processing...') : 'Place Order'}
                    {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
                </motion.button>
            </div>
        </div>
    );
}

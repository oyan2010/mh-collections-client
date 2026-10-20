import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const statusSteps = ['Placed', 'Processing', 'Shipped', 'Delivered'];

export default function OrderTracking() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (searchParams.get('orderId')) {
            handleTrack();
        }
    }, []);

    const handleTrack = () => {
        if (!orderId.trim()) {
            setError('Please enter an Order ID');
            return;
        }

        setLoading(true);
        setError('');

        const q = query(collection(db, 'orders'), where('orderId', '==', orderId.trim()));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const orderData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
                setOrder(orderData);
            } else {
                setError('Order not found');
                setOrder(null);
            }
            setLoading(false);
        }, (err) => {
            console.error('Error fetching order:', err);
            setError('Failed to fetch order');
            setLoading(false);
        });

        return () => unsubscribe();
    };

    const currentStepIndex = order ? statusSteps.indexOf(order.status) : -1;

    return (
        <div className="font-display bg-background-light dark:bg-background-dark text-neutral-900 dark:text-white antialiased overflow-x-hidden min-h-screen flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-transparent">
                <div className="flex items-center justify-between px-4 h-14">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex size-10 items-center justify-center text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back_ios_new</span>
                    </button>
                    <h2 className="text-[17px] font-bold text-center flex-1 pr-10 tracking-tight">Track Order</h2>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-md mx-auto px-5 pb-24">
                {/* Search Section */}
                <div className="py-6">
                    <h1 className="text-2xl font-bold mb-4 tracking-tighter">Track your package</h1>
                    <div className="flex gap-3">
                        <div className="relative flex-1 group">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 material-symbols-outlined" style={{ fontSize: '20px' }}>search</span>
                            <input
                                type="text"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                                placeholder="Enter Order ID"
                                className="w-full h-12 bg-neutral-50 dark:bg-neutral-900 border border-transparent focus:border-neutral-200 dark:focus:border-neutral-700 rounded-lg pl-10 pr-4 text-[15px] placeholder:text-neutral-400 focus:ring-0 transition-all font-medium"
                            />
                        </div>
                        <button
                            onClick={handleTrack}
                            disabled={loading}
                            className="h-12 bg-primary hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-white rounded-lg px-5 font-semibold text-sm transition-colors flex items-center justify-center shrink-0"
                        >
                            {loading ? 'Loading...' : 'Track'}
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>

                {order && (
                    <>
                        {/* Order Context Card */}
                        <div className="mb-8 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-center gap-4">
                            <div className="size-16 rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0">
                                {order.cartItems?.[0]?.imageUrl && (
                                    <div
                                        className="w-full h-full bg-cover bg-center"
                                        style={{ backgroundImage: `url("${order.cartItems[0].imageUrl}")` }}
                                    />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-0.5">
                                    <h3 className="font-bold text-neutral-900 dark:text-white text-sm truncate pr-2">
                                        Order #{order.orderId}
                                    </h3>
                                    <span className="text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-600 dark:text-neutral-400">
                                        {order.status}
                                    </span>
                                </div>
                                <p className="text-neutral-500 text-xs mb-1 truncate">
                                    {order.cartItems?.[0]?.title} {order.cartItems?.length > 1 ? `+ ${order.cartItems.length - 1} more` : ''}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-neutral-400">
                                        Total: ${order.totalAmount?.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Vertical Stepper */}
                        <div className="pl-2">
                            {statusSteps.map((step, index) => {
                                const isCompleted = index < currentStepIndex;
                                const isCurrent = index === currentStepIndex;
                                const isPending = index > currentStepIndex;
                                const isLast = index === statusSteps.length - 1;

                                return (
                                    <div key={step} className={`flex gap-4 ${!isLast ? 'min-h-[80px]' : ''} ${isPending ? 'opacity-40' : ''}`}>
                                        <div className="flex flex-col items-center">
                                            <div className={`size-3 rounded-full z-10 ring-4 ring-white dark:ring-background-dark relative ${isCompleted || isCurrent ? 'bg-primary dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'
                                                }`}>
                                                {isCurrent && (
                                                    <div className="absolute inset-0 rounded-full animate-ping bg-primary/20 dark:bg-white/20"></div>
                                                )}
                                            </div>
                                            {!isLast && (
                                                <div className={`w-[2px] flex-1 my-1 ${isCompleted ? 'bg-primary dark:bg-white' : 'timeline-line-dotted'
                                                    }`}></div>
                                            )}
                                        </div>
                                        <div className={!isLast ? 'pb-8' : ''}>
                                            <h4 className={`text-[15px] leading-none ${isCompleted || isCurrent ? 'font-bold text-neutral-900 dark:text-white' : 'font-medium text-neutral-900 dark:text-white'
                                                }`}>
                                                {step}
                                            </h4>
                                            <p className="text-sm text-neutral-500 mt-1.5">
                                                {isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}
                                            </p>
                                            {isCurrent && (
                                                <p className="text-xs text-neutral-400 mt-1">
                                                    {step === 'Placed' && 'Your order has been received'}
                                                    {step === 'Processing' && 'Your order is being prepared for shipping'}
                                                    {step === 'Shipped' && 'Your order is on its way'}
                                                    {step === 'Delivered' && 'Your order has been delivered'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-background-dark border-t border-neutral-100 dark:border-neutral-800 pt-3 pb-safe z-30">
                <div className="flex justify-around items-center h-14 max-w-md mx-auto">
                    <button onClick={() => navigate('/')} className="flex flex-col items-center gap-1 w-16 group">
                        <span className="material-symbols-outlined text-neutral-400 group-hover:text-primary dark:group-hover:text-white transition-colors" style={{ fontSize: '24px' }}>home</span>
                    </button>
                    <button onClick={() => navigate('/shop')} className="flex flex-col items-center gap-1 w-16 group">
                        <span className="material-symbols-outlined text-neutral-400 group-hover:text-primary dark:group-hover:text-white transition-colors" style={{ fontSize: '24px' }}>search</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 w-16 text-primary dark:text-white">
                        <span className="material-symbols-outlined" style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                        <span className="size-1 bg-primary dark:bg-white rounded-full"></span>
                    </button>
                    <button onClick={() => navigate('/account')} className="flex flex-col items-center gap-1 w-16 group">
                        <span className="material-symbols-outlined text-neutral-400 group-hover:text-primary dark:group-hover:text-white transition-colors" style={{ fontSize: '24px' }}>person</span>
                    </button>
                </div>
            </nav>
            <div className="h-6 w-full bg-white dark:bg-background-dark fixed bottom-0 z-20"></div>
        </div>
    );
}

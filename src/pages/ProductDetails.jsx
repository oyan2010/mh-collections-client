import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCartStore } from '../stores/cartStore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState(null); // Default null to enforce selection
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const addToCart = useCartStore((state) => state.addToCart);
    const cartCount = useCartStore((state) => state.getCartCount());

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const docRef = doc(db, 'products', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProduct({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleAddToCart = () => {
        if (product.hasSizes !== false && !selectedSize) {
            toast.error('Please select a size first', { icon: '📏' });
            return;
        }
        if (product) {
            addToCart(product, selectedSize || 'One Size', 1);
            toast.success('Added to Cart!');
        }
    };

    const handleBuyNow = () => {
        if (product.hasSizes !== false && !selectedSize) {
            toast.error('Please select a size first', { icon: '📏' });
            return;
        }
        if (product) {
            addToCart(product, selectedSize || 'One Size', 1);
            navigate('/checkout');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Product not found</p>
            </div>
        );
    }

    const images = [product.imageUrl, product.imageUrl, product.imageUrl];
    const sizes = product.sizes || ['S', 'M', 'L', 'XL'];

    return (
        <div className="bg-white text-primary font-display antialiased relative flex flex-col min-h-screen pb-[180px]">
            {/* Top Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100/50 transition-all duration-300">
                <div className="flex items-center justify-between px-4 h-14">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                    </button>
                    <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-center flex-1">MH Collections</h2>
                    <Link
                        to="/checkout"
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors relative"
                    >
                        <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
                        {cartCount > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
                        )}
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <main className="w-full flex-grow pt-14">
                {/* Image Gallery */}
                <div className="w-full h-[60vh] relative bg-gray-50">
                    <div className="flex h-full w-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
                        {images.map((img, index) => (
                            <div key={index} className="flex-none w-full h-full snap-center relative">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="w-full h-full bg-cover bg-center"
                                    style={{ backgroundImage: `url("${img}")` }}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, index) => (
                            <div
                                key={index}
                                className={`w-1.5 h-1.5 rounded-full shadow-sm ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Product Details */}
                <div className="px-5 py-6 flex flex-col gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black leading-[0.9] tracking-tighter text-primary uppercase break-words">
                            {product.title}
                        </h1>
                        <p className="text-xl font-medium text-gray-900 tracking-tight pt-2">
                            ${product.price.toFixed(2)}
                        </p>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-4 py-2 border-y border-gray-100">
                        <div className="flex items-center gap-0.5 text-primary">
                            {[1, 2, 3, 4].map((i) => (
                                <span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    star
                                </span>
                            ))}
                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                star_half
                            </span>
                        </div>
                        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-[92%] rounded-full"></div>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 underline decoration-gray-300 underline-offset-2">
                            124 Reviews
                        </span>
                    </div>

                    {/* Description */}
                    <p className="text-base text-gray-600 leading-relaxed font-light">
                        {product.description}
                    </p>

                    {/* Size Selector */}
                    {product.hasSizes !== false && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-bold uppercase tracking-wider text-primary">Select Size</span>
                                <button className="text-xs text-gray-500 underline decoration-gray-300">Size Guide</button>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                {sizes.map((size) => (
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`aspect-square flex items-center justify-center text-sm font-medium transition-all rounded-sm ${selectedSize === size
                                            ? 'bg-primary text-white font-bold shadow-lg transform scale-[1.02]'
                                            : 'border border-gray-200 text-gray-600 hover:border-black'
                                            }`}
                                    >
                                        {size}
                                    </motion.button>
                                ))}
                            </div>
                            {!selectedSize && <p className="text-red-500 text-xs">* Size Required</p>}
                        </div>
                    )}

                    {/* Stock Info */}
                    <p className="text-sm text-gray-500">
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </p>

                    {/* Accordions */}
                    <div className="pt-4 space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium">Composition & Care</span>
                            <span className="material-symbols-outlined text-[20px]">add</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium">Shipping & Returns</span>
                            <span className="material-symbols-outlined text-[20px]">add</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 p-4 pb-8 z-40 shadow-[0_-5px_30px_rgba(0,0,0,0.03)]">
                <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAddToCart}
                        className="w-full h-12 flex items-center justify-center gap-2 border border-primary bg-white text-primary text-sm font-bold uppercase tracking-wide hover:bg-gray-50 transition-colors rounded-sm"
                    >
                        Add to Cart
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleBuyNow}
                        className="w-full h-12 flex items-center justify-center gap-2 bg-primary text-white text-sm font-bold uppercase tracking-wide shadow-xl hover:bg-black/90 transition-colors rounded-sm"
                    >
                        Buy Now
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

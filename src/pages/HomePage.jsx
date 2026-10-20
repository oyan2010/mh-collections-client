import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useCartStore } from '../stores/cartStore';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';

export default function HomePage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [heroContent, setHeroContent] = useState({
        label: 'Fall/Winter 2024',
        title: 'THE NEW\nERA OF\nBLACK.'
    });

    useEffect(() => {
        // Use real-time listener for content
        const unsub = onSnapshot(doc(db, 'siteContent', 'homepage'), (docSnap) => {
            if (docSnap.exists()) {
                setHeroContent(docSnap.data());
            }
        }, (error) => {
            console.error("Error listening to hero content:", error);
        });

        return () => unsub();
    }, []);

    const addToCart = useCartStore((state) => state.addToCart);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'products'));
                const productsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).filter(p => p.isVisible !== false);
                // Sort by date or other criteria if needed
                setProducts(productsData);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handleAddToCart = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product, 'M', 1);
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col pb-20 md:pb-0 bg-background-light dark:bg-background-dark text-primary font-display antialiased selection:bg-gray-200">
            {/* Navbar with White Background for Logo Visibility */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
                <Navbar transparent={false} />
            </div>

            {/* Hero Section */}
            <section className="relative h-[85vh] md:h-[90vh] w-full bg-primary overflow-hidden">
                <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center"
                    style={{
                        backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuArmAVorsK___AW9bXv_OY46tAbBdQCEF4f5wQrmwuo12sTKyyP5z6rmmAZHeCYxyOcVZPRVu4281TAnh4jIeLp2P47S8JZJ9dXziDUMUl2aLukL2vnj4L7RV0zB2dl60DARifkqm4qbkHzNDt_PN8bkf2WKjv_vAyUnlHNrTyoiWObv7TWaQes-QnY-_sJEtvj2Z2UT3I4mvubFwEcE5As_99l1aqVdUIA0GX3FToCIk44M3V726nMGIMAAfPBLIjp7hElbcOx70YW")'
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-16 pb-12 md:pb-20 flex flex-col items-start gap-4 max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-2"
                    >
                        <p className="text-white/80 text-sm md:text-base font-medium tracking-widest uppercase">{heroContent.label}</p>
                        <h2 className="text-white text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight max-w-[80%] md:max-w-none whitespace-pre-line">
                            {heroContent.title}
                        </h2>
                    </motion.div>
                    <Link
                        to="/shop"
                        className="mt-4 bg-white text-primary hover:bg-gray-200 transition-colors h-12 md:h-14 px-8 md:px-12 rounded-sm font-bold text-sm md:text-base tracking-wider uppercase flex items-center justify-center"
                    >
                        Shop Collection
                    </Link>
                </div>
            </section>

            {/* Main Content Area */}
            <div className="bg-background-light dark:bg-background-dark relative z-10 -mt-4 rounded-t-xl overflow-hidden">
                <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-12">
                    <div className="flex items-end justify-between pt-8 md:pt-12 pb-4 md:pb-6">
                        <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">Trending</h3>
                        <Link to="/shop" className="text-sm md:text-base font-medium text-gray-500 hover:text-primary transition-colors mb-1">
                            View All
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-8 md:gap-y-10 pb-8 md:pb-16">
                            {products.slice(0, 8).map((product, index) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link
                                        to={`/product/${product.id}`}
                                        className="group flex flex-col gap-3 cursor-pointer"
                                    >
                                        <div className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden rounded-sm">
                                            <div
                                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                                style={{ backgroundImage: `url("${product.imageUrl}")` }}
                                            />
                                            <button
                                                onClick={(e) => handleAddToCart(e, product)}
                                                className="absolute bottom-3 right-3 size-8 md:size-10 bg-white text-primary flex items-center justify-center rounded-full shadow-lg hover:bg-primary hover:text-white transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg md:text-xl font-bold">add</span>
                                            </button>
                                            {product.stock <= 5 && product.stock > 0 && (
                                                <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                                                    Low Stock
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm md:text-base font-bold text-primary leading-tight group-hover:underline">{product.title}</p>
                                            <p className="text-sm md:text-base text-gray-500 mt-1">${product.price.toFixed(2)}</p>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    <Footer />
                </div>
            </div>

            <BottomNav />
        </div>
    );
}

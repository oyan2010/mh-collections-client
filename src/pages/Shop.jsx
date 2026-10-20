import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useCartStore } from '../stores/cartStore';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';

export default function Shop() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(['All']);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('All');
    const addToCart = useCartStore((state) => state.addToCart);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Products
                const prodSnap = await getDocs(collection(db, 'products'));
                const productsData = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Fetch Categories
                const catSnap = await getDocs(collection(db, 'categories'));
                const catsData = catSnap.docs.map(doc => doc.data().name);

                // Merge with DB categories, ensuring 'All' is first
                // Only show categories that exist in the database
                const uniqueCats = ['All', ...catsData];
                setProducts(productsData);
                setCategories(uniqueCats);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAddToCart = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product, 'M', 1);
    };

    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    const filteredProducts = products.filter(p => {
        // Filter by visibility (show only visible ones)
        if (p.isVisible === false) return false;

        // Filter by category
        if (category !== 'All' && p.category !== category) return false;

        // Filter by search query
        if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        return true;
    });

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-primary font-display antialiased pb-20">
            <Navbar />

            <div className="px-5 pt-6">
                <h1 className="text-3xl font-black tracking-tight mb-4">Shop All</h1>

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${category === cat
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 px-5 py-4">
                    {filteredProducts.map((product) => (
                        <Link
                            key={product.id}
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
                                    className="absolute bottom-3 right-3 size-8 bg-white text-primary flex items-center justify-center rounded-full shadow-lg hover:bg-primary hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg font-bold">add</span>
                                </button>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-primary leading-tight">{product.title}</p>
                                <p className="text-sm text-gray-500 mt-1">${product.price.toFixed(2)}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <BottomNav />
        </div>
    );
}

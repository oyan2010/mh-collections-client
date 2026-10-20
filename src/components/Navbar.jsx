import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';

export default function Navbar({ transparent = false }) {
    const location = useLocation();
    const navigate = useNavigate();
    const cartCount = useCartStore((state) => state.getCartCount());
    const isHome = location.pathname === '/';
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
            setShowSearch(false);
            setSearchQuery('');
        }
    };

    return (
        <>
            <nav className={`${transparent && isHome ? 'absolute top-0 left-0 w-full z-50 text-white' : 'sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100/50'} p-4 flex items-center justify-between transition-all duration-300`}>
                {/* Logo + Text on Left */}
                <Link to="/" className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
                    <img src="/mha.png" alt="MH Collections" className="h-12 md:h-14 w-auto" />
                    <span className="text-xl md:text-2xl font-black tracking-tight text-primary">MH Collection</span>
                </Link>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className={`flex size-10 items-center justify-center rounded-full ${transparent && isHome ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}
                    >
                        <span className="material-symbols-outlined text-2xl">search</span>
                    </button>
                    <Link to="/checkout" className={`flex size-10 items-center justify-center rounded-full ${transparent && isHome ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors relative`}>
                        <span className="material-symbols-outlined text-2xl">shopping_bag</span>
                        {cartCount > 0 && (
                            <span className="absolute top-1 right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                </div>
            </nav>

            {/* Search Bar Dropdown */}
            {showSearch && (
                <div className="fixed top-[88px] left-0 w-full bg-white z-40 p-4 shadow-md animate-in slide-in-from-top-2">
                    <form onSubmit={handleSearch} className="max-w-3xl mx-auto flex gap-2">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="h-12 px-6 bg-primary text-white font-bold rounded-lg hover:bg-black/90 transition-colors"
                        >
                            Search
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowSearch(false)}
                            className="h-12 w-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}

import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
    const location = useLocation();
    const path = location.pathname;

    const navItems = [
        { to: '/', icon: 'home', label: 'Home' },
        { to: '/shop', icon: 'grid_view', label: 'Shop' },
        { to: '/wishlist', icon: 'favorite', label: 'Wishlist' },
        { to: '/account', icon: 'person', label: 'Account' },
    ];

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-zinc-800 pb-safe pt-2 z-40">
            <div className="flex justify-around items-end px-2 pb-3">
                {navItems.map((item) => {
                    const isActive = path === item.to || (item.to === '/' && path === '/');
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`flex flex-col items-center gap-1 min-w-[64px] ${isActive ? 'text-primary' : 'text-gray-400 hover:text-primary'} transition-colors`}
                        >
                            <span
                                className={`material-symbols-outlined text-2xl ${isActive ? 'filled' : ''}`}
                                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                            >
                                {item.icon}
                            </span>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

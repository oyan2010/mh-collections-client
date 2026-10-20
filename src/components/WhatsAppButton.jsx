import { useLocation } from 'react-router-dom';

export default function WhatsAppButton() {
    const location = useLocation();

    const getPageName = () => {
        const path = location.pathname;
        if (path === '/') return 'Home';
        if (path.includes('product')) return 'Product Details';
        if (path.includes('checkout')) return 'Checkout';
        if (path.includes('shop')) return 'Shop';
        if (path.includes('tracking')) return 'Tracking';
        return 'General';
    };

    const message = `Hello! I need help in ${getPageName()} section.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/923121714534?text=${encodedMessage}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-24 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-110 transition-transform duration-300 group"
            aria-label="Contact Support"
        >
            <span className="material-symbols-outlined text-[32px]">chat</span>
            <span className="absolute right-full mr-3 bg-white text-black px-3 py-1 rounded text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-sm">
                Need Help?
            </span>
        </a>
    );
}

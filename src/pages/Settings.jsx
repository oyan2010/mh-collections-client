import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import toast from 'react-hot-toast';

export default function Settings() {
    const navigate = useNavigate();
    const { logout } = useAuthStore();

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display pb-20">
            <Navbar />
            <div className="max-w-md mx-auto p-4">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold">Settings</h1>
                </div>

                <div className="space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-gray-500">notifications</span>
                                <span className="font-medium">Notifications</span>
                            </div>
                            <div className="relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer translate-x-6" />
                                <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-primary cursor-pointer"></label>
                            </div>
                        </div>
                        <div className="p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-gray-500">dark_mode</span>
                                <span className="font-medium">Dark Mode</span>
                            </div>
                            <span className="text-xs text-gray-400">System Default</span>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-red-500 font-bold flex items-center justify-between"
                    >
                        <span>Sign Out</span>
                        <span className="material-symbols-outlined">logout</span>
                    </button>

                    <div className="text-center pt-8">
                        <p className="text-xs text-gray-400">MH Collections v1.0.0</p>
                    </div>
                </div>
            </div>
            <BottomNav />
        </div>
    );
}

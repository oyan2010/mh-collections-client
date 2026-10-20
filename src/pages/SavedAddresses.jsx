import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';

export default function SavedAddresses() {
    const navigate = useNavigate();
    const { userData } = useAuthStore();

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display pb-20">
            <Navbar />
            <div className="max-w-md mx-auto p-4">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold">Saved Addresses</h1>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    {userData?.address ? (
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary mt-1">location_on</span>
                            <div>
                                <p className="font-bold text-gray-900">Home</p>
                                <p className="text-gray-600 mt-1">{userData.address}</p>
                                <p className="text-sm text-gray-500 mt-2">{userData.phone}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">no_meeting_room</span>
                            <p className="text-gray-500">No saved addresses found.</p>
                            <p className="text-xs text-gray-400 mt-1">Addresses are saved automatically when you place an order.</p>
                        </div>
                    )}
                </div>
            </div>
            <BottomNav />
        </div>
    );
}

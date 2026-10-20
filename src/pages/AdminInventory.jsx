import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, setDoc, query, orderBy, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const IMGBB_API_KEY = 'fa4b108fcccbf1cb9e69b64ae7e7212e';

function ContentEditor() {
    const [heroContent, setHeroContent] = useState({
        label: 'Fall/Winter 2024',
        title: 'THE NEW\nERA OF\nBLACK.'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Real-time listener
        const unsub = onSnapshot(doc(db, 'siteContent', 'homepage'), (docSnap) => {
            if (docSnap.exists()) {
                setHeroContent(docSnap.data());
            }
        });
        return () => unsub();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await setDoc(doc(db, 'siteContent', 'homepage'), heroContent);
            alert('Content updated successfully!');
        } catch (err) {
            console.error('Error saving content:', err);
            alert('Failed to save content: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold mb-4">Homepage Hero Section</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Top Label (Season)</label>
                        <input
                            type="text"
                            value={heroContent.label}
                            onChange={e => setHeroContent({ ...heroContent, label: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Main Title</label>
                        <textarea
                            rows={4}
                            value={heroContent.title}
                            onChange={e => setHeroContent({ ...heroContent, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg font-mono"
                            placeholder="Use enter for new lines"
                        />
                        <p className="text-xs text-gray-400 mt-1">Shows as big bold text. Line breaks are preserved.</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminInventory() {
    const navigate = useNavigate();
    const { isAdmin, loading: authLoading } = useAuthStore();

    // Dashboard State
    const [activeTab, setActiveTab] = useState('dashboard');

    // Data State
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Selection State
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfig, setDeleteConfig] = useState(null); // { type: 'single-product'|'bulk-products'|..., id?: string }

    // Product Management State
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);

    const initialProductState = {
        title: '', price: '', category: '', description: '', stock: '',
        sizes: ['S', 'M', 'L', 'XL'], imageFile: null, imageUrl: '',
        hasSizes: true, isVisible: true
    };
    const [newProduct, setNewProduct] = useState(initialProductState);

    // Category Management State
    const [newCategory, setNewCategory] = useState('');

    // Order Management State
    const [statusUpdateLoading, setStatusUpdateLoading] = useState(null);

    // Auth Protection
    useEffect(() => {
        if (!authLoading && !isAdmin) {
            navigate('/login');
        }
    }, [isAdmin, authLoading, navigate]);

    // Real-time Listeners
    useEffect(() => {
        if (!isAdmin) return;
        setLoading(true);

        const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
            const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCategories(cats);
        });

        const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const unsubOrders = onSnapshot(qOrders, (snapshot) => {
            setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        setLoading(false);
        return () => {
            unsubProducts();
            unsubCategories();
            unsubOrders();
        };
    }, [isAdmin]);

    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const totalProducts = products.length;

    const orderStats = [
        { name: 'Placed', value: orders.filter(o => o.status === 'Placed').length },
        { name: 'Processing', value: orders.filter(o => o.status === 'Processing').length },
        { name: 'Shipped', value: orders.filter(o => o.status === 'Shipped').length },
        { name: 'Delivered', value: orders.filter(o => o.status === 'Delivered').length },
    ];

    // --- Image Upload ---
    const uploadToImgBB = async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        try {
            setUploading(true);
            setUploadProgress(30);
            const response = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData, {
                onUploadProgress: (ev) => setUploadProgress(Math.round((ev.loaded * 100) / ev.total))
            });
            return response.data.data.url;
        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        } finally {
            setUploading(false);
        }
    };

    // --- Selection Logic ---
    const handleSelectAllProducts = (e) => {
        if (e.target.checked) {
            const visible = products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
            setSelectedProducts(visible.map(p => p.id));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelectProduct = (id) => {
        if (selectedProducts.includes(id)) {
            setSelectedProducts(selectedProducts.filter(pId => pId !== id));
        } else {
            setSelectedProducts([...selectedProducts, id]);
        }
    };

    const handleSelectAllCategories = (e) => {
        if (e.target.checked) {
            setSelectedCategories(categories.map(c => c.id));
        } else {
            setSelectedCategories([]);
        }
    };

    const handleSelectCategory = (id) => {
        if (selectedCategories.includes(id)) {
            setSelectedCategories(selectedCategories.filter(cId => cId !== id));
        } else {
            setSelectedCategories([...selectedCategories, id]);
        }
    };

    // --- Product Actions ---
    const handleAddProduct = async () => {
        if (!newProduct.title || !newProduct.price || !newProduct.category || (!newProduct.imageFile && !newProduct.imageUrl)) {
            alert('Fill all required fields (Title, Price, Category, Image)');
            return;
        }
        try {
            setUploading(true);
            let imageUrl = newProduct.imageUrl;
            if (newProduct.imageFile) {
                imageUrl = await uploadToImgBB(newProduct.imageFile);
            }

            await addDoc(collection(db, 'products'), {
                title: newProduct.title,
                price: parseFloat(newProduct.price),
                category: newProduct.category,
                description: newProduct.description,
                stock: parseInt(newProduct.stock) || 0,
                sizes: newProduct.sizes,
                imageUrl,
                hasSizes: newProduct.hasSizes !== false,
                isVisible: newProduct.isVisible !== false,
                createdAt: new Date()
            });
            setShowAddProductModal(false);
            setNewProduct(initialProductState);
            alert('Product added successfully!');
        } catch (err) {
            console.error('Add Product Error:', err);
            alert('Failed to add product: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProduct = async () => {
        if (!editingProduct) return;

        try {
            setUploading(true);
            let imageUrl = editingProduct.imageUrl;
            if (editingProduct.imageFile) {
                imageUrl = await uploadToImgBB(editingProduct.imageFile);
            }

            const updatedData = {
                title: editingProduct.title,
                price: parseFloat(editingProduct.price),
                category: editingProduct.category,
                description: editingProduct.description,
                stock: parseInt(editingProduct.stock) || 0,
                hasSizes: editingProduct.hasSizes !== false,
                isVisible: editingProduct.isVisible !== false,
                imageUrl
            };

            await updateDoc(doc(db, 'products', editingProduct.id), updatedData);
            setEditingProduct(null);
            alert('Product updated successfully!');
        } catch (err) {
            console.error('Update Product Error:', err);
            alert('Failed to update product: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    // --- Delete Logic ---
    const confirmDelete = (type, id = null) => {
        setDeleteConfig({ type, id });
        setShowDeleteConfirm(true);
    };

    const executeDelete = async () => {
        if (!deleteConfig) return;
        const { type, id } = deleteConfig;
        setShowDeleteConfirm(false);

        try {
            const batch = writeBatch(db);

            if (type === 'bulk-products') {
                selectedProducts.forEach(pid => batch.delete(doc(db, 'products', pid)));
                await batch.commit();
                setSelectedProducts([]);
                alert(`Successfully deleted ${selectedProducts.length} products.`);
            }
            else if (type === 'single-product') {
                await deleteDoc(doc(db, 'products', id));
                alert('Product deleted successfully');
            }
            else if (type === 'bulk-categories') {
                selectedCategories.forEach(cid => batch.delete(doc(db, 'categories', cid)));
                await batch.commit();
                setSelectedCategories([]);
                alert(`Successfully deleted ${selectedCategories.length} categories.`);
            }
            else if (type === 'single-category') {
                await deleteDoc(doc(db, 'categories', id));
                alert('Category deleted successfully');
            }
        } catch (err) {
            console.error('Delete Error:', err);
            alert('Failed to delete: ' + err.message);
        } finally {
            setDeleteConfig(null);
        }
    };

    // --- Category Actions ---
    const handleAddCategory = async () => {
        if (!newCategory.trim()) return;
        try {
            await addDoc(collection(db, 'categories'), { name: newCategory.trim() });
            setNewCategory('');
            alert('Category added');
        } catch (err) {
            console.error('Add Category Error:', err);
            alert('Failed to add category: ' + err.message);
        }
    };

    // --- Order Actions ---
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        setStatusUpdateLoading(orderId);
        try {
            await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
            alert(`Order status updated to ${newStatus}`);
        } catch (err) {
            console.error('Update Status Error:', err);
            alert('Failed to update status: ' + err.message);
        } finally {
            setStatusUpdateLoading(null);
        }
    };

    if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

    const filteredProducts = products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

    // Helper for rendering form fields
    const ProductForm = ({ data, setData, onSubmit, isEditing }) => (
        <div className="space-y-4">
            <input
                type="text" placeholder="Title"
                value={data.title} onChange={e => setData({ ...data, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg"
            />
            <div className="flex gap-4">
                <input
                    type="number" placeholder="Price"
                    value={data.price} onChange={e => setData({ ...data, price: e.target.value })}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg"
                />
                <input
                    type="number" placeholder="Stock"
                    value={data.stock} onChange={e => setData({ ...data, stock: e.target.value })}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg"
                />
            </div>
            <select
                value={data.category}
                onChange={e => setData({ ...data, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
            >
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <textarea
                placeholder="Description" rows={3}
                value={data.description} onChange={e => setData({ ...data, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg"
            />

            {/* Options */}
            <div className="flex gap-6 p-2">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.hasSizes !== false}
                        onChange={e => setData({ ...data, hasSizes: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">Size Selection</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.isVisible !== false}
                        onChange={e => setData({ ...data, isVisible: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">Visible in Store</span>
                </label>
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer relative">
                <input
                    type="file" accept="image/*"
                    onChange={e => setData({ ...data, imageFile: e.target.files[0] })}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">cloud_upload</span>
                <p className="text-sm font-medium text-gray-600">
                    {data.imageFile ? data.imageFile.name : (isEditing ? 'Click to change image' : 'Click to upload image')}
                </p>
                {isEditing && data.imageUrl && !data.imageFile && (
                    <img src={data.imageUrl} alt="Current" className="h-12 w-auto mx-auto mt-2 rounded" />
                )}
            </div>
            {uploading && (
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
            )}
            <div className="flex gap-3 pt-4">
                <button onClick={() => isEditing ? setEditingProduct(null) : setShowAddProductModal(false)} className="flex-1 py-3 border border-gray-200 rounded-lg font-bold">Cancel</button>
                <button onClick={onSubmit} disabled={uploading} className="flex-1 py-3 bg-primary text-white rounded-lg font-bold disabled:opacity-50">
                    {uploading ? 'Uploading...' : (isEditing ? 'Update Product' : 'Save Product')}
                </button>
            </div>
        </div>
    );

    return (
        <div className="bg-background-light min-h-screen font-display text-primary flex flex-col">
            {/* Header */}
            <header className="bg-white sticky top-0 z-30 border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="hover:bg-gray-100 p-2 rounded-full transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-black tracking-tight uppercase">Admin Dashboard</h1>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    {['dashboard', 'products', 'categories', 'orders', 'content'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wide transition-all ${activeTab === tab ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-primary'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            <main className="flex-1 max-w-6xl mx-auto w-full p-6">

                {/* --- CONTENT TAB --- */}
                {activeTab === 'content' && (
                    <ContentEditor />
                )}

                {/* --- DASHBOARD TAB --- */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-gray-500 font-bold uppercase text-xs tracking-wider">Total Revenue</p>
                                <p className="text-4xl font-black mt-2 text-green-600">${totalRevenue.toFixed(2)}</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-gray-500 font-bold uppercase text-xs tracking-wider">Total Orders</p>
                                <p className="text-4xl font-black mt-2">{totalOrders}</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-gray-500 font-bold uppercase text-xs tracking-wider">Total Products</p>
                                <p className="text-4xl font-black mt-2">{totalProducts}</p>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[400px]">
                                <h3 className="font-bold text-lg mb-4">Order Status Overview</h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={orderStats}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#000000" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[400px] flex items-center justify-center text-gray-400">
                                <p>Additional Analytics Coming Soon</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PRODUCTS TAB --- */}
                {activeTab === 'products' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center">
                            <div className="relative w-full max-w-sm">
                                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">search</span>
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                {selectedProducts.length > 0 && (
                                    <button
                                        onClick={() => confirmDelete('bulk-products')}
                                        className="bg-red-50 text-red-600 px-4 py-2.5 rounded-lg font-bold uppercase text-sm tracking-wide hover:bg-red-100 transition-colors flex items-center gap-2 animate-in fade-in"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span> Delete ({selectedProducts.length})
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowAddProductModal(true)}
                                    className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold uppercase text-sm tracking-wide hover:opacity-90 transition-opacity flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[20px]">add</span> Add Product
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                                                onChange={handleSelectAllProducts}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-xs font-bold uppercase text-gray-400">Product</th>
                                        <th className="px-6 py-3 text-xs font-bold uppercase text-gray-400">Category</th>
                                        <th className="px-6 py-3 text-xs font-bold uppercase text-gray-400">Price</th>
                                        <th className="px-6 py-3 text-xs font-bold uppercase text-gray-400">Status</th>
                                        <th className="px-6 py-3 text-xs font-bold uppercase text-gray-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredProducts.map(product => (
                                        <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${selectedProducts.includes(product.id) ? 'bg-gray-50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProducts.includes(product.id)}
                                                    onChange={() => handleSelectProduct(product.id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                            </td>
                                            <td className="px-6 py-4 flex items-center gap-4">
                                                <img src={product.imageUrl} alt={product.title} className="w-10 h-10 rounded object-cover bg-gray-100" />
                                                <div>
                                                    <span className="font-medium block">{product.title}</span>
                                                    {!product.isVisible && <span className="text-[10px] bg-gray-200 px-1 rounded">Hidden</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                                            <td className="px-6 py-4 text-sm font-medium">${product.price}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => setEditingProduct(product)} className="text-gray-400 hover:text-primary mr-3">
                                                    <span className="material-symbols-outlined">edit</span>
                                                </button>
                                                <button onClick={() => confirmDelete('single-product', product.id)} className="text-gray-400 hover:text-red-600">
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- CATEGORIES TAB --- */}
                {activeTab === 'categories' && (
                    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex gap-4 flex-1">
                                <input
                                    type="text"
                                    placeholder="New Category Name"
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value)}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg max-w-sm"
                                />
                                <button
                                    onClick={handleAddCategory}
                                    className="bg-primary text-white px-6 rounded-lg font-bold uppercase text-sm"
                                >
                                    Add
                                </button>
                            </div>
                            {selectedCategories.length > 0 && (
                                <button
                                    onClick={() => confirmDelete('bulk-categories')}
                                    className="bg-red-50 text-red-600 px-4 py-2.5 rounded-lg font-bold uppercase text-sm tracking-wide hover:bg-red-100 transition-colors flex items-center gap-2 animate-in fade-in"
                                >
                                    <span className="material-symbols-outlined text-[20px]">delete</span> Delete ({selectedCategories.length})
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-t-xl border-x border-t border-gray-200">
                            <input
                                type="checkbox"
                                checked={categories.length > 0 && selectedCategories.length === categories.length}
                                onChange={handleSelectAllCategories}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-xs font-bold uppercase text-gray-400">Select All Categories</span>
                        </div>

                        <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
                            {categories.map(cat => (
                                <div key={cat.id} className={`p-4 flex justify-between items-center group hover:bg-gray-50 ${selectedCategories.includes(cat.id) ? 'bg-gray-50' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(cat.id)}
                                            onChange={() => handleSelectCategory(cat.id)}
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span className="font-medium">{cat.name}</span>
                                    </div>
                                    <button onClick={() => confirmDelete('single-category', cat.id)} className="text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            ))}
                            {categories.length === 0 && <p className="p-4 text-gray-400 text-center text-sm">No categories yet.</p>}
                        </div>
                    </div>
                )}

                {/* --- ORDERS TAB --- */}
                {activeTab === 'orders' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {orders.map(order => (
                            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-4">
                                    {/* Order Content */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-lg">Order #{order.orderId}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400 font-mono">
                                            {order.createdAt?.toDate().toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase font-bold mb-1">Customer</p>
                                            <p className="font-medium">{order.customer.name}</p>
                                            <p className="text-gray-500">{order.customer.phone}</p>
                                            <p className="text-gray-500">{order.customer.address}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase font-bold mb-1">Payment</p>
                                            <p className="font-medium">{order.paymentMethod}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        {order.cartItems.map((item, i) => (
                                            <div key={i} className="relative group/item">
                                                <img src={item.imageUrl} alt={item.title} className="w-12 h-12 rounded border border-gray-100 object-cover" />
                                                <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white font-bold">
                                                    {item.quantity}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 justify-center min-w-[200px] border-l border-gray-100 pl-6 border-t md:border-t-0 pt-4 md:pt-0">
                                    <div className="text-right mb-4">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Total Amount</p>
                                        <p className="font-black text-2xl">${order.totalAmount.toFixed(2)}</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {['Processing', 'Shipped', 'Delivered'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => handleUpdateOrderStatus(order.id, status)}
                                                disabled={order.status === status || statusUpdateLoading === order.id}
                                                className={`text-xs px-3 py-2.5 rounded-lg font-bold uppercase transition-all text-left flex justify-between items-center ${order.status === status
                                                    ? 'bg-primary text-white cursor-default shadow-md'
                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                Mark as {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* --- ADD PRODUCT MODAL --- */}
            {showAddProductModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Add New Product</h2>
                        <ProductForm
                            data={newProduct}
                            setData={setNewProduct}
                            onSubmit={handleAddProduct}
                            isEditing={false}
                        />
                    </div>
                </div>
            )}

            {/* --- EDIT PRODUCT MODAL --- */}
            {editingProduct && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Edit Product</h2>
                        <ProductForm
                            data={editingProduct}
                            setData={setEditingProduct}
                            onSubmit={handleUpdateProduct}
                            isEditing={true}
                        />
                    </div>
                </div>
            )}

            {/* --- DELETE CONFIRMATION MODAL --- */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-3xl text-red-600">warning</span>
                            </div>
                            <h3 className="font-bold text-xl mb-2">Delete Confirmation</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {deleteConfig && (deleteConfig.type === 'bulk-products'
                                    ? `Are you sure you want to delete ${selectedProducts.length} selected products?`
                                    : deleteConfig.type === 'bulk-categories'
                                        ? `Are you sure you want to delete ${selectedCategories.length} selected categories?`
                                        : deleteConfig.type === 'single-category'
                                            ? 'Are you sure you want to delete this category?'
                                            : 'Are you sure you want to delete this product?')}
                                <br />
                                <span className="font-bold text-red-500 mt-2 block">This action is irreversible and will permanently remove the data from your inventory.</span>
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeDelete}
                                className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                            >
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

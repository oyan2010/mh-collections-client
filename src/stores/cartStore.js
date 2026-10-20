import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],

            addToCart: (product, size = 'M', quantity = 1) => {
                const items = get().items;
                const existingIndex = items.findIndex(
                    item => item.id === product.id && item.size === size
                );

                if (existingIndex >= 0) {
                    const newItems = [...items];
                    newItems[existingIndex].quantity += quantity;
                    set({ items: newItems });
                } else {
                    set({
                        items: [...items, {
                            id: product.id,
                            title: product.title,
                            price: product.price,
                            imageUrl: product.imageUrl,
                            size,
                            quantity
                        }]
                    });
                }
            },

            removeFromCart: (productId, size) => {
                set({
                    items: get().items.filter(
                        item => !(item.id === productId && item.size === size)
                    )
                });
            },

            updateQuantity: (productId, size, quantity) => {
                const items = get().items.map(item => {
                    if (item.id === productId && item.size === size) {
                        return { ...item, quantity };
                    }
                    return item;
                });
                set({ items });
            },

            clearCart: () => set({ items: [] }),

            getCartCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

            getCartTotal: () => get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        }),
        {
            name: 'mh-cart-storage',
        }
    )
);

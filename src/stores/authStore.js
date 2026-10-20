import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            isAdmin: false,
            loading: true,
            userData: null,

            signup: async (email, password, displayName) => {
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    const user = userCredential.user;

                    // Create user document in Firestore
                    await setDoc(doc(db, 'users', user.uid), {
                        uid: user.uid,
                        email: user.email,
                        displayName: displayName || '',
                        createdAt: new Date().toISOString(),
                    });

                    set({
                        user: { uid: user.uid, email: user.email, displayName: displayName || '' },
                        isAdmin: false,
                        userData: { displayName: displayName || '' },
                        loading: false
                    });

                    return { success: true };
                } catch (error) {
                    console.error('Signup error:', error);
                    return { success: false, error: error.message };
                }
            },

            login: async (email, password) => {
                try {
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    const user = userCredential.user;

                    // Get ID token to check custom claims
                    const tokenResult = await user.getIdTokenResult();
                    const isAdmin = tokenResult.claims.isAdmin || false;

                    // Get user data from Firestore
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    const userData = userDoc.exists() ? userDoc.data() : null;

                    set({
                        user: { uid: user.uid, email: user.email },
                        isAdmin,
                        userData,
                        loading: false
                    });

                    return { success: true, isAdmin };
                } catch (error) {
                    console.error('Login error:', error);
                    return { success: false, error: error.message };
                }
            },

            logout: async () => {
                await signOut(auth);
                set({ user: null, isAdmin: false, userData: null, loading: false });
            },

            updateUserData: async (data) => {
                const user = get().user;
                if (!user) return;

                await setDoc(doc(db, 'users', user.uid), {
                    ...get().userData,
                    ...data,
                    uid: user.uid,
                    email: user.email
                }, { merge: true });

                set({ userData: { ...get().userData, ...data } });
            },

            initAuth: () => {
                onAuthStateChanged(auth, async (user) => {
                    if (user) {
                        const tokenResult = await user.getIdTokenResult();
                        const isAdmin = tokenResult.claims.isAdmin || false;
                        const userDoc = await getDoc(doc(db, 'users', user.uid));
                        const userData = userDoc.exists() ? userDoc.data() : null;

                        set({
                            user: { uid: user.uid, email: user.email },
                            isAdmin,
                            userData,
                            loading: false
                        });
                    } else {
                        set({ user: null, isAdmin: false, userData: null, loading: false });
                    }
                });
            },
        }),
        {
            name: 'mh-auth-storage',
            partialize: (state) => ({ user: state.user, isAdmin: state.isAdmin }),
        }
    )
);

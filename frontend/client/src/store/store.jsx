import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.jsx';
import cartReducer from './slices/cartSlice.jsx';
import wishlistReducer from './slices/wishlistSlice.jsx';
import uiReducer from './slices/uiSlice.jsx';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

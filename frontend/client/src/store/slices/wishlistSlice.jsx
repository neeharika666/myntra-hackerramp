import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { wishlistAPI } from '../../services/api';

const initialState = {
  wishlist: {
    items: [],
    totalItems: 0
  },
  loading: false,
  error: null,
};

// Async thunks
export const getWishlist = createAsyncThunk(
  'wishlist/getWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await wishlistAPI.getWishlist();
      return response.data.wishlist;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get wishlist');
    }
  }
);

export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await wishlistAPI.addToWishlist(productId);
      return response.data.wishlist;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to wishlist');
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await wishlistAPI.removeFromWishlist(productId);
      return response.data.wishlist;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from wishlist');
    }
  }
);

export const clearWishlist = createAsyncThunk(
  'wishlist/clearWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await wishlistAPI.clearWishlist();
      return response.data.wishlist;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear wishlist');
    }
  }
);

export const checkWishlistItem = createAsyncThunk(
  'wishlist/checkWishlistItem',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await wishlistAPI.checkWishlistItem(productId);
      return { productId, inWishlist: response.data.inWishlist };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check wishlist');
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setWishlist: (state, action) => {
      state.wishlist = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get wishlist
      .addCase(getWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.wishlist = action.payload;
        state.error = null;
      })
      .addCase(getWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add to wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.wishlist = action.payload;
        state.error = null;
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove from wishlist
      .addCase(removeFromWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.wishlist = action.payload;
        state.error = null;
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Clear wishlist
      .addCase(clearWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.wishlist = action.payload;
        state.error = null;
      })
      .addCase(clearWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Check wishlist item (does not update state directly)
      .addCase(checkWishlistItem.fulfilled, (state, action) => {
        // You can handle this in components; state remains unchanged
      });
  },
});

export const { clearError, setWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;

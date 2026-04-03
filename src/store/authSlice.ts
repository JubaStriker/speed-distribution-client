import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types';
import { authApi, getToken, saveToken, clearToken } from '../api';

// ─── State ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isInitializing: boolean;
  restockCount: number;
}

const initialState: AuthState = {
  user: null,
  isInitializing: true,
  restockCount: 0,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const initializeAuth = createAsyncThunk('auth/initialize', async (_, { rejectWithValue }) => {
  const token = getToken();
  if (!token) return null;
  try {
    return await authApi.me();
  } catch {
    clearToken();
    return rejectWithValue(null);
  }
});

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const { token, user } = await authApi.login(email, password);
    saveToken(token);
    return user;
  }
);

export const signupThunk = createAsyncThunk(
  'auth/signup',
  async ({ firstName, lastName, email, password }: { firstName: string; lastName: string; email: string; password: string }) => {
    const { token, user } = await authApi.signup(firstName, lastName, email, password);
    if (token) saveToken(token);
    return user;
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isInitializing = false;
    },
    logout(state) {
      clearToken();
      state.user = null;
      state.isInitializing = false;
      state.restockCount = 0;
    },
    setRestockCount(state, action: PayloadAction<number>) {
      state.restockCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isInitializing = false;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.user = null;
        state.isInitializing = false;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(signupThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { setUser, logout, setRestockCount } = authSlice.actions;
export default authSlice.reducer;

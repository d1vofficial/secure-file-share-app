import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { AuthState, MFADisableRequest, MFAVerifyRequest } from '../../types/index';

const API_URL = import.meta.env.VITE_API_URL;

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { username: string; email: string; password: string; password2: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register/`, userData);
      return response.data;
    } catch (error: any) {
      console.error('API error:', error.response?.data); // Debugging log

      // Return backend error message (if available) to Redux
      return rejectWithValue(error.response?.data || { error: 'Registration failed' });
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string }) => {
    const response = await axios.post(`${API_URL}/auth/login/`, credentials);
    return response.data;
  }
);

export const enableMFA = createAsyncThunk(
  'auth/enableMFA',
  async (_, { getState }: any) => {
    const { auth } = getState();
    const response = await axios.post(
      `${API_URL}/auth/mfa/enable/`,
      {},
      {
        headers: { Authorization: `Bearer ${auth.token}` },
      }
    );
    return response.data;
  }
);

export const disableMFA = createAsyncThunk(
  'auth/disableMFA',
  async ({ user_id }: MFADisableRequest, { getState }: any) => {
    const { auth } = getState();
    const response = await axios.post(
      `${API_URL}/auth/mfa/disable/`,
      { user_id },
      {
        headers: { Authorization: `Bearer ${auth.token}` },
      }
    );
    return response.data;
  }
);

export const verifyMFA = createAsyncThunk(
  'auth/verifyMFA',
  async ({ user_id, code }: MFAVerifyRequest) => {
    const response = await axios.post(`${API_URL}/auth/mfa/verify/`, { user_id, code });
    return response.data;
  }
);

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  mfaRequired: false,
  mfaSetupData: null,
  pendingMfaUserId: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.mfaRequired = false;
      state.mfaSetupData = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.require_mfa!=null && action.payload.require_mfa) {
          state.mfaRequired = true;
          state.pendingMfaUserId = action.payload.user_id;
          state.isAuthenticated = false;
        } 
        else{
          state.user = action.payload.user;
          state.token = action.payload.tokens.access;
          state.isAuthenticated = true; 
          state.mfaRequired = false;
          state.pendingMfaUserId = null;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(enableMFA.fulfilled, (state, action) => {
        state.mfaSetupData = {
          qr_code: action.payload.qr_code,
          secret: action.payload.secret,
        };
      })
      .addCase(verifyMFA.fulfilled, (state, action) => {
        state.mfaRequired = false;
        state.mfaSetupData = null;
        state.user = action.payload.user;
        state.token = action.payload.tokens.access;
        state.isAuthenticated = true;
        state.pendingMfaUserId = null;
      })
      .addCase(disableMFA.fulfilled, (state, action) => {
        state.mfaRequired = false;
        state.mfaSetupData = null;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.pendingMfaUserId = null;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import fileReducer from './slices/fileSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    files: fileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
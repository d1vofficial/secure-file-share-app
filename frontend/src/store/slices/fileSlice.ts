import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { File, ShareLink } from '../../types';

const API_URL = import.meta.env.VITE_API_URL;

// These configurations are enough
// axios.defaults.xsrfCookieName = 'csrftoken';
// axios.defaults.xsrfHeaderName = 'X-CSRFToken';
// axios.defaults.withCredentials = true;

// export const getCSRFToken = (): string | null => {
//   const match = document.cookie.match(/csrftoken=([^;]+)/);
//   return match ? match[1] : null;
// };

// axios.defaults.headers.common['X-CSRFToken'] = getCSRFToken();

export const uploadFile = createAsyncThunk(
  'files/upload',
  async (file: globalThis.File, { getState }: any) => {
    const { auth } = getState();
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Token being used:', auth.token); // Debug log
      const response = await axios.post(`${API_URL}/files/files/upload/`, formData, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Upload response:', response.data);
      return response.data;
    } catch (error) {
      // console.error('Upload error details:', error.response?.data || error.message);
      throw error;
    }
  }
);

// export const uploadFile = createAsyncThunk(
//   'files/upload',
//   async (file: globalThis.File, { getState }: any) => {
//     const { auth } = getState();
//     const formData = new FormData();
//     formData.append('file', file);

//     // Get the CSRF token
//     const csrfToken = getCSRFToken();

//     if (!csrfToken) {
//       throw new Error('CSRF token not found');
//     }

//     const response = await axios.post(`${API_URL}/files/upload/`, formData, {
//       headers: {
//         Authorization: `Bearer ${auth.token}`,
//         'X-CSRFToken': csrfToken, // Include the CSRF token
//         'Content-Type': 'multipart/form-data',
//       },
//       withCredentials: true, // Include cookies
//     });
//     return response.data;
//   }
// );

export const listFiles = createAsyncThunk(
  'files/list',
  async (_, { getState }: any) => {
    const { auth } = getState();
    const response = await axios.get(`${API_URL}/files/files/`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    return response.data;
  }
);

export const shareFile = createAsyncThunk(
  'files/share',
  async (
    {
      fileId,
      userId,
      permission,
      expiresAt,
    }: {
      fileId: string;
      userId: number;
      permission: string;
      expiresAt: string;
    },
    { getState }: any
  ) => {
    const { auth } = getState();
    const response = await axios.post(
      `${API_URL}/files/files/${fileId}/share/`,
      {
        file: fileId,
        shared_with: userId,
        permission,
        expires_at: expiresAt,
      },
      {
        headers: { Authorization: `Bearer ${auth.token}` },
      }
    );
    return response.data;
  }
);

export const generateShareableLink = createAsyncThunk(
  'files/generateLink',
  async (
    {
      fileId,
      expiresAt,
      oneTimeUse,
    }: {
      fileId: string;
      expiresAt: string;
      oneTimeUse: boolean;
    },
    { getState }: any
  ) => {
    const { auth } = getState();
    const response = await axios.post(
      `${API_URL}/files/files/${fileId}/generate-link/`,
      {
        expires_at: expiresAt,
        one_time_use: oneTimeUse,
      },
      {
        headers: { Authorization: `Bearer ${auth.token}` },
      }
    );
    return response.data;
  }
);

interface FileState {
  files: File[];
  sharedFiles: File[];
  shareLinks: ShareLink[];
  loading: boolean;
  error: string | null;
}

const initialState: FileState = {
  files: [],
  sharedFiles: [],
  shareLinks: [],
  loading: false,
  error: null,
};

const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    clearFileError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.loading = false;
        state.files.push(action.payload);
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Upload failed';
      })
      .addCase(listFiles.fulfilled, (state, action) => {
        state.files = action.payload;
      })
      .addCase(generateShareableLink.fulfilled, (state, action) => {
        state.shareLinks.push(action.payload);
      });
  },
});

export const { clearFileError } = fileSlice.actions;
export default fileSlice.reducer;
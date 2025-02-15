export interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  mfaRequired: boolean;
  mfaSetupData: { qrCode: string; secret: string } | null;
  pendingMfaUserId: number | null;
}

export interface File {
  id: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
  file_size: number;
  owner?: number;
  permission?: 'VIEW' | 'DOWNLOAD';
}

export interface ShareLink {
  id: string;
  file: string;
  url: string;
  expires_at: string;
  one_time_use: boolean;
} 
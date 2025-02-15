export interface User {
  id: number;
  username: string;
  email: string;
  mfa_enabled: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  mfaRequired: boolean;
  mfaSetupData: {
    qr_code: string;
    secret: string;
  } | null;
  pendingMfaUserId: number | null;
}

export interface File {
  id: string;
  name: string;
  size: number;
  uploaded_at: string;
  owner: number;
}

export interface ShareLink {
  id: string;
  file: string;
  url: string;
  expires_at: string;
  one_time_use: boolean;
}

export interface MFAVerifyRequest {
  user_id: number;
  code: string;
}

export interface MFADisableRequest {
  user_id: number;
}
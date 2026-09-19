export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  shopId?: string;
  createdAt: string;
}

export interface Session {
  user: User;
  token?: string;
  expiresAt?: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// src/lib/redux/api/authApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { setUser, logout as logoutAction } from '../slices/authSlice';
import type { SafeUser, Role } from '@/types/index';
import { baseQueryWithCredentials } from './entityApi/config';
import { getServerSession } from '@/lib/auth-utils';

// --- Response Types ---
export interface AuthResponse {
  status: 'success' | 'requires-2fa';
  message: string;
  user?: SafeUser;
  tempToken?: string;
}

export interface SocialAuthResponse {
    user: SafeUser;
    isNewUser: boolean;
}

export interface LogoutResponse {
    message: string;
}

export interface SessionResponse {
  user: SafeUser | null; 
}

// --- Request Types ---
export interface LoginRequest {
  idToken: string;
}

export interface RegisterRequest {
  idToken: string;
  role: Role;
  name: string;
}

export interface SocialLoginRequest {
    idToken: string;
}

export interface Verify2FARequest {
    tempToken: string;
    code: string;
}


// --- API Definition ---

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithCredentials, // Use the centralized baseQuery
  tagTypes: ['Session'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: 'api/auth/login', // Paths are now relative to the baseUrl in baseQuery
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Session'],
      // The onQueryStarted for login will now handle setting the user state
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        console.log('📡 [AuthAPI] onQueryStarted pour login. En attente de la réponse...');
        try {
          const { data } = await queryFulfilled;
          if (data.user) {
            console.log('✅ [AuthAPI] Connexion réussie. Dispatch de setUser:', data.user);
            dispatch(setUser(data.user));
          }
        } catch (error) {
          console.error('❌ [AuthAPI] Échec de la mutation de connexion.', JSON.stringify(error));
        }
      },
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userInfo) => ({
        url: 'api/auth/register',
        method: 'POST',
        body: userInfo,
      }),
    }),
    socialLogin: builder.mutation<SocialAuthResponse, SocialLoginRequest>({
        query: (credentials) => ({
            url: 'api/auth/social-login',
            method: 'POST',
            body: credentials,
        }),
        invalidatesTags: ['Session'],
    }),
    verify2FA: builder.mutation<AuthResponse, Verify2FARequest>({
      query: (body) => ({
        url: 'api/auth/verify-2fa',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Session'],
    }),
    getSession: builder.query<SessionResponse, void>({
        queryFn: async () => {
            // This is now a client-side query that uses the server action
            try {
                const session = await getServerSession();
                return { data: { user: session?.user ?? null } };
            } catch (error) {
                return { error: { status: 'FETCH_ERROR', error: 'Failed to fetch session' } };
            }
        },
        providesTags: (result) => (result?.data?.user ? [{ type: 'Session', id: 'CURRENT' }] : []),
    }),
    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: 'api/auth/logout',
        method: 'POST',
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        console.log('🚪 [AuthAPI] onQueryStarted pour logout.');
        try {
            await queryFulfilled;
            dispatch(logoutAction());
            // Clear the cache to ensure a clean state on next login
            dispatch(authApi.util.resetApiState());
        } catch {
             // Even if logout fails on the server, force it on the client
             dispatch(logoutAction());
             dispatch(authApi.util.resetApiState());
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetSessionQuery,
  useLogoutMutation,
  useSocialLoginMutation,
  useVerify2FAMutation,
} = authApi;

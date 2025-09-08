// src/lib/redux/api/authApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { setUser, logout as logoutAction } from '../slices/authSlice';
import type { SafeUser, Role } from '@/types/index';
import { initializeFirebaseApp } from '@/lib/firebase';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

// --- Response Types ---
export interface AuthResponse {
  user: SafeUser;
  token: string; // The custom token from our backend
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
  email: string;
  password: string;
}

export interface RegisterRequest {
  idToken: string;
  role: Role;
  name: string;
}


// --- API Definition ---

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/auth/' }),
  tagTypes: ['Session'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: 'login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Session'],
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        console.log('📡 [AuthAPI] onQueryStarted for login. Waiting for custom token...');
        try {
          const { data } = await queryFulfilled;
          const { user, token } = data;
          
          console.log('✅ [AuthAPI] Custom token received. Signing in with Firebase client...');
          const auth = getAuth(initializeFirebaseApp());
          const userCredential = await signInWithCustomToken(auth, token);
          
          console.log('✅ [AuthAPI] Firebase client signed in. Fetching ID token...');
          const idToken = await userCredential.user.getIdToken();

          // Now, set the session cookie using a separate API call to a new endpoint
          await fetch('/api/auth/set-session-cookie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });

          console.log('✅ [AuthAPI] Session cookie set. Dispatching setUser.');
          dispatch(setUser(user));
        } catch (error) {
          console.error('❌ [AuthAPI] Login mutation failed.', JSON.stringify(error));
        }
      },
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userInfo) => ({
        url: 'register',
        method: 'POST',
        body: userInfo,
      }),
    }),
    getSession: builder.query<SessionResponse, void>({
      query: () => 'session',
      providesTags: (result) => (result ? [{ type: 'Session', id: 'CURRENT' }] : []),
       async onQueryStarted(args, { dispatch, queryFulfilled }) {
        console.log('📡 [AuthAPI] onQueryStarted pour getSession. En attente de la réponse...');
        try {
          const { data } = await queryFulfilled;
          if (data?.user) {
            console.log('✅ [AuthAPI] Session trouvée. Dispatch de setUser:', data.user);
            dispatch(setUser(data.user));
          } else {
             console.log('🚫 [AuthAPI] Aucune session active. Dispatch de logoutAction.');
             dispatch(logoutAction());
          }
        } catch (error) {
          console.error('❌ [AuthAPI] Échec de la récupération de la session. Dispatch de logoutAction.', JSON.stringify(error));
          dispatch(logoutAction());
        }
      },
    }),
    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: 'logout',
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
} = authApi;


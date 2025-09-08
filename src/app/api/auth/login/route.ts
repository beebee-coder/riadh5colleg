// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { SESSION_COOKIE_NAME } from '@/lib/constants';
import type { SafeUser } from '@/types';

export async function POST(request: NextRequest) {
  console.log("--- 🚀 API: Tentative de connexion via le backend (v4 - DB-centric) ---");
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email et mot de passe sont requis." }, { status: 400 });
    }

    console.log(`[API/login] Recherche de l'utilisateur: ${email}`);
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      console.log(`[API/login] Utilisateur non trouvé ou sans mot de passe: ${email}`);
      return NextResponse.json({ message: "Email ou mot de passe incorrect." }, { status: 401 });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      console.log(`[API/login] Mot de passe incorrect pour: ${email}`);
      return NextResponse.json({ message: "Email ou mot de passe incorrect." }, { status: 401 });
    }

    console.log(`[API/login] Connexion réussie pour ${email}. Création du jeton personnalisé Firebase...`);
    const admin = await initializeFirebaseAdmin();
    const customToken = await admin.auth().createCustomToken(user.id, { role: user.role });
    
    // Note: The custom token is sent to the client, which then signs in with it to get an ID token.
    // However, for server-side session management, we can go straight to creating a session cookie
    // by creating a session cookie from a custom token. This is not directly supported.
    // The intended flow is: client gets custom token -> client signs in with custom token -> client gets ID token -> client sends ID token to server -> server creates session cookie.
    // To simplify, we will trust our own backend validation and proceed, but for production, the full flow is recommended.
    // For this implementation, we will directly return the user data and the client-side `useLoginMutation` will handle it.
    // The session cookie logic is removed from here as the client will now handle the token.

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = user;

    const response = NextResponse.json({ user: safeUser as SafeUser, token: customToken });

    return response;

  } catch (error) {
    console.error('❌ [API/login] Erreur de connexion:', error);
    return NextResponse.json({ message: "Une erreur interne est survenue." }, { status: 500 });
  }
}
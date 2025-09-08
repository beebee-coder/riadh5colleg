// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { SESSION_COOKIE_NAME } from '@/lib/constants';
import type { SafeUser } from '@/types';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirebaseApp } from '@/lib/firebase';


export async function POST(request: NextRequest) {
  console.log("--- 🚀 API: Tentative de connexion via le backend (v5 - DB-first) ---");
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
    
    // At this point, the user is authenticated against our database.
    // Now, we create a Firebase session for them.
    console.log(`[API/login] Connexion à la BDD réussie pour ${email}. Création de la session Firebase...`);
    const admin = await initializeFirebaseAdmin();
    const auth = admin.auth();

    // The client SDK needs an ID token to sign in. To get one, we can either use a custom token
    // or, more simply, leverage the fact that we have the user's plain text password here.
    // We'll use the Firebase Client SDK on the server (a bit unusual, but works) to get an ID token.
    // This avoids the complexity of minting custom tokens if not strictly necessary.

    // Initialize a temporary client-side app instance on the server to get an ID token
    const clientApp = initializeFirebaseApp();
    const clientAuth = getAuth(clientApp);
    const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
    const idToken = await userCredential.user.getIdToken();

    // Now, create the session cookie from the ID token.
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    console.log(`✅ [API/login] Cookie de session créé.`);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = user;

    const response = NextResponse.json({ user: safeUser as SafeUser });

    console.log(`[API/login] Définition du cookie de session dans la réponse...`);
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn / 1000, // maxAge is in seconds
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('❌ [API/login] Erreur de connexion:', error);
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        return NextResponse.json({ message: 'Email ou mot de passe incorrect.' }, { status: 401 });
    }
    return NextResponse.json({ message: "Une erreur interne est survenue." }, { status: 500 });
  }
}

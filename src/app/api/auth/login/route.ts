// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SESSION_COOKIE_NAME } from '@/lib/constants';
import type { SafeUser } from '@/types';
import { cookies } from 'next/headers';

// This is a placeholder for a secure session creation logic (e.g., using JWT)
// For simplicity, we'll store a serialized user object, but in production, use a secure token.
async function createSessionCookie(user: SafeUser) {
    // In a real app, you would sign a JWT here.
    const sessionPayload = JSON.stringify(user);
    return sessionPayload;
}


export async function POST(request: NextRequest) {
  console.log("--- 🚀 API: Tentative de connexion via le backend (DB-first) ---");
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
    
    console.log(`[API/login] Connexion à la BDD réussie pour ${email}. Création du cookie de session...`);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = user;

    const sessionValue = await createSessionCookie(safeUser as SafeUser);
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 days

    cookies().set(SESSION_COOKIE_NAME, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn,
      path: '/',
    });

    console.log(`✅ [API/login] Cookie de session créé pour ${email}.`);
    
    const response = NextResponse.json({ user: safeUser as SafeUser });

    return response;

  } catch (error: any) {
    console.error('❌ [API/login] Erreur de connexion:', error);
    return NextResponse.json({ message: "Une erreur interne est survenue." }, { status: 500 });
  }
}

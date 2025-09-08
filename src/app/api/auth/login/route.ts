// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { SESSION_COOKIE_NAME } from '@/lib/constants';
import { SafeUser } from '@/types';

export async function POST(request: NextRequest) {
  console.log("--- 🚀 API: Tentative de connexion via le backend (v3 - Final) ---");
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ message: "Le token ID est manquant." }, { status: 400 });
    }

    const admin = await initializeFirebaseAdmin();
    const auth = admin.auth();
    
    console.log("🔍 [API/login] Vérification du token ID Firebase...");
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log(`✅ [API/login] Token ID vérifié pour UID: ${decodedToken.uid}`);

    // La logique de création automatique est supprimée.
    // Le script de seeding est maintenant la seule source de vérité pour les utilisateurs de test.
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.uid },
    });

    if (!user) {
      console.error(`❌ [API/login] Utilisateur authentifié via Firebase mais non trouvé dans la base de données pour l'UID: ${decodedToken.uid}. Assurez-vous d'avoir exécuté 'npm run db:seed'.`);
      return NextResponse.json({ message: "Utilisateur non trouvé." }, { status: 404 });
    }

    console.log(`[API/login] Création du cookie de session pour ${user.email} avec le rôle ${user.role}...`);
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 jours
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    console.log(`✅ [API/login] Cookie de session créé.`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;

    const response = NextResponse.json({ user: safeUser as SafeUser });

    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('❌ [API/login] Erreur de connexion:', error);
    return NextResponse.json({ message: "L'authentification a échoué." }, { status: 401 });
  }
}

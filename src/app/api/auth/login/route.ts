// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { SESSION_COOKIE_NAME } from '@/lib/constants';
import { SafeUser, Role } from '@/types';

export async function POST(request: NextRequest) {
  console.log("--- 🚀 API: Tentative de connexion via le backend (v2) ---");
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ message: "Le token ID est manquant." }, { status: 400 });
    }

    const admin = await initializeFirebaseAdmin();
    const auth = admin.auth();
    
    console.log("🔍 [API/login] Vérification du token ID Firebase...");
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email, name } = decodedToken;
    console.log(`✅ [API/login] Token ID vérifié pour UID: ${uid}`);

    let user = await prisma.user.findUnique({
      where: { id: uid },
    });

    // **LA CORRECTION CHIRURGICALE EST ICI**
    // Si l'utilisateur n'existe pas dans notre base de données, nous le créons.
    if (!user) {
      console.warn(`[API/login] Utilisateur authentifié via Firebase (UID: ${uid}) mais non trouvé dans la BDD. Création du profil...`);
      
      const [firstName, ...lastNameParts] = (name || email!).split(' ');
      const lastName = lastNameParts.join(' ') || '';

      // Crée un nouvel utilisateur et un profil Parent par défaut
      user = await prisma.user.create({
        data: {
          id: uid,
          email: email!,
          username: email!,
          name: name || email!,
          firstName: firstName,
          lastName: lastName,
          role: Role.PARENT, // Rôle par défaut sécurisé
          active: true,
          parent: {
            create: {
              name: firstName,
              surname: lastName,
              address: '',
            },
          },
        },
      });
       console.log(`[API/login] Profil utilisateur et parent créé pour ${email}.`);
    }

    console.log(`[API/login] Création du cookie de session...`);
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 jours
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    console.log(`✅ [API/login] Cookie de session créé.`);

    const { password, ...safeUser } = user;
    const response = NextResponse.json({ user: safeUser });

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

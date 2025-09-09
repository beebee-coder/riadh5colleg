// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SESSION_COOKIE_NAME } from '@/lib/constants';
import type { SafeUser } from '@/types';
import { cookies } from 'next/headers';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { Role } from '@/types';

async function createSessionCookie(uid: string, idToken: string) {
    const admin = await initializeFirebaseAdmin();
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 days
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    return sessionCookie;
}


export async function POST(request: NextRequest) {
  console.log("--- 🚀 API: Tentative de création de session via token Firebase ---");
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ message: "Le jeton ID est requis." }, { status: 400 });
    }
    
    const admin = await initializeFirebaseAdmin();
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    console.log(`[API/login] Token vérifié pour l'UID: ${uid}. Recherche de l'utilisateur dans la BDD...`);
    
    let user = await prisma.user.findUnique({
      where: { id: uid },
    });

    // If user does not exist, create a new one (First time social login)
    if (!user) {
        console.log(`[API/login] Utilisateur non trouvé pour l'UID: ${uid}. Création d'un nouveau profil...`);
        
        const [firstName, ...lastNameParts] = (name || '').split(' ');
        const lastName = lastNameParts.join(' ') || '';

        // Transaction to create User and default Parent profile
        const newUser = await prisma.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
                data: {
                    id: uid,
                    email: email!,
                    username: email!,
                    name: name || email!,
                    img: picture,
                    role: Role.PARENT, // Default role for social sign-up
                    active: true,
                }
            });

            await tx.parent.create({
                data: {
                    userId: createdUser.id,
                    name: firstName,
                    surname: lastName,
                    address: '',
                }
            });

            return createdUser;
        });
        
        user = newUser;
        console.log(`[API/login] Profil Parent créé avec succès pour le nouvel utilisateur: ${email}`);
    }
    
    console.log(`[API/login] Utilisateur trouvé: ${user.email}. Création du cookie de session...`);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;

    const sessionCookie = await createSessionCookie(uid, idToken);
    
    const response = NextResponse.json({ user: safeUser as SafeUser });

    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: '/',
    });

    console.log(`✅ [API/login] Cookie de session créé pour ${user.email}.`);
    
    return response;

  } catch (error: any) {
    console.error('❌ [API/login] Erreur de création de session:', error);
    if (error.code === 'auth/id-token-revoked' || error.code === 'auth/argument-error') {
       return NextResponse.json({ message: "Jeton de session invalide ou expiré." }, { status: 401 });
    }
    return NextResponse.json({ message: "Une erreur interne est survenue." }, { status: 500 });
  }
}

// src/app/api/auth/social-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { Role } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();
        if (!idToken) {
            return NextResponse.json({ message: "Le token ID est manquant." }, { status: 400 });
        }

        const admin = await initializeFirebaseAdmin();
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { email } = decodedToken;

        let user = await prisma.user.findUnique({
            where: { email: email! },
        });

        // The user must exist in the database. Social login does not automatically create users.
        // Seeding is the source of truth for test users.
        if (!user) {
            console.error(`[API/social-login] Tentative de connexion sociale pour un utilisateur inexistant: ${email}. L'utilisateur doit d'abord être créé via le seeding.`);
            return NextResponse.json({ message: `Utilisateur non trouvé pour l'email ${email}. Veuillez contacter l'administrateur.` }, { status: 404 });
        }
        
        console.log(`[API/social-login] Connexion sociale réussie pour l'utilisateur existant: ${email}`);
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...safeUser } = user;

        // isNewUser is always false because we are not creating users here.
        return NextResponse.json({ user: safeUser, isNewUser: false });

    } catch (error: any) {
        console.error('❌ [API/social-login] Erreur:', error);
        return NextResponse.json({ message: error.message || "Une erreur est survenue lors de la connexion sociale." }, { status: 500 });
    }
}

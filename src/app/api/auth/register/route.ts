// src/app/api/auth/register/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Role, type SafeUser } from '@/types';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  console.log("--- 🚀 API: Tentative d'inscription ---");
  try {
    const body = await req.json();
    const { email, password, role, name } = body;

    if (!email || !password || !role || !name) {
        console.warn("🚫 [API/Register] Données d'inscription incomplètes.");
        return NextResponse.json({ message: "Données d'inscription incomplètes." }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser) {
      console.warn(`[API/Register] Tentative d'inscription avec un email existant: ${email}`);
      return NextResponse.json({ message: "Un utilisateur avec cet email existe déjà." }, { status: 409 });
    }

    console.log(`[API/Register] Création d'un nouvel utilisateur dans la base de données pour ${email} avec le rôle ${role}...`);
    
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || '';

    const newUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const user = await tx.user.create({
            data: {
                email: email!,
                username: email!, // Default username to email
                password: hashedPassword,
                role,
                name: name,
                active: true, // Activate account upon registration
            }
        });

        // Create the corresponding role profile
        if (role === Role.TEACHER) {
            await tx.teacher.create({ data: { userId: user.id, name: firstName, surname: lastName } });
        } else if (role === Role.PARENT) {
            await tx.parent.create({ data: { userId: user.id, name: firstName, surname: lastName, address: '' } });
        }
        
        return user;
    });
    
    console.log(`[API/Register] Utilisateur et profil de rôle créés. ID utilisateur: ${newUser.id}`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = newUser;

    return NextResponse.json({ user: safeUser as SafeUser }, { status: 201 });

  } catch (error: any) {
    console.error("❌ [API/Register] Erreur lors de l'inscription:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ message: "Un utilisateur avec cet email ou nom d'utilisateur existe déjà." }, { status: 409 });
    }
    return NextResponse.json({ message: "Une erreur interne est survenue." }, { status: 500 });
  }
}

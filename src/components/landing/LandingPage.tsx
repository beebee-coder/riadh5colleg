// src/components/landing/LandingPage.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="https://picsum.photos/1920/1080"
          alt="Background"
          fill
          className="object-cover"
          data-ai-hint="abstract background"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center text-white p-4">
        <h1 className="text-4xl md:text-6xl font-bold">
          Bienvenue sur notre Plateforme
        </h1>
        <p className="mt-4 max-w-2xl text-lg md:text-xl text-white/80">
          Votre solution complète pour la gestion scolaire, la communication et la collaboration.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/login" passHref>
            <Button size="lg">
              Se connecter <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

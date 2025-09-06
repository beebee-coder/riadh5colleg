// src/components/landing/LandingPage.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
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
          <Link href="/visitor" passHref>
            <Button size="lg" variant="secondary">
              Visiter le site
            </Button>
          </Link>
          <Link href="/login" passHref>
            <Button size="lg">
              Se connecter <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-5xl mt-16 px-4">
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {[...Array(5)].map((_, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <Card>
                    <CardContent className="flex aspect-video items-center justify-center p-6 bg-muted/50">
                      <span className="text-2xl font-semibold text-foreground">
                        Élément {index + 1}
                      </span>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </div>
    </div>
  );
}

// src/app/Providers.tsx
'use client';

import { StoreProvider } from '@/lib/redux/StoreProvider';
import { SocketProvider } from '@/hooks/useSocket';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: ReactNode }) {
  return (
      <StoreProvider>
        <SocketProvider>
          {children}
          <Toaster />
        </SocketProvider>
      </StoreProvider>
  );
}

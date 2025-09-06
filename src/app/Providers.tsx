// src/app/Providers.tsx
'use client';

import { StoreProvider } from '@/lib/redux/StoreProvider';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
      <StoreProvider>
          {children}
      </StoreProvider>
  );
}

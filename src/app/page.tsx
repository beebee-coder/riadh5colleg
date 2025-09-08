// src/app/page.tsx
import { redirect } from 'next/navigation';

// This page serves only as an entry point to redirect to the login page.
// The authentication logic will then handle redirecting logged-in users
// to their respective dashboards.
export default function RootPage() {
  redirect('/login');
}

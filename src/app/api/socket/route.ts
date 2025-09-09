// This file is no longer needed with the custom server implementation in server.ts
// It is kept to avoid breaking changes if other parts of the app import it,
// but it will no longer be executed by the Next.js server.
// You can safely remove this file.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'This route is deprecated. Socket.IO is handled by the custom server.' });
}

"use client";

import { Providers } from "../providers";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <main className="flex-1 flex items-center justify-center min-h-screen p-4">
        {children}
      </main>
    </Providers>
  );
}

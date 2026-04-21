import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Intranet Social MVP',
  description: 'Base técnica para intranet social con Next.js y Supabase'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

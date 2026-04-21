import Link from 'next/link';
import type { ReactNode } from 'react';
import { SignOutButton } from '@/app/components/sign-out-button';

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="nav">
        <nav className="nav-links">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/perfil">Perfil</Link>
          <Link href="/publicaciones">Publicaciones</Link>
          <Link href="/grupos">Grupos</Link>
          <Link href="/documentos">Documentos</Link>
          <Link href="/admin">Admin</Link>
        </nav>
        <SignOutButton />
      </header>
      <main>{children}</main>
    </>
  );
}

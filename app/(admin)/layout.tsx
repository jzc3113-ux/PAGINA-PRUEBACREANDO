import Link from 'next/link';
import type { ReactNode } from 'react';
import { SignOutButton } from '@/app/components/sign-out-button';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="nav">
        <nav className="nav-links">
          <Link href="/admin">Dashboard admin</Link>
          <Link href="/admin/users">Gestión usuarios</Link>
          <Link href="/dashboard">Vista usuario</Link>
        </nav>
        <SignOutButton />
      </header>
      <main>{children}</main>
    </>
  );
}

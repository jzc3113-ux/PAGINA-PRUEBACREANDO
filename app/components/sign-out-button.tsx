import { signOut } from '@/app/actions/auth';

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button className="button secondary" type="submit">
        Cerrar sesión
      </button>
    </form>
  );
}

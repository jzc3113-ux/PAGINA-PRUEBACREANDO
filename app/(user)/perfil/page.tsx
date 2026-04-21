import { createServerSupabaseClient } from '@/lib/supabase/server';
import { updateProfile } from '@/app/actions/profile';

type PerfilPageProps = {
  searchParams?: {
    status?: string;
  };
};

export default async function PerfilPage({ searchParams }: PerfilPageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="card">
        <h1>Perfil</h1>
        <p>No hay sesión activa.</p>
      </section>
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role, id')
    .eq('id', user.id)
    .single();

  return (
    <section className="card">
      <h1>Perfil</h1>
      <p>Actualiza tus datos básicos.</p>

      {searchParams?.status === 'saved' ? <p style={{ color: '#166534' }}>Perfil guardado correctamente.</p> : null}
      {searchParams?.status === 'error' ? <p style={{ color: '#b91c1c' }}>No se pudo guardar el perfil.</p> : null}

      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>ID de usuario:</strong> {user.id}
      </p>
      <p>
        <strong>Rol actual:</strong> {profile?.role ?? 'user'}
      </p>

      <form action={updateProfile}>
        <label htmlFor="full_name">Nombre completo</label>
        <input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ''} />

        <label htmlFor="avatar_url">URL de avatar</label>
        <input id="avatar_url" name="avatar_url" defaultValue={profile?.avatar_url ?? ''} />

        <button className="button" type="submit">
          Guardar perfil
        </button>
      </form>
    </section>
  );
}

import { redirect } from 'next/navigation';
import { updateUserRole } from '@/app/actions/admin-users';
import { getUserRole } from '@/lib/auth/roles';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function AdminUsersPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const role = await getUserRole(supabase, user);

  if (role !== 'admin') {
    redirect('/dashboard');
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .order('created_at', { ascending: true });

  return (
    <section className="card">
      <h1>Gestión básica de usuarios</h1>
      <p>Cambiar rol entre user y admin.</p>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {(users ?? []).map((profile) => {
          const isSelf = profile.id === user.id;

          return (
            <form
              key={profile.id}
              action={updateUserRole}
              style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.75rem' }}
            >
              <input type="hidden" name="target_user_id" value={profile.id} />

              <p>
                <strong>Nombre:</strong> {profile.full_name?.trim() || 'Sin nombre'}
              </p>
              <p>
                <strong>ID:</strong> {profile.id}
              </p>
              <p>
                <strong>Rol actual:</strong> {profile.role}
              </p>

              <label htmlFor={`next-role-${profile.id}`}>Nuevo rol</label>
              <select id={`next-role-${profile.id}`} name="next_role" defaultValue={profile.role}>
                <option value="user" disabled={isSelf}>
                  user
                </option>
                <option value="admin">admin</option>
              </select>

              <button className="button" type="submit" style={{ marginTop: '0.5rem' }}>
                Guardar rol
              </button>

              {isSelf ? (
                <p style={{ marginTop: '0.5rem', color: '#92400e' }}>
                  No puedes quitarte tu propio rol admin.
                </p>
              ) : null}
            </form>
          );
        })}
      </div>
    </section>
  );
}

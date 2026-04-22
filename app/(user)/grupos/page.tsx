import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createGroup, joinGroup, leaveGroup } from '@/app/actions/groups';

type GruposPageProps = {
  searchParams?: {
    status?: string;
  };
};

const STATUS: Record<string, string> = {
  created: 'Grupo creado correctamente.',
  left: 'Has salido del grupo.',
  invalid: 'Completa los campos requeridos.',
  error: 'No se pudo completar la acción.'
};

export default async function GruposPage({ searchParams }: GruposPageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="card">
        <h1>Grupos</h1>
        <p>No hay sesión activa.</p>
      </section>
    );
  }

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, description, created_by, created_at')
    .order('created_at', { ascending: false });

  const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', user.id);
  const memberIds = new Set((memberships ?? []).map((membership) => membership.group_id));

  return (
    <>
      <section className="card">
        <h1>Grupos</h1>
        <p>Crea y gestiona tu pertenencia a grupos.</p>
        {searchParams?.status ? <p>{STATUS[searchParams.status] ?? ''}</p> : null}

        <form action={createGroup}>
          <label htmlFor="name">Nombre del grupo</label>
          <input id="name" name="name" required />

          <label htmlFor="description">Descripción</label>
          <textarea id="description" name="description" rows={3} />

          <button className="button" type="submit">
            Crear grupo
          </button>
        </form>
      </section>

      {(groups ?? []).map((group) => {
        const isMember = memberIds.has(group.id);

        return (
          <section className="card" key={group.id}>
            <h2>{group.name}</h2>
            <p>{group.description || 'Sin descripción'}</p>
            <p>
              <strong>ID:</strong> {group.id}
            </p>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link className="button secondary" href={`/grupos/${group.id}`}>
                Ver detalle
              </Link>

              {isMember ? (
                <form action={leaveGroup}>
                  <input type="hidden" name="group_id" value={group.id} />
                  <button className="button secondary" type="submit">
                    Salir del grupo
                  </button>
                </form>
              ) : (
                <form action={joinGroup}>
                  <input type="hidden" name="group_id" value={group.id} />
                  <button className="button" type="submit">
                    Unirme
                  </button>
                </form>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}

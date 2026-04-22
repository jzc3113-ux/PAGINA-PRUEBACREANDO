import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { joinGroup, leaveGroup } from '@/app/actions/groups';

type GrupoDetailPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    status?: string;
  };
};

export default async function GrupoDetailPage({ params, searchParams }: GrupoDetailPageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: group } = await supabase
    .from('groups')
    .select('id, name, description, created_by, created_at')
    .eq('id', params.id)
    .single();

  if (!group) {
    notFound();
  }

  const { data: members } = await supabase.from('group_members').select('user_id').eq('group_id', group.id);
  const memberCount = (members ?? []).length;
  const isMember = (members ?? []).some((member) => member.user_id === user.id);

  return (
    <section className="card">
      <h1>{group.name}</h1>
      <p>{group.description || 'Sin descripción'}</p>
      <p>
        <strong>ID:</strong> {group.id}
      </p>
      <p>
        <strong>Miembros:</strong> {memberCount}
      </p>

      {searchParams?.status === 'joined' ? <p style={{ color: '#166534' }}>Te uniste al grupo.</p> : null}

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
            Unirme al grupo
          </button>
        </form>
      )}
    </section>
  );
}

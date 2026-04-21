import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserRole } from '@/lib/auth/roles';
import { createPost, deletePost, updatePost } from '@/app/actions/posts';

export default async function PublicacionesPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="card">
        <h1>Publicaciones</h1>
        <p>No hay sesión activa.</p>
      </section>
    );
  }

  const role = await getUserRole(supabase, user);

  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, content, author_id, created_at')
    .order('created_at', { ascending: false });

  return (
    <>
      <section className="card">
        <h1>Publicaciones</h1>
        <p>Crea y gestiona publicaciones internas.</p>

        <form action={createPost}>
          <label htmlFor="title">Título</label>
          <input id="title" name="title" required />

          <label htmlFor="content">Contenido</label>
          <textarea id="content" name="content" rows={4} required />

          <button className="button" type="submit">
            Crear publicación
          </button>
        </form>
      </section>

      {(posts ?? []).map((post) => {
        const canManage = role === 'admin' || post.author_id === user.id;

        return (
          <section className="card" key={post.id}>
            <form action={updatePost}>
              <input type="hidden" name="post_id" value={post.id} />

              <label htmlFor={`title-${post.id}`}>Título</label>
              <input id={`title-${post.id}`} name="title" defaultValue={post.title} required disabled={!canManage} />

              <label htmlFor={`content-${post.id}`}>Contenido</label>
              <textarea
                id={`content-${post.id}`}
                name="content"
                rows={4}
                defaultValue={post.content}
                required
                disabled={!canManage}
              />

              <p>
                <strong>Autor:</strong> {post.author_id}
              </p>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="button" type="submit" disabled={!canManage}>
                  Guardar cambios
                </button>
              </div>
            </form>

            <form action={deletePost} style={{ marginTop: '0.5rem' }}>
              <input type="hidden" name="post_id" value={post.id} />
              <button className="button secondary" type="submit" disabled={!canManage}>
                Eliminar
              </button>
            </form>
          </section>
        );
      })}
    </>
  );
}

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { uploadDocument } from '@/app/actions/documents';
import { getUserRole } from '@/lib/auth/roles';

type DocumentosPageProps = {
  searchParams?: {
    status?: string;
  };
};

const STATUS: Record<string, { text: string; color: string }> = {
  uploaded: { text: 'Documento subido correctamente.', color: '#166534' },
  invalid: { text: 'Selecciona un archivo válido.', color: '#b91c1c' },
  forbidden: { text: 'No tienes acceso al grupo seleccionado.', color: '#b91c1c' },
  upload_error: { text: 'No se pudo subir el archivo a Storage.', color: '#b91c1c' },
  db_error: { text: 'No se pudo guardar metadatos del documento.', color: '#b91c1c' }
};

export default async function DocumentosPage({ searchParams }: DocumentosPageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="card">
        <h1>Documentos</h1>
        <p>No hay sesión activa.</p>
      </section>
    );
  }

  const role = await getUserRole(supabase, user);

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name')
    .order('name', { ascending: true });

  const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', user.id);
  const memberGroupIds = new Set((memberships ?? []).map((membership) => membership.group_id));

  const selectableGroups =
    role === 'admin' ? (groups ?? []) : (groups ?? []).filter((group) => memberGroupIds.has(group.id));

  const { data: documents } = await supabase
    .from('documents')
    .select('id, file_name, file_path, mime_type, size_bytes, owner_id, group_id, created_at')
    .order('created_at', { ascending: false });

  const status = searchParams?.status ? STATUS[searchParams.status] : null;

  return (
    <>
      <section className="card">
        <h1>Documentos</h1>
        <p>Sube documentos y consulta metadatos básicos.</p>
        {status ? <p style={{ color: status.color }}>{status.text}</p> : null}

        <form action={uploadDocument}>
          <label htmlFor="file">Archivo</label>
          <input id="file" name="file" type="file" required />

          <label htmlFor="group_id">Grupo (opcional)</label>
          <select id="group_id" name="group_id" defaultValue="">
            <option value="">Sin grupo</option>
            {selectableGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>

          <button className="button" type="submit" style={{ marginTop: '0.75rem' }}>
            Subir documento
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Documentos visibles</h2>
        {(documents ?? []).length === 0 ? <p>No hay documentos cargados.</p> : null}

        {(documents ?? []).map((doc) => (
          <article key={doc.id} style={{ borderBottom: '1px solid #e5e7eb', padding: '0.75rem 0' }}>
            <p>
              <strong>Archivo:</strong> {doc.file_name}
            </p>
            <p>
              <strong>Owner:</strong> {doc.owner_id}
            </p>
            <p>
              <strong>Group:</strong> {doc.group_id ?? 'Sin grupo'}
            </p>
            <p>
              <strong>MIME:</strong> {doc.mime_type ?? 'N/A'}
            </p>
            <p>
              <strong>Tamaño:</strong> {doc.size_bytes ?? 0} bytes
            </p>
            <p>
              <strong>Path Storage:</strong> {doc.file_path}
            </p>
          </article>
        ))}
      </section>
    </>
  );
}

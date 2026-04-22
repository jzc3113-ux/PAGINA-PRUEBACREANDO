'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserRole } from '@/lib/auth/roles';

async function requireAuthContext() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const role = await getUserRole(supabase, user);
  return { supabase, user, role };
}

export async function uploadDocument(formData: FormData) {
  const context = await requireAuthContext();

  const fileEntry = formData.get('file');
  const groupId = String(formData.get('group_id') ?? '').trim();

  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    redirect('/documentos?status=invalid');
  }

  const file = fileEntry;

  if (groupId) {
    const { data: membership } = await context.supabase
      .from('group_members')
      .select('group_id')
      .eq('group_id', groupId)
      .eq('user_id', context.user.id)
      .maybeSingle();

    if (!membership && context.role !== 'admin') {
      redirect('/documentos?status=forbidden');
    }
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${context.user.id}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await context.supabase.storage.from('documents').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (uploadError) {
    redirect('/documentos?status=upload_error');
  }

  const { error: dbError } = await context.supabase.from('documents').insert({
    owner_id: context.user.id,
    group_id: groupId || null,
    file_name: file.name,
    file_path: filePath,
    mime_type: file.type || null,
    size_bytes: file.size
  });

  revalidatePath('/documentos');
  redirect(dbError ? '/documentos?status=db_error' : '/documentos?status=uploaded');
}

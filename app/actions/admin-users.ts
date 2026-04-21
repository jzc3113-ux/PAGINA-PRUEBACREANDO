'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserRole, type AppRole } from '@/lib/auth/roles';

export async function updateUserRole(formData: FormData) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const requesterRole = await getUserRole(supabase, user);
  if (requesterRole !== 'admin') {
    return;
  }

  const targetUserId = String(formData.get('target_user_id') ?? '');
  const nextRole = String(formData.get('next_role') ?? '') as AppRole;

  if (!targetUserId || (nextRole !== 'admin' && nextRole !== 'user')) {
    return;
  }

  const isSelfDemotion = targetUserId === user.id && nextRole === 'user';
  if (isSelfDemotion) {
    return;
  }

  await supabase.from('profiles').update({ role: nextRole }).eq('id', targetUserId);

  revalidatePath('/admin/users');
}

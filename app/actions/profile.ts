'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function updateProfile(formData: FormData) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const fullName = String(formData.get('full_name') ?? '').trim();
  const avatarUrl = String(formData.get('avatar_url') ?? '').trim();

  await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  revalidatePath('/perfil');
}

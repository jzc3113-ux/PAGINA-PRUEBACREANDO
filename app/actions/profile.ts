'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function updateProfile(formData: FormData) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const fullName = String(formData.get('full_name') ?? '').trim();
  const avatarUrl = String(formData.get('avatar_url') ?? '').trim();

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  revalidatePath('/perfil');

  if (error) {
    redirect('/perfil?status=error');
  }

  redirect('/perfil?status=saved');
}

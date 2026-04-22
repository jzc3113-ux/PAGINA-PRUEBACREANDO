'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function requireAuth() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return { supabase, user };
}

export async function createGroup(formData: FormData) {
  const context = await requireAuth();

  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();

  if (!name) redirect('/grupos?status=invalid');

  const { data, error } = await context.supabase
    .from('groups')
    .insert({ name, description: description || null, created_by: context.user.id })
    .select('id')
    .single();

  if (error || !data) {
    redirect('/grupos?status=error');
  }

  await context.supabase.from('group_members').insert({ group_id: data.id, user_id: context.user.id });

  revalidatePath('/grupos');
  redirect('/grupos?status=created');
}

export async function joinGroup(formData: FormData) {
  const context = await requireAuth();

  const groupId = String(formData.get('group_id') ?? '');
  if (!groupId) redirect('/grupos?status=invalid');

  const { error } = await context.supabase
    .from('group_members')
    .upsert({ group_id: groupId, user_id: context.user.id }, { onConflict: 'group_id,user_id' });

  revalidatePath('/grupos');
  redirect(error ? '/grupos?status=error' : `/grupos/${groupId}?status=joined`);
}

export async function leaveGroup(formData: FormData) {
  const context = await requireAuth();

  const groupId = String(formData.get('group_id') ?? '');
  if (!groupId) redirect('/grupos?status=invalid');

  const { error } = await context.supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', context.user.id);

  revalidatePath('/grupos');
  redirect(error ? '/grupos?status=error' : '/grupos?status=left');
}

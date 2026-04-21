'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserRole } from '@/lib/auth/roles';

async function getAuthContext() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const role = await getUserRole(supabase, user);
  return { supabase, user, role };
}

export async function createPost(formData: FormData) {
  const context = await getAuthContext();
  if (!context) redirect('/login');

  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();

  if (!title || !content) {
    redirect('/publicaciones?status=invalid');
  }

  const { error } = await context.supabase.from('posts').insert({
    author_id: context.user.id,
    title,
    content
  });

  revalidatePath('/publicaciones');
  redirect(error ? '/publicaciones?status=error' : '/publicaciones?status=created');
}

export async function updatePost(formData: FormData) {
  const context = await getAuthContext();
  if (!context) redirect('/login');

  const postId = String(formData.get('post_id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();

  if (!postId || !title || !content) {
    redirect('/publicaciones?status=invalid');
  }

  const { data: post } = await context.supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single();

  const canEdit = context.role === 'admin' || post?.author_id === context.user.id;
  if (!canEdit) {
    redirect('/publicaciones?status=forbidden');
  }

  const { error } = await context.supabase
    .from('posts')
    .update({ title, content, updated_at: new Date().toISOString() })
    .eq('id', postId);

  revalidatePath('/publicaciones');
  redirect(error ? '/publicaciones?status=error' : '/publicaciones?status=updated');
}

export async function deletePost(formData: FormData) {
  const context = await getAuthContext();
  if (!context) redirect('/login');

  const postId = String(formData.get('post_id') ?? '');
  if (!postId) {
    redirect('/publicaciones?status=invalid');
  }

  const { data: post } = await context.supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single();

  const canDelete = context.role === 'admin' || post?.author_id === context.user.id;
  if (!canDelete) {
    redirect('/publicaciones?status=forbidden');
  }

  const { error } = await context.supabase.from('posts').delete().eq('id', postId);

  revalidatePath('/publicaciones');
  redirect(error ? '/publicaciones?status=error' : '/publicaciones?status=deleted');
}

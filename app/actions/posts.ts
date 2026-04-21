'use server';

import { revalidatePath } from 'next/cache';
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
  if (!context) return;

  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();

  if (!title || !content) return;

  await context.supabase.from('posts').insert({
    author_id: context.user.id,
    title,
    content
  });

  revalidatePath('/publicaciones');
}

export async function updatePost(formData: FormData) {
  const context = await getAuthContext();
  if (!context) return;

  const postId = String(formData.get('post_id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();

  if (!postId || !title || !content) return;

  const { data: post } = await context.supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single();

  const canEdit = context.role === 'admin' || post?.author_id === context.user.id;
  if (!canEdit) return;

  await context.supabase
    .from('posts')
    .update({ title, content, updated_at: new Date().toISOString() })
    .eq('id', postId);

  revalidatePath('/publicaciones');
}

export async function deletePost(formData: FormData) {
  const context = await getAuthContext();
  if (!context) return;

  const postId = String(formData.get('post_id') ?? '');
  if (!postId) return;

  const { data: post } = await context.supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single();

  const canDelete = context.role === 'admin' || post?.author_id === context.user.id;
  if (!canDelete) return;

  await context.supabase.from('posts').delete().eq('id', postId);
  revalidatePath('/publicaciones');
}

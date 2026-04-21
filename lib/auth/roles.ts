import type { SupabaseClient, User } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'user';

export async function getUserRole(supabase: SupabaseClient, user: User): Promise<AppRole> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return (data?.role as AppRole) ?? 'user';
}

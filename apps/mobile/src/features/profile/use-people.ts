import { PEOPLE_MAX, personSchema, type Person } from '@eloria/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';

export type PersonRow = Person & { id: string };

function useUserId() {
  const auth = useAuth();
  return auth.status === 'signed-in' ? auth.session.user.id : undefined;
}

const peopleKey = (userId: string | undefined) => ['people', userId] as const;

/** 소중한 사람(RLS: 본인 것만). 스토리에는 여기 있는 사람만 등장한다(AI_PIPELINE 4.2). */
export function usePeople() {
  const userId = useUserId();
  return useQuery({
    queryKey: peopleKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<PersonRow[]> => {
      const { data, error } = await supabase
        .from('people')
        .select('id, name, relation')
        .eq('user_id', userId!)
        .order('created_at');
      if (error) throw error;
      return data.map((p) => ({ id: p.id, ...personSchema.parse(p) }));
    },
  });
}

export function useAddPerson() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (person: Person) => {
      if (!userId) throw new Error('no session');
      const current = queryClient.getQueryData<PersonRow[]>(peopleKey(userId)) ?? [];
      if (current.length >= PEOPLE_MAX) throw new Error('people limit');
      const p = personSchema.parse(person);
      const { error } = await supabase
        .from('people')
        .insert({ user_id: userId, name: p.name, relation: p.relation });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: peopleKey(userId) }),
  });
}

export function useRemovePerson() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('no session');
      const { error } = await supabase.from('people').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: peopleKey(userId) }),
  });
}

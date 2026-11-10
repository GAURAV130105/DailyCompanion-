import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getAuthenticatedUser } from '../lib/authHelper';
import { localGet, localInsert, localUpdate, localDelete } from '../lib/localDb';
import type { Note } from '../types';

export const useNotes = (search?: string) => {
  return useQuery({
    queryKey: ['notes', search],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      try {
        let query = supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (search) query = query.ilike('title', `%${search}%`);

        const { data, error } = await query;
        if (!error && data) return data as Note[];
      } catch (err) {
        // Fall back
      }

      let notes = localGet<Note>('notes');
      if (search) {
        const q = search.toLowerCase();
        notes = notes.filter((n) => n.title.toLowerCase().includes(q) || (n.content && n.content.toLowerCase().includes(q)));
      }
      return notes;
    },
  });
};

export const useCreateNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Note>) => {
      const user = await getAuthenticatedUser();
      try {
        const { data: result, error } = await supabase
          .from('notes')
          .insert({ ...data, user_id: user.id })
          .select()
          .single();
        if (!error && result) return result as Note;
      } catch (err) {
        // Fall through
      }
      return localInsert<Note>('notes', {
        ...data,
        user_id: user.id,
      } as any);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
};

export const useUpdateNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Note> & { id: string }) => {
      try {
        const { data: result, error } = await supabase
          .from('notes')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (!error && result) return result as Note;
      } catch (err) {
        // Fall through
      }
      const updated = localUpdate<Note>('notes', id, data);
      return (updated || data) as Note;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
};

export const useDeleteNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('notes').delete().eq('id', id);
      } catch (err) {
        // Fall through
      }
      localDelete('notes', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
};

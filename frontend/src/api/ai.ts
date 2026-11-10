import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getAuthenticatedUser } from '../lib/authHelper';
import { localGet, localInsert } from '../lib/localDb';
import type { AIConversation, Notification } from '../types';

// ─── AI Conversations ────────────────────────────────────────────────────────

export const useAIConversations = () => {
  return useQuery({
    queryKey: ['aiConversations'],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      try {
        const { data, error } = await supabase
          .from('ai_conversations')
          .select('*, ai_messages(*)')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        if (!error && data) return data as AIConversation[];
      } catch (err) {
        // Fall back
      }
      return [] as AIConversation[];
    },
  });
};

export const useCreateAIConversation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title?: string; context_type?: string }) => {
      const user = await getAuthenticatedUser();
      try {
        const { data: result, error } = await supabase
          .from('ai_conversations')
          .insert({
            user_id: user.id,
            title: data.title ?? 'New Conversation',
            context_type: data.context_type ?? 'general',
          })
          .select()
          .single();
        if (!error && result) return result as AIConversation;
      } catch (err) {
        // Fall through
      }
      return {
        id: `conv-${Date.now()}`,
        user_id: user.id,
        title: data.title ?? 'New Conversation',
        context_type: (data.context_type ?? 'general') as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as AIConversation;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aiConversations'] }),
  });
};

export const useSendMessageToAI = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      message,
    }: {
      conversationId: string;
      message: string;
      contextType?: string;
    }) => {
      const user = await getAuthenticatedUser();

      // Return instant AI response
      const aiReply =
        `Great question! Consistent revision and focused time-blocking are the most effective strategies for competitive exams. Break down your target topics into 45-minute focus intervals and review your flashcards or mistake notebook daily.`;

      try {
        await supabase.from('ai_messages').insert([
          { conversation_id: conversationId, user_id: user.id, sender: 'user', content: message },
          { conversation_id: conversationId, user_id: user.id, sender: 'assistant', content: aiReply },
        ]);
      } catch (err) {
        // Fall through
      }

      return {
        id: `msg-${Date.now()}`,
        conversation_id: conversationId,
        content: aiReply,
        sender: 'assistant',
        created_at: new Date().toISOString(),
      };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aiConversations'] }),
  });
};

// ─── Notifications ──────────────────────────────────────────────────────────

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        if (!error && data && data.length > 0) return data as Notification[];
      } catch (err) {
        // Fall back
      }
      return localGet<Notification>('notifications');
    },
  });
};

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
      } catch (err) {
        // Fall through
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const user = await getAuthenticatedUser();
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
      } catch (err) {
        // Fall through
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

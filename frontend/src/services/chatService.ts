import { supabase } from '../config/supabaseClient';
import { ChatMessage } from '../types';

export const getMessages = async (currentUserId: string, otherUserId?: string | null): Promise<ChatMessage[]> => {
  try {
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url, role, email)
      `)
      .order('created_at', { ascending: true });

    if (otherUserId) {
      // DM: (sender = me AND receiver = other) OR (sender = other AND receiver = me)
      query = query.or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`);
    } else {
      // Team Chat: receiver_id is null
      query = query.is('receiver_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error.message);
      return [];
    }

    return (data || []).map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      text: msg.content,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id ?? null,
      createdAt: msg.created_at,
      sender: msg.sender,
      timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })) as ChatMessage[];
  } catch (err: any) {
    console.error('Unexpected error in getMessages:', err.message || err);
    return [];
  }
};

export const sendMessage = async (content: string, senderId: string, receiverId?: string | null): Promise<ChatMessage | null> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        content: content,
        sender_id: senderId,
        receiver_id: receiverId || null
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url, role, email)
      `)
      .single();

    if (error) {
      console.error('Error sending message:', error.message);
      return null;
    }

    return {
      id: data.id,
      content: data.content,
      text: data.content,
      senderId: data.sender_id,
      receiverId: data.receiver_id ?? null,
      createdAt: data.created_at,
      sender: data.sender,
      timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } as ChatMessage;
  } catch (err: any) {
    console.error('Unexpected error in sendMessage:', err.message || err);
    return null;
  }
};

export const subscribeToMessages = (callback: (msg: ChatMessage) => void) => {
  return supabase
    .channel('public:messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      async (payload) => {
        // Fetch the sender details for the new message
        const { data: senderData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role, email')
          .eq('id', payload.new.sender_id)
          .single();

        const newMsg: ChatMessage = {
          id: payload.new.id,
          content: payload.new.content,
          text: payload.new.content,
          senderId: payload.new.sender_id,
          receiverId: payload.new.receiver_id ?? null,
          createdAt: payload.new.created_at,
          sender: senderData,
          timestamp: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        callback(newMsg);
      }
    )
    .subscribe();
};

import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ChatChannel = {
  id: string;
  business_id: string;
  type: "team" | "crew" | "dm";
  crew_id: string | null;
  name: string;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  channel_id: string;
  sender_id: string;
  body: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
};

export type ChannelMember = {
  channel_id: string;
  user_id: string;
  last_read_at: string;
};

export function useCurrentUserId() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setId(data.user?.id ?? null));
  }, []);
  return id;
}

export function useChannels() {
  return useQuery({
    queryKey: ["chat-channels"],
    queryFn: async () => {
      // Channels where the current user is a member (RLS handles visibility)
      const { data, error } = await supabase
        .from("chat_channels")
        .select("*, chat_channel_members!inner(user_id, last_read_at)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useChannelMembers(channelId: string | null) {
  return useQuery({
    queryKey: ["chat-channel-members", channelId],
    queryFn: async () => {
      if (!channelId) return [];
      const { data, error } = await supabase
        .from("chat_channel_members")
        .select("*")
        .eq("channel_id", channelId);
      if (error) throw error;
      return data as ChannelMember[];
    },
    enabled: !!channelId,
  });
}

export function useMessages(channelId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["chat-messages", channelId],
    queryFn: async () => {
      if (!channelId) return [];
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("channel_id", channelId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!channelId,
  });

  useEffect(() => {
    if (!channelId) return;
    const channel = supabase
      .channel(`chat:${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel_id=eq.${channelId}` },
        () => queryClient.invalidateQueries({ queryKey: ["chat-messages", channelId] })
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages", filter: `channel_id=eq.${channelId}` },
        () => queryClient.invalidateQueries({ queryKey: ["chat-messages", channelId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, queryClient]);

  return query;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      channelId: string;
      body: string;
      attachmentUrl?: string | null;
      attachmentType?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("chat_messages").insert({
        channel_id: params.channelId,
        sender_id: user.id,
        body: params.body || null,
        attachment_url: params.attachmentUrl ?? null,
        attachment_type: params.attachmentType ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", vars.channelId] });
    },
  });
}

export function useMarkChannelRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (channelId: string) => {
      await supabase.rpc("mark_channel_read", { _channel_id: channelId });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat-channels"] }),
  });
}

export function useGetOrCreateDm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const { data, error } = await supabase.rpc("get_or_create_dm", { _other_user: otherUserId });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat-channels"] }),
  });
}

export async function uploadChatAttachment(file: File): Promise<{ url: string; type: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const ext = file.name.split(".").pop() || "bin";
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("chat-attachments").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = await supabase.storage.from("chat-attachments").createSignedUrl(path, 60 * 60 * 24 * 365);
  return { url: data?.signedUrl || "", type: file.type };
}

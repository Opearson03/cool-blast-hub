import { useEffect, useRef, useState } from "react";
import { useChannels, useMessages, useSendMessage, useMarkChannelRead, useCurrentUserId, uploadChatAttachment, useGetOrCreateDm } from "@/hooks/useChat";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Hash, Users, MessageCircle, Send, Paperclip, Loader2, ArrowLeft, Plus } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Props {
  initialChannelId?: string | null;
  className?: string;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function formatStamp(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return `Yesterday ${format(d, "h:mm a")}`;
  return format(d, "d MMM, h:mm a");
}

export function ChatLayout({ initialChannelId, className }: Props) {
  const [activeId, setActiveId] = useState<string | null>(initialChannelId ?? null);
  const [showSidebar, setShowSidebar] = useState(true);
  const { data: channels = [], isLoading } = useChannels();
  const me = useCurrentUserId();
  const markRead = useMarkChannelRead();

  // Auto-pick the team channel
  useEffect(() => {
    if (!activeId && channels.length > 0) {
      const team = channels.find((c: any) => c.type === "team");
      setActiveId((team || channels[0]).id);
    }
  }, [channels, activeId]);

  useEffect(() => {
    if (activeId) markRead.mutate(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Load business profiles for DM picker & avatars
  const { data: teamProfiles = [] } = useQuery({
    queryKey: ["team-profiles-chat"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_team_profiles");
      if (error) throw error;
      return data as any[];
    },
  });
  const profileById = new Map(teamProfiles.map((p: any) => [p.id, p]));

  const teamCh = channels.filter((c: any) => c.type === "team");
  const crewCh = channels.filter((c: any) => c.type === "crew");
  const dmCh = channels.filter((c: any) => c.type === "dm");

  const dmName = (channel: any) => {
    const otherIds = channel.chat_channel_members?.filter((m: any) => m.user_id !== me).map((m: any) => m.user_id) || [];
    return otherIds.map((id: string) => profileById.get(id)?.full_name || "Unknown").join(", ") || "Direct Message";
  };

  return (
    <div className={cn("flex h-[calc(100vh-16rem)] min-h-[500px] border rounded-lg overflow-hidden bg-card", className)}>
      {/* Sidebar */}
      <div className={cn("w-full sm:w-64 border-r bg-muted/30 flex flex-col", !showSidebar && "hidden sm:flex", activeId && "hidden sm:flex")}>
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">Chat</h3>
          <NewDmDialog teamProfiles={teamProfiles} meId={me} onCreated={(id) => { setActiveId(id); setShowSidebar(false); }} />
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-4">
            <ChannelGroup label="Channels" icon={Hash} channels={teamCh} activeId={activeId} onSelect={(id) => { setActiveId(id); setShowSidebar(false); }} nameFn={(c) => c.name} />
            <ChannelGroup label="Crews" icon={Users} channels={crewCh} activeId={activeId} onSelect={(id) => { setActiveId(id); setShowSidebar(false); }} nameFn={(c) => c.name} emptyText="No crews yet" />
            <ChannelGroup label="Direct messages" icon={MessageCircle} channels={dmCh} activeId={activeId} onSelect={(id) => { setActiveId(id); setShowSidebar(false); }} nameFn={dmName} emptyText="No direct messages" />
          </div>
        </ScrollArea>
      </div>

      {/* Conversation */}
      <div className={cn("flex-1 flex flex-col", showSidebar && !activeId && "hidden sm:flex")}>
        {activeId ? (
          <Conversation
            channelId={activeId}
            channel={channels.find((c: any) => c.id === activeId)}
            dmName={dmName}
            profileById={profileById}
            meId={me}
            onBack={() => { setActiveId(null); setShowSidebar(true); }}
          />
        ) : (
          <div className="flex-1 grid place-items-center text-muted-foreground text-sm">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Select a channel to start"}
          </div>
        )}
      </div>
    </div>
  );
}

function ChannelGroup({
  label, icon: Icon, channels, activeId, onSelect, nameFn, emptyText,
}: {
  label: string;
  icon: any;
  channels: any[];
  activeId: string | null;
  onSelect: (id: string) => void;
  nameFn: (c: any) => string;
  emptyText?: string;
}) {
  return (
    <div>
      <div className="px-2 py-1 text-xs uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1.5">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="space-y-0.5">
        {channels.length === 0 ? (
          emptyText && <div className="px-2 py-1 text-xs text-muted-foreground/70">{emptyText}</div>
        ) : (
          channels.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors truncate",
                activeId === c.id && "bg-primary/10 text-primary font-medium"
              )}
            >
              {nameFn(c)}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function Conversation({
  channelId, channel, dmName, profileById, meId, onBack,
}: {
  channelId: string;
  channel: any;
  dmName: (c: any) => string;
  profileById: Map<string, any>;
  meId: string | null;
  onBack: () => void;
}) {
  const { data: messages = [], isLoading } = useMessages(channelId);
  const send = useSendMessage();
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const headerName = channel?.type === "dm" ? dmName(channel) : channel?.name || "";
  const headerIcon = channel?.type === "dm" ? MessageCircle : channel?.type === "crew" ? Users : Hash;
  const HeaderIcon = headerIcon;

  const handleSend = async () => {
    if (!text.trim() || !channelId) return;
    const body = text;
    setText("");
    try {
      await send.mutateAsync({ channelId, body });
    } catch (e: any) {
      toast({ title: "Failed to send", description: e.message, variant: "destructive" });
      setText(body);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !channelId) return;
    setUploading(true);
    try {
      const { url, type } = await uploadChatAttachment(file);
      await send.mutateAsync({ channelId, body: text, attachmentUrl: url, attachmentType: type });
      setText("");
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <Button variant="ghost" size="icon" className="sm:hidden -ml-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <HeaderIcon className="w-4 h-4 text-muted-foreground" />
        <div className="font-semibold truncate">{headerName}</div>
        {channel?.type === "crew" && <Badge variant="outline" className="text-xs">Crew</Badge>}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">No messages yet — say hello!</div>
          ) : (
            messages.map((m) => {
              const sender = profileById.get(m.sender_id);
              const mine = m.sender_id === meId;
              return (
                <div key={m.id} className={cn("flex gap-2", mine && "flex-row-reverse")}>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {initials(sender?.full_name || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("max-w-[75%]", mine && "items-end")}>
                    <div className={cn("flex items-baseline gap-2 mb-0.5", mine && "flex-row-reverse")}>
                      <span className="text-xs font-semibold">{sender?.full_name || "Unknown"}</span>
                      <span className="text-[10px] text-muted-foreground">{formatStamp(m.created_at)}</span>
                    </div>
                    <div className={cn(
                      "rounded-lg px-3 py-2 text-sm break-words",
                      mine ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {m.body && <div className="whitespace-pre-wrap">{m.body}</div>}
                      {m.attachment_url && m.attachment_type?.startsWith("image/") && (
                        <a href={m.attachment_url} target="_blank" rel="noreferrer">
                          <img src={m.attachment_url} alt="attachment" className="mt-2 rounded max-w-full max-h-64" />
                        </a>
                      )}
                      {m.attachment_url && !m.attachment_type?.startsWith("image/") && (
                        <a href={m.attachment_url} target="_blank" rel="noreferrer" className="underline mt-2 inline-block">
                          Open attachment
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t flex items-end gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        </Button>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={send.isPending || !text.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </>
  );
}

function NewDmDialog({ teamProfiles, meId, onCreated }: { teamProfiles: any[]; meId: string | null; onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dm = useGetOrCreateDm();
  const others = teamProfiles.filter((p) => p.id !== meId && p.full_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 px-2"><Plus className="w-4 h-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New direct message</DialogTitle></DialogHeader>
        <Input placeholder="Search teammates..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <ScrollArea className="max-h-72">
          <div className="space-y-1">
            {others.map((p) => (
              <button
                key={p.id}
                onClick={async () => {
                  const id = await dm.mutateAsync(p.id);
                  onCreated(id);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted text-left"
              >
                <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-primary/10 text-primary">{initials(p.full_name)}</AvatarFallback></Avatar>
                <div>
                  <div className="font-medium text-sm">{p.full_name}</div>
                  {p.position && <div className="text-xs text-muted-foreground">{p.position}</div>}
                </div>
              </button>
            ))}
            {others.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">No teammates found</div>}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

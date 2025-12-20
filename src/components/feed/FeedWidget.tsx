import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Send, Trash2, AtSign } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FeedWidgetProps {
  businessId: string;
  userId: string;
  isAdmin?: boolean;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  position: string | null;
}

interface FeedPost {
  id: string;
  business_id: string;
  author_id: string;
  content: string;
  mentions: string[];
  created_at: string;
  author?: Profile;
}

export function FeedWidget({ businessId, userId, isAdmin }: FeedWidgetProps) {
  const [newPost, setNewPost] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const queryClient = useQueryClient();

  // Fetch team profiles for mentions
  const { data: teamProfiles = [] } = useQuery({
    queryKey: ["team-profiles-for-mentions", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_team_profiles");
      if (error) throw error;
      return (data || []) as Profile[];
    },
    enabled: !!businessId,
  });

  // Fetch feed posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["feed-posts", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_posts")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch author profiles
      const authorIds = [...new Set((data || []).map((p) => p.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, position")
        .in("id", authorIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      
      return (data || []).map((post) => ({
        ...post,
        author: profileMap.get(post.author_id),
      })) as FeedPost[];
    },
    enabled: !!businessId,
  });

  // Create post mutation
  const createPost = useMutation({
    mutationFn: async (content: string) => {
      // Extract mentions from content (format: @[name](uuid))
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      const mentions: string[] = [];
      let match;
      while ((match = mentionRegex.exec(content)) !== null) {
        mentions.push(match[2]);
      }

      const { error } = await supabase.from("feed_posts").insert({
        business_id: businessId,
        author_id: userId,
        content,
        mentions,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewPost("");
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      toast.success("Post published");
    },
    onError: (error) => {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    },
  });

  // Delete post mutation
  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("feed_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      toast.success("Post deleted");
    },
    onError: (error) => {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    },
  });

  const handleSubmit = () => {
    if (!newPost.trim()) return;
    createPost.mutate(newPost);
  };

  const insertMention = (profile: Profile) => {
    const beforeCursor = newPost.slice(0, cursorPosition);
    const afterCursor = newPost.slice(cursorPosition);
    
    // Find the @ symbol position
    const lastAtIndex = beforeCursor.lastIndexOf("@");
    const textBeforeAt = beforeCursor.slice(0, lastAtIndex);
    
    const mentionText = `@[${profile.full_name}](${profile.id}) `;
    setNewPost(textBeforeAt + mentionText + afterCursor);
    setShowMentions(false);
    setMentionSearch("");
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setNewPost(value);
    setCursorPosition(position);

    // Check if user is typing a mention
    const textBeforeCursor = value.slice(0, position);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Show mentions if @ is at start or after a space, and no space after @
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " ";
      if ((charBeforeAt === " " || charBeforeAt === "\n" || lastAtIndex === 0) && !textAfterAt.includes(" ")) {
        setShowMentions(true);
        setMentionSearch(textAfterAt.toLowerCase());
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const filteredProfiles = teamProfiles.filter(
    (p) =>
      p.full_name.toLowerCase().includes(mentionSearch) &&
      p.id !== userId
  );

  const renderContent = (content: string) => {
    // Replace @[name](id) with styled mention
    const parts = content.split(/(@\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, index) => {
      const mentionMatch = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
      if (mentionMatch) {
        return (
          <Badge key={index} variant="secondary" className="mx-1 text-primary">
            @{mentionMatch[1]}
          </Badge>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="w-5 h-5 text-primary" />
          Team Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Post Input */}
        <div className="space-y-2 relative">
          <Textarea
            placeholder="Share an update with your team... Use @ to mention someone"
            value={newPost}
            onChange={handleTextChange}
            className="min-h-[80px] resize-none"
          />
          {showMentions && filteredProfiles.length > 0 && (
            <Card className="absolute z-50 w-full max-h-48 overflow-auto shadow-lg">
              <CardContent className="p-2">
                {filteredProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => insertMention(profile)}
                    className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted text-left"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{profile.full_name}</p>
                      {profile.position && (
                        <p className="text-xs text-muted-foreground">
                          {profile.position}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AtSign className="w-3 h-3" />
              Type @ to mention someone
            </p>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!newPost.trim() || createPost.isPending}
            >
              <Send className="w-4 h-4 mr-1" />
              Post
            </Button>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-3 max-h-[400px] overflow-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading posts...
            </p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No posts yet. Be the first to share an update!
            </p>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="p-3 rounded-lg bg-muted/50 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={post.author?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {post.author
                          ? getInitials(post.author.full_name)
                          : "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {post.author?.full_name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  {(post.author_id === userId || isAdmin) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deletePost.mutate(post.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">
                  {renderContent(post.content)}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Send, Trash2, AtSign, Users } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

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

interface Crew {
  id: string;
  name: string;
  memberIds: string[];
}

interface FeedPost {
  id: string;
  business_id: string;
  author_id: string;
  content: string;
  mentions: string[];
  crew_mentions: string[] | null;
  created_at: string;
  author?: Profile;
}

export function FeedWidget({ businessId, userId, isAdmin }: FeedWidgetProps) {
  const [newPost, setNewPost] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  // Fetch crews for team mentions
  const { data: crews = [] } = useQuery({
    queryKey: ["crews-for-mentions", businessId],
    queryFn: async () => {
      const { data: crewsData, error: crewsError } = await supabase
        .from("crews")
        .select("id, name")
        .eq("business_id", businessId)
        .order("name");
      if (crewsError) throw crewsError;

      // Get crew members for each crew
      const { data: membersData, error: membersError } = await supabase
        .from("crew_members")
        .select("crew_id, employee_id");
      if (membersError) throw membersError;

      // Map members to crews
      return (crewsData || []).map(crew => ({
        ...crew,
        memberIds: (membersData || [])
          .filter(m => m.crew_id === crew.id)
          .map(m => m.employee_id),
      })) as Crew[];
    },
    enabled: !!businessId,
  });

  // Get user's crew memberships
  const { data: userCrewIds = [] } = useQuery({
    queryKey: ["user-crew-memberships", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crew_members")
        .select("crew_id")
        .eq("employee_id", userId);
      if (error) throw error;
      return (data || []).map(m => m.crew_id);
    },
    enabled: !!userId,
  });

  // Fetch feed posts - filter by crew membership if post has crew_mentions
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["feed-posts", businessId, userId, userCrewIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_posts")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter posts: show if no crew_mentions OR user is in one of the mentioned crews OR user is author OR user is admin
      const filteredPosts = (data || []).filter(post => {
        const crewMentions = post.crew_mentions || [];
        if (crewMentions.length === 0) return true; // No crew restriction
        if (post.author_id === userId) return true; // Author can see their own post
        if (isAdmin) return true; // Admins see everything
        return crewMentions.some((crewId: string) => userCrewIds.includes(crewId));
      });

      // Fetch author profiles
      const authorIds = [...new Set(filteredPosts.map((p) => p.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, position")
        .in("id", authorIds.length > 0 ? authorIds : ['00000000-0000-0000-0000-000000000000']);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      
      return filteredPosts.map((post) => ({
        ...post,
        author: profileMap.get(post.author_id),
      })) as FeedPost[];
    },
    enabled: !!businessId,
  });

  // Create post mutation
  const createPost = useMutation({
    mutationFn: async (content: string) => {
      // Extract user mentions from content (format: @[name](uuid))
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      const mentions: string[] = [];
      const crewMentions: string[] = [];
      let match;
      while ((match = mentionRegex.exec(content)) !== null) {
        const id = match[2];
        // Check if it's a crew or person
        if (id.startsWith("crew:")) {
          crewMentions.push(id.replace("crew:", ""));
        } else {
          mentions.push(id);
        }
      }

      const { error } = await supabase.from("feed_posts").insert({
        business_id: businessId,
        author_id: userId,
        content,
        mentions,
        crew_mentions: crewMentions,
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

  const insertCrewMention = (crew: Crew) => {
    const beforeCursor = newPost.slice(0, cursorPosition);
    const afterCursor = newPost.slice(cursorPosition);
    
    // Find the @ symbol position
    const lastAtIndex = beforeCursor.lastIndexOf("@");
    const textBeforeAt = beforeCursor.slice(0, lastAtIndex);
    
    const mentionText = `@[${crew.name}](crew:${crew.id}) `;
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

  const filteredCrews = crews.filter(
    (c) => c.name.toLowerCase().includes(mentionSearch)
  );

  // Display content with styled mentions in textarea preview
  const getDisplayContent = (content: string) => {
    // Convert @[name](id) to just @name for display
    return content.replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1");
  };

  const renderContent = (content: string) => {
    // Replace @[name](id) with styled mention
    const parts = content.split(/(@\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, index) => {
      const mentionMatch = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
      if (mentionMatch) {
        const isCrewMention = mentionMatch[2].startsWith("crew:");
        return (
          <Badge 
            key={index} 
            variant="secondary" 
            className={isCrewMention ? "mx-1 text-primary bg-primary/10" : "mx-1 text-primary"}
          >
            {isCrewMention && <Users className="w-3 h-3 mr-1" />}
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
          {/* Editable area with hidden raw content */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder="Share an update with your team... Use @ to mention someone or a crew"
              value={getDisplayContent(newPost)}
              onChange={(e) => {
                // When user types, we need to sync with the actual stored content
                const displayValue = e.target.value;
                const position = e.target.selectionStart;
                
                // If the display content matches what we'd display from newPost, user is editing
                const currentDisplay = getDisplayContent(newPost);
                
                if (displayValue.length < currentDisplay.length) {
                  // User deleted something - find what mention was affected
                  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
                  let newContent = newPost;
                  let match;
                  let offset = 0;
                  
                  while ((match = mentionRegex.exec(newPost)) !== null) {
                    const displayStart = match.index - offset;
                    const displayMention = `@${match[1]}`;
                    const displayEnd = displayStart + displayMention.length;
                    
                    // Check if this mention was deleted in display
                    const beforeMention = getDisplayContent(newPost.slice(0, match.index));
                    const afterMention = getDisplayContent(newPost.slice(match.index + match[0].length));
                    const displayWithoutThisMention = beforeMention + afterMention;
                    
                    if (displayValue.length <= displayStart || 
                        !displayValue.includes(displayMention)) {
                      // This mention was deleted
                      newContent = newPost.slice(0, match.index) + newPost.slice(match.index + match[0].length);
                      break;
                    }
                    offset += match[0].length - displayMention.length;
                  }
                  setNewPost(newContent);
                  setCursorPosition(position);
                } else {
                  // User added text - update the raw content
                  handleTextChange(e as any);
                }
              }}
              onKeyUp={(e) => setCursorPosition(e.currentTarget.selectionStart)}
              onClick={(e) => setCursorPosition(e.currentTarget.selectionStart)}
              className="min-h-[80px] resize-none"
            />
          </div>
          
          {/* Mention suggestions dropdown */}
          {showMentions && (filteredProfiles.length > 0 || filteredCrews.length > 0) && (
            <Card className="absolute z-50 w-full max-h-48 overflow-auto shadow-lg">
              <CardContent className="p-2">
                {/* Crews section */}
                {filteredCrews.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Crews</p>
                    {filteredCrews.map((crew) => (
                      <button
                        key={crew.id}
                        onClick={() => insertCrewMention(crew)}
                        className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted text-left"
                      >
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-3 h-3 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{crew.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {crew.memberIds.length} members • Only visible to this crew
                          </p>
                        </div>
                      </button>
                    ))}
                  </>
                )}
                
                {/* People section */}
                {filteredProfiles.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground px-2 py-1 font-medium">People</p>
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
                  </>
                )}
              </CardContent>
            </Card>
          )}
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AtSign className="w-3 h-3" />
              Type @ to mention someone or a crew
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
            posts.map((post) => {
              const postCrewMentions = post.crew_mentions || [];
              const mentionedCrewNames = postCrewMentions
                .map(crewId => crews.find(c => c.id === crewId)?.name)
                .filter(Boolean);
              
              return (
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
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                          {mentionedCrewNames.length > 0 && (
                            <Badge variant="outline" className="text-xs py-0 px-1.5 h-4 gap-1">
                              <Users className="w-2.5 h-2.5" />
                              {mentionedCrewNames.join(", ")}
                            </Badge>
                          )}
                        </div>
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
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
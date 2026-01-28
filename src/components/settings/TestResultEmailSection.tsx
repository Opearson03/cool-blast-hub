import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Copy, Check, Loader2, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";

interface TestResultEmailSectionProps {
  businessId: string;
  currentAlias: string | null;
}

export function TestResultEmailSection({ businessId, currentAlias }: TestResultEmailSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newAlias, setNewAlias] = useState(currentAlias || "");
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const emailAddress = currentAlias ? `${currentAlias}@pourhub.au` : null;

  const updateAliasMutation = useMutation({
    mutationFn: async (alias: string) => {
      // Validate alias format
      const cleanAlias = alias.toLowerCase().trim();
      if (!/^[a-z0-9_-]+$/.test(cleanAlias)) {
        throw new Error("Alias can only contain lowercase letters, numbers, hyphens, and underscores");
      }
      if (cleanAlias.length < 3) {
        throw new Error("Alias must be at least 3 characters");
      }
      if (cleanAlias.length > 30) {
        throw new Error("Alias cannot exceed 30 characters");
      }

      const { error } = await supabase
        .from("businesses")
        .update({ inbound_email_alias: cleanAlias })
        .eq("id", businessId);

      if (error) {
        if (error.code === "23505") {
          throw new Error("This email alias is already taken");
        }
        throw error;
      }

      return cleanAlias;
    },
    onSuccess: (alias) => {
      toast.success("Email alias updated");
      setIsEditing(false);
      setNewAlias(alias);
      queryClient.invalidateQueries({ queryKey: ["business"] });
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleCopy = async () => {
    if (!emailAddress) return;
    
    try {
      await navigator.clipboard.writeText(emailAddress);
      setCopied(true);
      toast.success("Email copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleSave = () => {
    if (newAlias.trim()) {
      updateAliasMutation.mutate(newAlias.trim());
    }
  };

  const handleCancel = () => {
    setNewAlias(currentAlias || "");
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Test Result Email
        </CardTitle>
        <CardDescription>
          Share this email with your concrete testing lab. They can send test results directly to this address and they'll be automatically processed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {emailAddress && !isEditing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <div className="flex-1 font-mono text-sm break-all">
                {emailAddress}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                <Mail className="w-3 h-3 mr-1" />
                Auto-processes PDF attachments
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor="emailAlias">Email Alias</Label>
              <div className="flex items-center gap-1 mt-1">
                <Input
                  id="emailAlias"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value.toLowerCase())}
                  placeholder="e.g., mullinsconcrete"
                  className="font-mono"
                />
                <span className="text-muted-foreground whitespace-nowrap">@pourhub.au</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Only lowercase letters, numbers, hyphens, and underscores allowed
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleSave}
                disabled={!newAlias.trim() || updateAliasMutation.isPending}
                className="touch-target"
              >
                {updateAliasMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
              {currentAlias && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="touch-target"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <h4 className="text-sm font-medium mb-2">How it works:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Share your email address with your testing lab</li>
            <li>Lab sends test results (PDF) to your email</li>
            <li>AI automatically extracts test data from the PDF</li>
            <li>Review and approve results to link them to jobs</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

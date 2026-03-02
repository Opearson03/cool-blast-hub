import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Mail, Copy, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TestResultEmailSectionProps {
  businessId: string;
  currentAlias: string | null;
}

export function TestResultEmailSection({ businessId, currentAlias }: TestResultEmailSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const emailAddress = currentAlias ? `${currentAlias}@contact.pourhub.com.au` : null;

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

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <CardTitle className="text-base">Test Result Email</CardTitle>
              </div>
              <ChevronRight 
                className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-90"
                )} 
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <CardDescription>
              Share this email with your concrete testing lab. They can send test results directly to this address and they'll be automatically processed.
            </CardDescription>

            {emailAddress ? (
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
                
                <Badge variant="secondary" className="text-xs">
                  <Mail className="w-3 h-3 mr-1" />
                  Auto-processes PDF attachments
                </Badge>
              </div>
            ) : (
              <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                Email address will be generated automatically.
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
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

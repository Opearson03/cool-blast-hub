import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Unplug, RotateCcw, Copy, ChevronDown } from "lucide-react";
import { useXeroConnection } from "@/hooks/useXeroConnection";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function XeroIntegrationSettings() {
  const { connection, isLoading, isConnected, connect, isConnecting, disconnect, isDisconnecting, reset, isResetting } = useXeroConnection();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [lastError, setLastError] = useState<{ reason: string; details?: string } | null>(null);

  // Handle ?xero=connected or ?xero=error callback
  useEffect(() => {
    const xeroParam = searchParams.get("xero");
    if (xeroParam === "connected") {
      toast({ title: "Xero connected!", description: "Your Xero account is now linked." });
      setLastError(null);
      searchParams.delete("xero");
      setSearchParams(searchParams, { replace: true });
    } else if (xeroParam === "error") {
      const reason = searchParams.get("reason") || "Unknown error";
      const details = searchParams.get("details") || undefined;
      setLastError({ reason, details });
      toast({
        title: "Xero connection failed",
        description: `${reason.replace(/_/g, " ")}${details ? `: ${details}` : ""}`,
        variant: "destructive",
      });
      searchParams.delete("xero");
      searchParams.delete("reason");
      searchParams.delete("details");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  const handleCopyDebug = () => {
    const debugData = sessionStorage.getItem("xero_debug");
    const info = {
      lastError,
      oauthRequest: debugData ? JSON.parse(debugData) : null,
      timestamp: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(info, null, 2));
    toast({ title: "Debug info copied to clipboard" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Checking connection...</span>
      </div>
    );
  }

  if (isConnected && connection) {
    return (
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <img
            src="https://www.xero.com/etc/designs/xero-cms/clientlib/assets/img/xero-logo-hires-RGB.png"
            alt="Xero"
            className="h-6 w-auto"
          />
          <Badge variant="secondary" className="bg-green-500/20 text-green-600 border-green-500/30">
            Connected
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">{connection.xero_org_name || "Xero Organisation"}</p>
          <p className="text-xs text-muted-foreground">
            Connected {format(new Date(connection.created_at), "d MMM yyyy")}
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive" disabled={isDisconnecting}>
              {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unplug className="w-4 h-4" />}
              Disconnect
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Xero?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the connection to your Xero account. You can reconnect at any time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => disconnect()}
              >
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-3">
        <img
          src="https://www.xero.com/etc/designs/xero-cms/clientlib/assets/img/xero-logo-hires-RGB.png"
          alt="Xero"
          className="h-6 w-auto"
        />
        <span className="text-sm text-muted-foreground">Not connected</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Connect your Xero account to push quotes and variations as invoices, sync contacts, and track payment status.
      </p>

      {/* Last error display */}
      {lastError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
          <p className="text-sm font-medium text-destructive">
            Last error: {lastError.reason.replace(/_/g, " ")}
          </p>
          {lastError.details && (
            <p className="text-xs text-muted-foreground">{lastError.details}</p>
          )}
          <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs" onClick={handleCopyDebug}>
            <Copy className="w-3 h-3" />
            Copy debug info
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button onClick={() => connect("full")} disabled={isConnecting || isResetting} className="gap-2 touch-target">
          {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Connect to Xero
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5" disabled={isResetting || isConnecting}>
              {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Reset
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => reset("full")}>
              Reset & reconnect (full scopes)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => reset("minimal")}>
              Reset & reconnect (minimal scopes)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

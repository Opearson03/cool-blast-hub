import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Unplug } from "lucide-react";
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

export function XeroIntegrationSettings() {
  const { connection, isLoading, isConnected, connect, isConnecting, disconnect, isDisconnecting } = useXeroConnection();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle ?xero=connected callback
  useEffect(() => {
    const xeroParam = searchParams.get("xero");
    if (xeroParam === "connected") {
      toast({ title: "Xero connected!", description: "Your Xero account is now linked." });
      searchParams.delete("xero");
      setSearchParams(searchParams, { replace: true });
    } else if (xeroParam === "error") {
      const reason = searchParams.get("reason") || "Unknown error";
      toast({
        title: "Xero connection failed",
        description: reason.replace(/_/g, " "),
        variant: "destructive",
      });
      searchParams.delete("xero");
      searchParams.delete("reason");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

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
      <Button onClick={() => connect()} disabled={isConnecting} className="gap-2 touch-target">
        {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Connect to Xero
      </Button>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertCircle, FileText, MapPin, DollarSign, Clock, Briefcase } from "lucide-react";
import { toast } from "sonner";

interface VariationItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

interface VariationData {
  variationNumber: string;
  description: string;
  reason: string | null;
  items: VariationItem[];
  amount: number;
  daysExtension: number;
  notes: string | null;
  job: {
    name: string;
    jobNumber: string | null;
    siteAddress: string;
    clientName: string | null;
  };
  business: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    font: string;
  };
}

const reasonLabels: Record<string, string> = {
  client_request: "Client Request",
  site_conditions: "Unforeseen Site Conditions",
  design_change: "Design Change",
  scope_change: "Scope Change",
  other: "Other"
};

export default function SignVariation() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [variationData, setVariationData] = useState<VariationData | null>(null);
  const [signerName, setSignerName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [variationData]);

  const validateToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("validate-signing-token", {
        body: { type: "variation", token }
      });

      if (error) throw error;

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.valid && data.data) {
        setVariationData(data.data);
        setSignerName(data.data.job?.clientName || "");
      }
    } catch (err) {
      console.error("Validation error:", err);
      setError("Failed to load variation. Please try again or contact the business.");
    } finally {
      setLoading(false);
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!hasSignature || !signerName.trim() || !termsAccepted) {
      toast.error("Please complete all required fields");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setSubmitting(true);

    try {
      const signatureData = canvas.toDataURL("image/png");

      const { data, error } = await supabase.functions.invoke("submit-signature", {
        body: {
          type: "variation",
          token,
          signature: signatureData,
          signerName: signerName.trim()
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Failed to submit signature. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading variation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Variation</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Variation Approved!</h2>
            <p className="text-muted-foreground mb-4">
              Thank you for approving this variation. {variationData?.business.name} has been notified.
            </p>
            <p className="text-sm text-muted-foreground">
              Variation #{variationData?.variationNumber}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!variationData) return null;

  const primaryColor = variationData.business.primaryColor;
  const items = variationData.items || [];
  const subtotal = variationData.amount;
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center border-b">
            {variationData.business.logoUrl ? (
              <img 
                src={variationData.business.logoUrl} 
                alt={variationData.business.name}
                className="h-16 w-auto mx-auto object-contain mb-2"
              />
            ) : (
              <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
                {variationData.business.name}
              </h1>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Variation #{variationData.variationNumber}
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Job</p>
                  <p className="text-muted-foreground">
                    {variationData.job.name}
                    {variationData.job.jobNumber && ` (${variationData.job.jobNumber})`}
                  </p>
                </div>
              </div>

              {variationData.job.clientName && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Client</p>
                    <p className="text-muted-foreground">{variationData.job.clientName}</p>
                  </div>
                </div>
              )}
              
              {variationData.job.siteAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Site Address</p>
                    <p className="text-muted-foreground">{variationData.job.siteAddress}</p>
                  </div>
                </div>
              )}

              {variationData.reason && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Reason</p>
                    <p className="text-muted-foreground">
                      {reasonLabels[variationData.reason] || variationData.reason}
                    </p>
                  </div>
                </div>
              )}

              {variationData.daysExtension > 0 && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Time Extension</p>
                    <p className="text-muted-foreground">{variationData.daysExtension} day(s)</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                {variationData.description}
              </p>
            </div>

            {/* Cost Breakdown */}
            {items.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-4">Cost Breakdown</h3>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.description} ({item.quantity} {item.unit} × {formatCurrency(item.unit_price)})
                      </span>
                      <span>{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="mt-6 pt-6 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST (10%)</span>
                <span>{formatCurrency(gst)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total (inc. GST)</span>
                <span style={{ color: primaryColor }}>{formatCurrency(total)}</span>
              </div>
            </div>

            {variationData.notes && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-2">Notes</h3>
                <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                  {variationData.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signature Section */}
        <Card>
          <CardHeader>
            <CardTitle>Approve & Sign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="signerName">Full Name *</Label>
              <Input
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Enter your full name"
                className="mt-1.5"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Signature *</Label>
                {hasSignature && (
                  <Button variant="ghost" size="sm" onClick={clearSignature}>
                    Clear
                  </Button>
                )}
              </div>
              <div className="border-2 border-dashed rounded-lg bg-white">
                <canvas
                  ref={canvasRef}
                  className="w-full h-40 touch-none cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Draw your signature above using mouse or touch
              </p>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                I approve this variation to the original contract. I understand this constitutes a binding agreement and authorises the additional works described above.
              </Label>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting || !hasSignature || !signerName.trim() || !termsAccepted}
              style={{ backgroundColor: primaryColor }}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Approve & Sign Variation"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Powered by PourHub
        </p>
      </div>
    </div>
  );
}

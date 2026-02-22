import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertCircle, FileText, MapPin, DollarSign, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

interface QuoteData {
  estimateNumber: string;
  clientName: string;
  siteAddress: string;
  description: string;
  totalAmount: number;
  notes: string | null;
  validUntil: string | null;
  quotePurpose?: "new_job" | "variation";
  targetJobName?: string | null;
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

export default function SignQuote() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
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

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Set drawing style
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Fill white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [quoteData]);

  const validateToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("validate-signing-token", {
        body: { type: "quote", token }
      });

      if (error) throw error;

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.valid && data.data) {
        setQuoteData(data.data);
        setSignerName(data.data.clientName || "");
      }
    } catch (err) {
      console.error("Validation error:", err);
      setError("Failed to load quote. Please try again or contact the business.");
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
          type: "quote",
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
          <p className="mt-4 text-muted-foreground">Loading quote...</p>
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
            <h2 className="text-xl font-semibold mb-2">Unable to Load Quote</h2>
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
            <h2 className="text-2xl font-semibold mb-2">Quote Accepted!</h2>
            <p className="text-muted-foreground mb-4">
              Thank you for accepting this quote. {quoteData?.business.name} has been notified and will be in touch shortly.
            </p>
            <p className="text-sm text-muted-foreground">
              Quote #{quoteData?.estimateNumber}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quoteData) return null;

  const primaryColor = quoteData.business.primaryColor;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center border-b">
            {quoteData.business.logoUrl ? (
              <img 
                src={quoteData.business.logoUrl} 
                alt={quoteData.business.name}
                className="h-16 w-auto mx-auto object-contain mb-2"
              />
            ) : (
              <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
                {quoteData.business.name}
              </h1>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {quoteData.quotePurpose === "variation" && quoteData.targetJobName ? (
                <>
                  <span className="inline-block bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded mr-2">Variation</span>
                  for {quoteData.targetJobName} — Quote #{quoteData.estimateNumber}
                </>
              ) : (
                <>Quote #{quoteData.estimateNumber}</>
              )}
            </p>
            
            {/* Business Contact Details */}
            {(quoteData.business.address || quoteData.business.phone || quoteData.business.email) && (
              <div className="mt-4 pt-4 border-t space-y-1.5 text-sm text-muted-foreground">
                {quoteData.business.address && (
                  <p>{quoteData.business.address}</p>
                )}
                {quoteData.business.phone && (
                  <p className="flex items-center justify-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {quoteData.business.phone}
                  </p>
                )}
                {quoteData.business.email && (
                  <p className="flex items-center justify-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {quoteData.business.email}
                  </p>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Client</p>
                  <p className="text-muted-foreground">{quoteData.clientName}</p>
                </div>
              </div>
              
              {quoteData.siteAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Site Address</p>
                    <p className="text-muted-foreground">{quoteData.siteAddress}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Total Amount (inc. GST)</p>
                  <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                    {formatCurrency(quoteData.totalAmount)}
                  </p>
                </div>
              </div>
            </div>

            {quoteData.description && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-2">Scope of Works</h3>
                <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                  {quoteData.description}
                </p>
              </div>
            )}

            {quoteData.notes && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-medium mb-2">Terms & Conditions</h3>
                <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                  {quoteData.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signature Section */}
        <Card>
          <CardHeader>
            <CardTitle>Accept & Sign</CardTitle>
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
                I accept this quote and agree to proceed with the works as described above. I understand this constitutes a binding agreement.
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
                "Accept & Sign Quote"
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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAbnVerification } from "@/hooks/useAbnVerification";
import { Logo } from "@/components/ui/Logo";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Upload,
} from "lucide-react";

const TRADE_OPTIONS = [
  "Concreter",
  "Steel Fixer",
  "Formworker",
  "Pump Operator",
  "Excavation",
  "Labourer",
];

export default function SubcontractorSignup() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();
  const abnVerification = useAbnVerification();

  // Step 1: Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Step 2: ABN
  const [abn, setAbn] = useState("");
  const [abnData, setAbnData] = useState<any>(null);

  // Step 3: Profile
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [tradeTypes, setTradeTypes] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState("");
  const [serviceRadius, setServiceRadius] = useState("");
  const [basePostcode, setBasePostcode] = useState("");
  const [bio, setBio] = useState("");

  // Step 4: Files
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // White Card
  const [hasWhiteCard, setHasWhiteCard] = useState(false);
  const [whiteCardNumber, setWhiteCardNumber] = useState("");
  const [whiteCardFile, setWhiteCardFile] = useState<File | null>(null);

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        setEmail(session.user.email || "");
        // Check if already a subcontractor
        const { data: isSub } = await supabase.rpc("is_subcontractor" as any, {
          _user_id: session.user.id,
        });
        if (isSub) {
          navigate("/sub-contractors/dashboard");
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, signup_type: "subcontractor" },
          emailRedirectTo: window.location.origin + "/sub-contractors/signup",
        },
      });

      if (error) throw error;

      if (data.user) {
        setUserId(data.user.id);

        // Assign subcontractor role
        const supabaseAdmin = supabase;
        await supabaseAdmin.from("user_roles" as any).insert({
          user_id: data.user.id,
          role: "subcontractor",
        });

        setStep(2);
        toast({ title: "Account created!", description: "Now let's verify your ABN." });
      }
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleVerifyAbn = async () => {
    abnVerification.mutate(abn, {
      onSuccess: (data) => {
        if (data.valid) {
          setAbnData(data);
          toast({ title: "ABN Verified!", description: `${data.legal_name}` });
        } else {
          setAbnData(null);
          toast({
            title: "ABN Invalid",
            description: data.error_message || "Could not verify ABN",
            variant: "destructive",
          });
        }
      },
      onError: (error: any) => {
        toast({
          title: "Verification Failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleTradeToggle = (trade: string) => {
    setTradeTypes((prev) =>
      prev.includes(trade) ? prev.filter((t) => t !== trade) : [...prev, trade]
    );
  };

  const handleSubmitProfile = async () => {
    if (!userId) return;
    setIsSubmitting(true);

    try {
      let insuranceUrl = null;
      let photoUrl = null;
      let whiteCardDocUrl = null;

      // Upload insurance certificate
      if (insuranceFile) {
        const ext = insuranceFile.name.split(".").pop();
        const path = `${userId}/insurance.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("subcontractor-documents")
          .upload(path, insuranceFile, { upsert: true });
        if (uploadError) throw uploadError;
        insuranceUrl = path;
      }

      // Upload profile photo
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `${userId}/photo.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("subcontractor-photos")
          .upload(path, photoFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage
          .from("subcontractor-photos")
          .getPublicUrl(path);
        photoUrl = publicUrlData.publicUrl;
      }

      // Upload white card document
      if (hasWhiteCard && whiteCardFile) {
        const ext = whiteCardFile.name.split(".").pop();
        const path = `${userId}/whitecard.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("subcontractor-documents")
          .upload(path, whiteCardFile, { upsert: true });
        if (uploadError) throw uploadError;
        whiteCardDocUrl = path;
      }

      // Create profile
      const { error } = await supabase
        .from("subcontractor_directory_profiles" as any)
        .insert({
          user_id: userId,
          first_name: firstName || fullName.split(" ")[0] || null,
          last_name: lastName || fullName.split(" ").slice(1).join(" ") || null,
          phone,
          email,
          abn: abn.replace(/\s/g, ""),
          legal_name: abnData?.legal_name || null,
          gst_registered: abnData?.gst_registered || false,
          entity_type: abnData?.entity_type || null,
          abn_verified: !!abnData?.valid,
          trade_types: tradeTypes,
          years_experience: yearsExperience ? parseInt(yearsExperience) : null,
          service_radius_km: serviceRadius ? parseInt(serviceRadius) : null,
          base_postcode: basePostcode || null,
          insurance_certificate_url: insuranceUrl,
          profile_photo_url: photoUrl,
          bio: bio || null,
          availability_status: "available",
          has_white_card: hasWhiteCard,
          white_card_number: hasWhiteCard ? whiteCardNumber || null : null,
          white_card_document_url: whiteCardDocUrl,
        });

      if (error) throw error;

      toast({ title: "Profile Created!", description: "Welcome to PourHub." });
      navigate("/sub-contractors/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not save profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepProgress = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <span className="text-sm text-muted-foreground font-medium">Create Profile</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <Progress value={stepProgress} className="mb-8" />
        <p className="text-sm text-muted-foreground text-center mb-6">Step {step} of 4</p>

        {/* Step 1: Account */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Create Your Account</CardTitle>
              <CardDescription>Enter your details to get started.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Smith"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@business.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSigningUp}>
                  {isSigningUp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/sub-contractors")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: ABN Verification */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Verify Your ABN
              </CardTitle>
              <CardDescription>
                We'll verify your ABN against the Australian Business Register.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="abn-input">Australian Business Number (ABN)</Label>
                <div className="flex gap-2">
                  <Input
                    id="abn-input"
                    value={abn}
                    onChange={(e) => setAbn(e.target.value)}
                    placeholder="XX XXX XXX XXX"
                    maxLength={14}
                  />
                  <Button
                    onClick={handleVerifyAbn}
                    disabled={abnVerification.isPending || abn.replace(/\s/g, "").length !== 11}
                  >
                    {abnVerification.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
              </div>

              {abnData && abnData.valid && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <CheckCircle2 className="h-5 w-5" />
                    ABN Verified
                  </div>
                  <div className="grid gap-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Legal Name: </span>
                      <span className="font-medium text-foreground">{abnData.legal_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ABN Status: </span>
                      <span className="font-medium text-foreground">{abnData.abn_status}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">GST Registered: </span>
                      <span className="font-medium text-foreground">
                        {abnData.gst_registered ? "Yes" : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Entity Type: </span>
                      <span className="font-medium text-foreground">{abnData.entity_type}</span>
                    </div>
                  </div>
                </div>
              )}

              {abnVerification.isError && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <span className="text-sm">Failed to verify. Please try again.</span>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setStep(3)}
                  disabled={!abnData?.valid}
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Profile Details */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Tell us about your trade and experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="04XX XXX XXX"
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <Label>Trade Types</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TRADE_OPTIONS.map((trade) => (
                    <label
                      key={trade}
                      className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-accent/50"
                    >
                      <Checkbox
                        checked={tradeTypes.includes(trade)}
                        onCheckedChange={() => handleTradeToggle(trade)}
                      />
                      <span className="text-sm">{trade}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Years Experience</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    placeholder="e.g. 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Service Radius (km)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={serviceRadius}
                    onChange={(e) => setServiceRadius(e.target.value)}
                    placeholder="e.g. 50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Base Postcode</Label>
                <Input
                  value={basePostcode}
                  onChange={(e) => setBasePostcode(e.target.value)}
                  placeholder="e.g. 2000"
                  maxLength={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Short Bio</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell builders about your experience and what you specialise in..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(4)}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: File Uploads */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>
                Add your insurance certificate, profile photo, and white card details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Photo */}
              <div className="space-y-2">
                <Label>Profile Photo</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {photoFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={URL.createObjectURL(photoFile)}
                        alt="Preview"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-primary">{photoFile.name}</span>
                    </div>
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  )}
                  <Input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="mt-2"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              {/* Insurance Certificate */}
              <div className="space-y-2">
                <Label>Insurance Certificate (PDF or Image)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {insuranceFile ? (
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">{insuranceFile.name}</span>
                    </div>
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  )}
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="mt-2"
                    onChange={(e) => setInsuranceFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              {/* White Card */}
              <div className="space-y-4 border rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={hasWhiteCard}
                    onCheckedChange={(checked) => setHasWhiteCard(checked === true)}
                  />
                  <div>
                    <span className="font-medium text-sm">I hold a Construction White Card</span>
                    <p className="text-xs text-muted-foreground">Required for most construction sites in Australia</p>
                  </div>
                </label>

                {hasWhiteCard && (
                  <div className="space-y-4 pt-2 border-t">
                    <div className="space-y-2">
                      <Label>White Card Number</Label>
                      <Input
                        value={whiteCardNumber}
                        onChange={(e) => setWhiteCardNumber(e.target.value)}
                        placeholder="Enter your white card number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Upload White Card Photo or USI Transcript</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        {whiteCardFile ? (
                          <div className="flex items-center justify-center gap-2 text-primary">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="text-sm font-medium">{whiteCardFile.name}</span>
                          </div>
                        ) : (
                          <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                        )}
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="mt-2"
                          onChange={(e) => setWhiteCardFile(e.target.files?.[0] || null)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Upload one of: White Card photo or USI Transcript</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmitProfile}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Complete Profile <CheckCircle2 className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

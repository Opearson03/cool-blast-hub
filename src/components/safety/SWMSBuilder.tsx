import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { HighRiskWorkSelector } from "./HighRiskWorkSelector";
import { HazardRow } from "./HazardRow";
import { RiskMatrix } from "./RiskMatrix";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

interface SWMSBuilderProps {
  onClose: () => void;
}

export function SWMSBuilder({ onClose }: SWMSBuilderProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [jobs, setJobs] = useState<any[]>([]);
  const [currentRiskSelection, setCurrentRiskSelection] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    job_id: "",
    work_description: "",
    location: "",
    principal_contractor: "",
    subcontractor: "",
    valid_from: new Date().toISOString().split("T")[0],
    valid_to: "",
    review_date: "",
    high_risk_work_types: [] as string[],
  });

  const [hazards, setHazards] = useState([
    {
      step_number: 1,
      work_activity: "",
      hazard: "",
      potential_harm: "",
      likelihood: "",
      consequence: "",
      initial_risk_rating: "",
      elimination_controls: "",
      substitution_controls: "",
      engineering_controls: "",
      administrative_controls: "",
      ppe_required: "",
      residual_risk_rating: "",
      responsible_person: "",
    },
  ]);

  const [emergencyProcedures, setEmergencyProcedures] = useState([
    {
      emergency_type: "injury",
      procedure: "",
      emergency_contacts: "",
      assembly_point: "",
    },
  ]);

  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [selectedSigners, setSelectedSigners] = useState<string[]>([]);

  useEffect(() => {
    fetchJobs();
    fetchStaffMembers();
  }, []);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("id, job_number, title")
      .order("created_at", { ascending: false });
    setJobs(data || []);
  };

  const fetchStaffMembers = async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "staff");

    if (!roles) return;

    const staffIds = roles.map(r => r.user_id);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", staffIds);

    setStaffMembers(data || []);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleHazardChange = (index: number, field: string, value: any) => {
    const updated = [...hazards];
    updated[index] = { ...updated[index], [field]: value };
    setHazards(updated);
  };

  const handleRiskSelect = (index: number, likelihood: string, consequence: string) => {
    const likelihoodMap: any = { rare: 1, unlikely: 2, possible: 3, likely: 4, almost_certain: 5 };
    const consequenceMap: any = { insignificant: 1, minor: 2, moderate: 3, major: 4, catastrophic: 5 };
    const score = likelihoodMap[likelihood] * consequenceMap[consequence];
    
    let rating = "Low";
    if (score > 15) rating = "Extreme";
    else if (score > 8) rating = "High";
    else if (score > 4) rating = "Medium";

    handleHazardChange(index, "likelihood", likelihood);
    handleHazardChange(index, "consequence", consequence);
    handleHazardChange(index, "initial_risk_rating", rating);
  };

  const addHazard = () => {
    setHazards([
      ...hazards,
      {
        step_number: hazards.length + 1,
        work_activity: "",
        hazard: "",
        potential_harm: "",
        likelihood: "",
        consequence: "",
        initial_risk_rating: "",
        elimination_controls: "",
        substitution_controls: "",
        engineering_controls: "",
        administrative_controls: "",
        ppe_required: "",
        residual_risk_rating: "",
        responsible_person: "",
      },
    ]);
  };

  const deleteHazard = (index: number) => {
    const updated = hazards.filter((_, i) => i !== index);
    updated.forEach((h, i) => (h.step_number = i + 1));
    setHazards(updated);
  };

  const handleSave = async () => {
    try {
      // Validate all hazards have risk ratings
      const incompleteHazards = hazards.filter(
        h => !h.likelihood || !h.consequence || !h.work_activity || !h.hazard || !h.potential_harm || !h.responsible_person
      );
      
      if (incompleteHazards.length > 0) {
        toast({ 
          title: "Incomplete Hazards", 
          description: "Please complete all required fields and select risk ratings for all hazards", 
          variant: "destructive" 
        });
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
        return;
      }

      // Insert SWMS document
      const { data: swmsDoc, error: swmsError } = await supabase
        .from("swms_documents")
        .insert({
          ...formData,
          prepared_by: session.session.user.id,
          swms_number: "", // Will be auto-generated by trigger
        })
        .select()
        .single();

      if (swmsError) throw swmsError;

      // Insert hazards
      const hazardsToInsert = hazards.map((h) => ({
        ...h,
        swms_id: swmsDoc.id,
      }));
      const { error: hazardsError } = await supabase.from("swms_hazards").insert(hazardsToInsert);
      if (hazardsError) throw hazardsError;

      // Insert emergency procedures
      const proceduresToInsert = emergencyProcedures.map((p) => ({
        ...p,
        swms_id: swmsDoc.id,
      }));
      const { error: proceduresError } = await supabase
        .from("swms_emergency_procedures")
        .insert(proceduresToInsert);
      if (proceduresError) throw proceduresError;

      // Insert required signers
      if (selectedSigners.length > 0) {
        const signersToInsert = selectedSigners.map((staffId) => ({
          swms_id: swmsDoc.id,
          staff_id: staffId,
          signer_name: staffMembers.find(s => s.id === staffId)?.full_name || "Unknown",
          signer_role: "Staff",
          acknowledged: false,
        }));
        const { error: signersError } = await supabase
          .from("swms_signoffs")
          .insert(signersToInsert);
        if (signersError) throw signersError;
      }

      toast({
        title: "Success",
        description: "SWMS document created successfully",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1: Project Details</h3>
            <div>
              <Label htmlFor="title">SWMS Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g., Installation of Steel Framework at Heights"
              />
            </div>
            <div>
              <Label htmlFor="job">Link to Job (Optional)</Label>
              <select
                id="job"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.job_id}
                onChange={(e) => handleChange("job_id", e.target.value)}
              >
                <option value="">Select a job</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.job_number} - {job.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="work_description">Work Description</Label>
              <Textarea
                id="work_description"
                value={formData.work_description}
                onChange={(e) => handleChange("work_description", e.target.value)}
                placeholder="Detailed description of the work to be performed"
              />
            </div>
            <div>
              <Label htmlFor="location">Location/Site Address</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="principal_contractor">Principal Contractor</Label>
                <Input
                  id="principal_contractor"
                  value={formData.principal_contractor}
                  onChange={(e) => handleChange("principal_contractor", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="subcontractor">Subcontractor (if applicable)</Label>
                <Input
                  id="subcontractor"
                  value={formData.subcontractor}
                  onChange={(e) => handleChange("subcontractor", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="valid_from">Valid From</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => handleChange("valid_from", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="valid_to">Valid To (Optional)</Label>
                <Input
                  id="valid_to"
                  type="date"
                  value={formData.valid_to}
                  onChange={(e) => handleChange("valid_to", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="review_date">Review Date</Label>
                <Input
                  id="review_date"
                  type="date"
                  value={formData.review_date}
                  onChange={(e) => handleChange("review_date", e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">Step 2: High-Risk Work Categories</h3>
            <HighRiskWorkSelector
              selectedCategories={formData.high_risk_work_types}
              onChange={(categories) => handleChange("high_risk_work_types", categories)}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 3: Hazard Identification & Risk Assessment</h3>
            {hazards.map((hazard, index) => (
              <div key={index} className="space-y-4">
                <HazardRow
                  hazard={hazard}
                  index={index}
                  onChange={handleHazardChange}
                  onDelete={deleteHazard}
                />
                {currentRiskSelection === index && (
                  <RiskMatrix
                    likelihood={hazard.likelihood}
                    consequence={hazard.consequence}
                    onSelect={(l, c) => {
                      handleRiskSelect(index, l, c);
                      setCurrentRiskSelection(null);
                    }}
                  />
                )}
                {!hazard.likelihood && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentRiskSelection(index)}
                  >
                    Select Risk Rating
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" onClick={addHazard} variant="secondary">
              Add Another Hazard/Step
            </Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 4: Required Signers</h3>
            <p className="text-sm text-muted-foreground">
              Select staff members who must sign and acknowledge this SWMS before starting work
            </p>
            <div className="border rounded-lg p-4 space-y-2">
              {staffMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No staff members available</p>
              ) : (
                staffMembers.map((member) => (
                  <label key={member.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSigners.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSigners([...selectedSigners, member.id]);
                        } else {
                          setSelectedSigners(selectedSigners.filter(id => id !== member.id));
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{member.full_name}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 5: Emergency Procedures</h3>
            <div>
              <Label htmlFor="emergency_procedure">Emergency Response Procedure</Label>
              <Textarea
                id="emergency_procedure"
                value={emergencyProcedures[0].procedure}
                onChange={(e) => {
                  const updated = [...emergencyProcedures];
                  updated[0].procedure = e.target.value;
                  setEmergencyProcedures(updated);
                }}
                placeholder="Describe emergency procedures including first aid, evacuation, and incident reporting"
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor="emergency_contacts">Emergency Contacts</Label>
              <Textarea
                id="emergency_contacts"
                value={emergencyProcedures[0].emergency_contacts}
                onChange={(e) => {
                  const updated = [...emergencyProcedures];
                  updated[0].emergency_contacts = e.target.value;
                  setEmergencyProcedures(updated);
                }}
                placeholder="List emergency contact numbers (000, site supervisor, safety officer)"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="assembly_point">Assembly Point</Label>
              <Input
                id="assembly_point"
                value={emergencyProcedures[0].assembly_point}
                onChange={(e) => {
                  const updated = [...emergencyProcedures];
                  updated[0].assembly_point = e.target.value;
                  setEmergencyProcedures(updated);
                }}
                placeholder="Location of emergency assembly point"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">Step {step} of 5</div>
        <div className="flex gap-2">
          <div className={`h-2 w-12 rounded ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
          <div className={`h-2 w-12 rounded ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          <div className={`h-2 w-12 rounded ${step >= 3 ? "bg-primary" : "bg-muted"}`} />
          <div className={`h-2 w-12 rounded ${step >= 4 ? "bg-primary" : "bg-muted"}`} />
          <div className={`h-2 w-12 rounded ${step >= 5 ? "bg-primary" : "bg-muted"}`} />
        </div>
      </div>

      {renderStep()}

      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        {step < 5 ? (
          <Button onClick={() => setStep(step + 1)}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save SWMS
          </Button>
        )}
      </div>
    </div>
  );
}

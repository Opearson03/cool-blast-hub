import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ClientDetailsSectionProps {
  clientName: string;
  setClientName: (v: string) => void;
  businessName: string;
  setBusinessName: (v: string) => void;
  clientEmail: string;
  setClientEmail: (v: string) => void;
  clientPhone: string;
  setClientPhone: (v: string) => void;
  teamSize: string;
  setTeamSize: (v: string) => void;
  crewCount: string;
  setCrewCount: (v: string) => void;
  concurrentJobs: string;
  setConcurrentJobs: (v: string) => void;
  region: string;
  setRegion: (v: string) => void;
  meetingNotes: string;
  setMeetingNotes: (v: string) => void;
}

export function ClientDetailsSection(props: ClientDetailsSectionProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Contact name *</Label>
          <Input
            value={props.clientName}
            onChange={(e) => props.setClientName(e.target.value)}
            placeholder="John Smith"
          />
        </div>
        <div>
          <Label>Business name</Label>
          <Input
            value={props.businessName}
            onChange={(e) => props.setBusinessName(e.target.value)}
            placeholder="Smith Concreting"
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={props.clientEmail}
            onChange={(e) => props.setClientEmail(e.target.value)}
          />
        </div>
        <div>
          <Label>Phone</Label>
          <Input
            value={props.clientPhone}
            onChange={(e) => props.setClientPhone(e.target.value)}
          />
        </div>
        <div>
          <Label>Est. team size</Label>
          <Input
            type="number"
            value={props.teamSize}
            onChange={(e) => props.setTeamSize(e.target.value)}
            placeholder="50"
          />
        </div>
        <div>
          <Label># of crews</Label>
          <Input
            type="number"
            value={props.crewCount}
            onChange={(e) => props.setCrewCount(e.target.value)}
            placeholder="6"
          />
        </div>
        <div>
          <Label># of concurrent jobs</Label>
          <Input
            type="number"
            value={props.concurrentJobs}
            onChange={(e) => props.setConcurrentJobs(e.target.value)}
            placeholder="12"
          />
        </div>
        <div>
          <Label>Region</Label>
          <Input
            value={props.region}
            onChange={(e) => props.setRegion(e.target.value)}
            placeholder="NSW / VIC / Multi-state"
          />
        </div>
      </div>
      <div>
        <Label>Meeting notes</Label>
        <Textarea
          value={props.meetingNotes}
          onChange={(e) => props.setMeetingNotes(e.target.value)}
          rows={3}
          placeholder="Key discussion points, pain points, decision makers..."
        />
      </div>
    </div>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCircle, Layers, Ruler, Calculator, Percent, Send } from "lucide-react";

interface FirstQuoteGuideProps {
  open: boolean;
  onStart: () => void;
  onSkip: () => void;
}

const STEPS = [
  {
    icon: UserCircle,
    title: "Client Details",
    description: "Enter your client's name and the site address",
  },
  {
    icon: Layers,
    title: "Select Scope",
    description: "Choose the type of work — driveway, slab, etc.",
  },
  {
    icon: Ruler,
    title: "Plan Takeoff",
    description: "Upload plans and measure from PDF (optional)",
  },
  {
    icon: Calculator,
    title: "Configure Costs",
    description: "Fill in quantities — the calculator does the rest",
  },
  {
    icon: Percent,
    title: "Margin & Conditions",
    description: "Set your markup and payment terms",
  },
  {
    icon: Send,
    title: "Review & Send",
    description: "Preview the PDF and send it to your client",
  },
];

export function FirstQuoteGuide({ open, onStart, onSkip }: FirstQuoteGuideProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">Let's create your first quote!</DialogTitle>
          <DialogDescription>
            We'll walk you through it step by step. It only takes a few minutes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 my-2">
          {STEPS.map((step, index) => (
            <div key={step.title} className="flex items-start gap-3 p-2 rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0 text-sm font-semibold">
                {index + 1}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={onStart} className="w-full">
            Create My First Quote
          </Button>
          <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground">
            Skip, I'll explore first
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

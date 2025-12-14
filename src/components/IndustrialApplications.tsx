import { Card } from "@/components/ui/card";
import { Factory, Wrench, Zap, Shield, Leaf, Clock } from "lucide-react";

const applications = [
  {
    icon: Factory,
    title: "Heavy Machinery",
    description: "Remove grease, oil, and contaminants from manufacturing equipment without disassembly"
  },
  {
    icon: Wrench,
    title: "Maintenance",
    description: "Reduce downtime with non-conductive, non-abrasive cleaning that leaves no residue"
  },
  {
    icon: Zap,
    title: "Electrical Equipment",
    description: "Safely clean sensitive electrical components and control panels without damage"
  },
  {
    icon: Shield,
    title: "Food Processing",
    description: "FDA approved cleaning method ideal for food manufacturing environments"
  },
  {
    icon: Leaf,
    title: "Environmentally Safe",
    description: "No secondary waste, no chemicals, completely sustainable cleaning solution"
  },
  {
    icon: Clock,
    title: "Fast Turnaround",
    description: "Clean equipment in place, reducing downtime and increasing productivity"
  }
];

export const IndustrialApplications = () => {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black mb-4 tracking-tight">
            INDUSTRIAL <span className="text-primary">POWER</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Trusted by heavy industry across the Hunter Valley and beyond. Our dry ice blasting technology delivers superior cleaning results without chemicals, abrasives, or secondary waste.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app, index) => (
            <Card 
              key={index}
              className="bg-card border-border p-6 hover:border-primary transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <app.icon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{app.title}</h3>
                  <p className="text-muted-foreground">{app.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 p-8 bg-secondary rounded-lg border border-border">
          <h3 className="text-3xl font-bold mb-4 text-center">Cold Jet Technology</h3>
          <p className="text-muted-foreground text-center max-w-3xl mx-auto">
            We use Cold Jet equipment, the global leader in dry ice blasting technology. Our systems deliver precision cleaning with adjustable pressure and flow rates, suitable for everything from delicate electronics to heavy industrial equipment.
          </p>
        </div>
      </div>
    </section>
  );
};

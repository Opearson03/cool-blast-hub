import { Button } from "@/components/ui/button";
import automotiveImage from "@/assets/automotive-cleaning.jpg";
import { Car, Sparkles, CheckCircle } from "lucide-react";

const benefits = [
  "Remove undercarriage rust and grime",
  "Clean engine bays without water",
  "Restore vintage car components",
  "Prepare surfaces for painting",
  "Clean wheels and brake components",
  "Detail hard-to-reach areas"
];

export const AutomotiveSection = () => {
  const scrollToBooking = () => {
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-20 px-4 bg-darker-bg">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="flex items-center gap-3 mb-6">
              <Car className="h-10 w-10 text-primary" />
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">
              AUTOMOTIVE & <span className="text-primary">4WD</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Perfect for car enthusiasts, restoration projects, and 4WD maintenance. Our dry ice blasting removes years of buildup without damaging surfaces or using harsh chemicals.
            </p>

            <div className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>

            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6"
              onClick={scrollToBooking}
            >
              Book Your Car In
            </Button>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="relative rounded-lg overflow-hidden border-2 border-primary shadow-2xl">
              <img 
                src={automotiveImage} 
                alt="Automotive dry ice cleaning"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

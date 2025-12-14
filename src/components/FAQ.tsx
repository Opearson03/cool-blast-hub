import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect } from "react";

export const FAQ = () => {
  useEffect(() => {
    // Add FAQ Schema for SEO
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is dry ice blasting and how does it work in the Hunter Valley?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Dry ice blasting is a revolutionary non-abrasive cleaning method that uses solid CO2 pellets accelerated by compressed air to clean industrial equipment and automotive surfaces. Hunter Dry Ice Blasting uses Cold Jet technology to provide professional dry ice blasting services throughout the Hunter Valley region. The dry ice sublimates on impact, leaving no secondary waste and providing superior cleaning for heavy industry applications."
          }
        },
        {
          "@type": "Question",
          "name": "What are the industrial applications of dry ice blasting in heavy industry?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Dry ice blasting is ideal for industrial cleaning applications including mining equipment restoration, manufacturing machinery maintenance, food processing equipment sanitization, and power generation facility cleaning. Our industrial dry ice blasting services in the Hunter Valley are perfect for removing contaminants, grease, paint, and residue from heavy industrial equipment without causing surface damage or requiring disassembly."
          }
        },
        {
          "@type": "Question",
          "name": "Can dry ice blasting be used for automotive and 4WD restoration in the Hunter Valley?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! Dry ice blasting is exceptional for automotive restoration, classic car cleaning, and 4WD vehicle detailing. Hunter Dry Ice Blasting specializes in non-abrasive car cleaning that removes rust, paint, undercoating, and grime from automotive surfaces without damaging metal, chrome, or delicate components. Perfect for car enthusiasts and 4WD owners in the Hunter Valley seeking professional automotive dry ice cleaning services."
          }
        },
        {
          "@type": "Question",
          "name": "Is dry ice blasting environmentally friendly and safe?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Dry ice blasting is an eco-friendly cleaning solution that produces no secondary waste. Unlike traditional abrasive blasting methods, dry ice cleaning uses recyclable CO2 pellets that sublimate into gas, leaving only the removed contaminant to clean up. Our environmentally safe dry ice blasting services in the Hunter Valley are non-toxic, non-conductive, and approved for use in food processing facilities, making it the safest industrial cleaning method available."
          }
        },
        {
          "@type": "Question",
          "name": "How much does dry ice blasting cost in the Hunter Valley?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Dry ice blasting costs vary depending on the project scope, surface area, and cleaning requirements. Hunter Dry Ice Blasting offers competitive pricing for both industrial dry ice cleaning and automotive restoration services throughout the Hunter Valley. Contact us for a free quote on your industrial equipment cleaning, manufacturing facility maintenance, or classic car restoration project."
          }
        },
        {
          "@type": "Question",
          "name": "What makes Cold Jet dry ice blasting technology superior for industrial cleaning?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Cold Jet dry ice blasting technology delivers superior cleaning performance through advanced equipment that precisely controls dry ice pellet size, velocity, and temperature. Hunter Dry Ice Blasting uses professional-grade Cold Jet machines to provide non-abrasive industrial cleaning that reduces downtime, eliminates chemical waste, and achieves superior results compared to traditional sandblasting, water blasting, or chemical cleaning methods."
          }
        },
        {
          "@type": "Question",
          "name": "Can dry ice blasting remove rust, paint, and undercoating from vehicles?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Absolutely! Dry ice blasting effectively removes rust, old paint, undercoating, oil, grease, and carbon buildup from automotive surfaces and 4WD vehicles. Our automotive dry ice cleaning services in the Hunter Valley are ideal for car restoration projects, engine bay cleaning, chassis cleaning, and preparing surfaces for repainting. The non-abrasive nature of dry ice blasting preserves the integrity of metal surfaces while providing thorough cleaning."
          }
        },
        {
          "@type": "Question",
          "name": "Where does Hunter Dry Ice Blasting provide services?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Hunter Dry Ice Blasting provides professional dry ice cleaning services throughout the Hunter Valley region, including Newcastle, Maitland, Cessnock, and surrounding areas. We service industrial facilities, manufacturing plants, mining operations, automotive workshops, and individual car enthusiasts requiring expert dry ice blasting for heavy industry equipment or vehicle restoration projects."
          }
        }
      ]
    });
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <section id="faq" className="py-20 px-4 bg-darker-bg">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-ice-blue to-ice-blue-dark bg-clip-text text-transparent">
            Dry Ice Blasting FAQs
          </h2>
          <p className="text-muted-foreground text-lg">
            Common questions about industrial dry ice blasting and automotive cleaning services in the Hunter Valley
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="item-1" className="border border-border rounded-lg px-6 bg-card/50">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="font-semibold text-foreground">
                What is dry ice blasting and how does it work in the Hunter Valley?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Dry ice blasting is a revolutionary non-abrasive cleaning method that uses solid CO2 pellets accelerated by compressed air to clean industrial equipment and automotive surfaces. Hunter Dry Ice Blasting uses Cold Jet technology to provide professional dry ice blasting services throughout the Hunter Valley region. The dry ice sublimates on impact, leaving no secondary waste and providing superior cleaning for heavy industry applications.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border border-border rounded-lg px-6 bg-card/50">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="font-semibold text-foreground">
                What are the industrial applications of dry ice blasting in heavy industry?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Dry ice blasting is ideal for industrial cleaning applications including mining equipment restoration, manufacturing machinery maintenance, food processing equipment sanitization, and power generation facility cleaning. Our industrial dry ice blasting services in the Hunter Valley are perfect for removing contaminants, grease, paint, and residue from heavy industrial equipment without causing surface damage or requiring disassembly.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border border-border rounded-lg px-6 bg-card/50">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="font-semibold text-foreground">
                Can dry ice blasting be used for automotive and 4WD restoration in the Hunter Valley?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Yes! Dry ice blasting is exceptional for automotive restoration, classic car cleaning, and 4WD vehicle detailing. Hunter Dry Ice Blasting specializes in non-abrasive car cleaning that removes rust, paint, undercoating, and grime from automotive surfaces without damaging metal, chrome, or delicate components. Perfect for car enthusiasts and 4WD owners in the Hunter Valley seeking professional automotive dry ice cleaning services.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="border border-border rounded-lg px-6 bg-card/50">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="font-semibold text-foreground">
                Is dry ice blasting environmentally friendly and safe?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Dry ice blasting is an eco-friendly cleaning solution that produces no secondary waste. Unlike traditional abrasive blasting methods, dry ice cleaning uses recyclable CO2 pellets that sublimate into gas, leaving only the removed contaminant to clean up. Our environmentally safe dry ice blasting services in the Hunter Valley are non-toxic, non-conductive, and approved for use in food processing facilities, making it the safest industrial cleaning method available.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5" className="border border-border rounded-lg px-6 bg-card/50">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="font-semibold text-foreground">
                How much does dry ice blasting cost in the Hunter Valley?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Dry ice blasting costs vary depending on the project scope, surface area, and cleaning requirements. Hunter Dry Ice Blasting offers competitive pricing for both industrial dry ice cleaning and automotive restoration services throughout the Hunter Valley. Contact us for a free quote on your industrial equipment cleaning, manufacturing facility maintenance, or classic car restoration project.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6" className="border border-border rounded-lg px-6 bg-card/50">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="font-semibold text-foreground">
                What makes Cold Jet dry ice blasting technology superior for industrial cleaning?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Cold Jet dry ice blasting technology delivers superior cleaning performance through advanced equipment that precisely controls dry ice pellet size, velocity, and temperature. Hunter Dry Ice Blasting uses professional-grade Cold Jet machines to provide non-abrasive industrial cleaning that reduces downtime, eliminates chemical waste, and achieves superior results compared to traditional sandblasting, water blasting, or chemical cleaning methods.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7" className="border border-border rounded-lg px-6 bg-card/50">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="font-semibold text-foreground">
                Can dry ice blasting remove rust, paint, and undercoating from vehicles?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Absolutely! Dry ice blasting effectively removes rust, old paint, undercoating, oil, grease, and carbon buildup from automotive surfaces and 4WD vehicles. Our automotive dry ice cleaning services in the Hunter Valley are ideal for car restoration projects, engine bay cleaning, chassis cleaning, and preparing surfaces for repainting. The non-abrasive nature of dry ice blasting preserves the integrity of metal surfaces while providing thorough cleaning.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8" className="border border-border rounded-lg px-6 bg-card/50">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="font-semibold text-foreground">
                Where does Hunter Dry Ice Blasting provide services?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Hunter Dry Ice Blasting provides professional dry ice cleaning services throughout the Hunter Valley region, including Newcastle, Maitland, Cessnock, and surrounding areas. We service industrial facilities, manufacturing plants, mining operations, automotive workshops, and individual car enthusiasts requiring expert dry ice blasting for heavy industry equipment or vehicle restoration projects.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
};

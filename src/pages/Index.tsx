import { Hero } from "@/components/Hero";
import { IndustrialApplications } from "@/components/IndustrialApplications";
import { AutomotiveSection } from "@/components/AutomotiveSection";
import { FAQ } from "@/components/FAQ";
import { BookingForm } from "@/components/BookingForm";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <IndustrialApplications />
      <AutomotiveSection />
      <BookingForm />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Index;

import { Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-darker-bg border-t border-border py-12 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-black mb-4">
              <span className="text-primary">HUNTER</span> DRY ICE BLASTING
            </h3>
            <p className="text-muted-foreground">
              Professional dry ice blasting services for industrial and automotive applications
            </p>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Contact</h4>
            <div className="space-y-2">
              <a href="tel:+61400000000" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-4 w-4" />
                0400 000 000
              </a>
              <a href="mailto:info@hunterdryice.com.au" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-4 w-4" />
                info@hunterdryice.com.au
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Services</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>Industrial Cleaning</li>
              <li>Automotive Restoration</li>
              <li>4WD Maintenance</li>
              <li>Equipment Maintenance</li>
              <li>
                <a 
                  href="/capability-statement.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-ice-blue-dark transition-colors inline-flex items-center gap-1"
                >
                  Capability Statement
                </a>
              </li>
              <li>
                <Link 
                  to="/auth"
                  className="text-primary hover:text-ice-blue-dark transition-colors inline-flex items-center gap-1"
                >
                  Staff Portal Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Hunter Dry Ice Blasting. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

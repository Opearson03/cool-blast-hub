import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/seo/SEOHead";

export default function PrivacyPolicy() {
  return (
    <>
      <SEOHead
        title="Privacy Policy | PourHub - Concreting Business Software"
        description="PourHub privacy policy. Learn how we collect, use, and protect your data when using our concreting business management software."
        canonicalPath="/privacy"
      />
      <div className="min-h-screen bg-charcoal-dark p-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: December 2024</p>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
              <p className="text-muted-foreground">
                We collect information you provide directly, including name, email, phone number, 
                business details, and employment records. We also collect location data when you 
                use the timesheet clock-in/out features with your consent.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
              <p className="text-muted-foreground">We use your information to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Provide and maintain the PourHub service</li>
                <li>Process timesheets and job scheduling</li>
                <li>Send notifications about your work schedule</li>
                <li>Improve and optimize our services</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">3. Location Data</h2>
              <p className="text-muted-foreground">
                When you clock in or out, we may collect your device's location to verify on-site 
                presence. This data is stored securely and only accessible to your employer's 
                administrators. You can disable location services, though some features may be limited.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">4. Data Storage & Security</h2>
              <p className="text-muted-foreground">
                Your data is stored securely in Australia-based servers. We implement industry-standard 
                security measures including encryption, access controls, and regular security audits. 
                We retain your data for as long as your account is active or as needed to provide services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">5. Data Sharing</h2>
              <p className="text-muted-foreground">
                We do not sell your personal information. We may share data with:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Your employer (business administrators) for work-related records</li>
                <li>Service providers who assist in operating our platform</li>
                <li>Legal authorities when required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">6. Your Rights</h2>
              <p className="text-muted-foreground">
                Under Australian Privacy Principles, you have the right to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your data</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">7. Contact Us</h2>
              <p className="text-muted-foreground">
                For privacy-related enquiries, contact us at privacy@pourhub.com.au
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
}
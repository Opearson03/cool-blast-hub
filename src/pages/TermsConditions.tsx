import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/seo/SEOHead";

export default function TermsConditions() {
  return (
    <>
      <SEOHead
        title="Terms and Conditions | PourHub - Concreting Business Software"
        description="PourHub terms and conditions. Understand the terms of service for using our concreting business management software in Australia."
        canonicalPath="/terms"
      />
      <div className="min-h-screen bg-charcoal-dark p-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Terms and Conditions</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: December 2024</p>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using PourHub ("the Service"), you accept and agree to be bound by 
                these Terms and Conditions. If you do not agree, please do not use the Service.
                This agreement is governed by the laws of New South Wales, Australia.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">2. Service Description</h2>
              <p className="text-muted-foreground">
                PourHub is a workforce management platform designed for concreting businesses in Australia. 
                The Service includes job scheduling, timesheet management, compliance documentation (ITPs, SWMS), 
                and employee management features.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">3. User Accounts</h2>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account credentials 
                and for all activities under your account. Business administrators are responsible 
                for managing user access within their organisation.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">4. Subscription & Payment</h2>
              <p className="text-muted-foreground">
                Subscriptions are billed monthly. Prices are in Australian Dollars (AUD) and 
                include GST where applicable. You may cancel your subscription at any time, 
                with access continuing until the end of your billing period.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">5. Acceptable Use</h2>
              <p className="text-muted-foreground">You agree not to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to gain unauthorised access to other accounts</li>
                <li>Upload malicious software or harmful content</li>
                <li>Interfere with the proper functioning of the Service</li>
                <li>Share login credentials with unauthorised persons</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">6. Data Ownership</h2>
              <p className="text-muted-foreground">
                You retain ownership of all data you submit to the Service. By using PourHub, 
                you grant us a licence to process and store your data as necessary to provide 
                the Service. You may export your data at any time.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">7. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by Australian Consumer Law, PourHub shall not be 
                liable for any indirect, incidental, special, or consequential damages. Our total 
                liability shall not exceed the amount paid by you in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">8. Compliance Documents</h2>
              <p className="text-muted-foreground">
                PourHub provides templates and tools for ITPs, SWMS, and other compliance documents. 
                These are provided as guidance only. It is your responsibility to ensure all 
                documentation meets applicable workplace health and safety requirements under 
                Australian law, including the Work Health and Safety Act 2011 (NSW).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">9. Termination</h2>
              <p className="text-muted-foreground">
                We may suspend or terminate your access if you breach these Terms. Upon termination, 
                your right to use the Service ceases immediately. You may request data export 
                within 30 days of termination.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">10. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms are governed by the laws of New South Wales, Australia. Any disputes 
                shall be subject to the exclusive jurisdiction of the courts of New South Wales.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">11. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may update these Terms from time to time. Continued use of the Service after 
                changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">12. Contact</h2>
              <p className="text-muted-foreground">
                For questions about these Terms, contact us at legal@pourhub.com.au
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
}
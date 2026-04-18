import xeroLogo from "@/assets/integrations/xero.png";
import myobLogo from "@/assets/integrations/myob.png";
import quickbooksLogo from "@/assets/integrations/quickbooks.png";
import teamsLogo from "@/assets/integrations/teams.png";
import procoreLogo from "@/assets/integrations/procore.png";
import aconexLogo from "@/assets/integrations/aconex.png";
import employmentHeroLogo from "@/assets/integrations/employment-hero.png";
import connecteamLogo from "@/assets/integrations/connecteam.png";
import deputyLogo from "@/assets/integrations/deputy.png";
import dropboxLogo from "@/assets/integrations/dropbox.png";

interface Integration {
  name: string;
  src: string;
}

const integrations: Integration[] = [
  { name: "Xero", src: xeroLogo },
  { name: "MYOB", src: myobLogo },
  { name: "QuickBooks", src: quickbooksLogo },
  { name: "Microsoft Teams", src: teamsLogo },
  { name: "Procore", src: procoreLogo },
  { name: "Aconex", src: aconexLogo },
  { name: "Employment Hero", src: employmentHeroLogo },
  { name: "Connecteam", src: connecteamLogo },
  { name: "Deputy", src: deputyLogo },
  { name: "Dropbox", src: dropboxLogo },
];

export const IntegrationsMarquee = () => {
  // Double the list for seamless infinite scroll
  const loop = [...integrations, ...integrations];

  return (
    <section className="bg-charcoal-dark py-16 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold tracking-wider text-primary uppercase mb-3">
            Integrates With
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground">
            The tools you already use
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            PourHub Enterprise plugs into your existing accounting, comms, project management and compliance stack.
          </p>
        </div>

        <div
          className="relative group"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          }}
        >
          <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] items-center">
            {loop.map((logo, idx) => (
              <div
                key={`${logo.name}-${idx}`}
                className="flex items-center justify-center mx-6 sm:mx-8 shrink-0 h-24 w-44 sm:w-52 bg-white rounded-lg px-5 py-3 grayscale hover:grayscale-0 opacity-80 hover:opacity-100 transition-all duration-300"
                title={logo.name}
              >
                <img
                  src={logo.src}
                  alt={`${logo.name} logo`}
                  className="max-h-16 sm:max-h-20 max-w-full w-auto object-contain"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsMarquee;

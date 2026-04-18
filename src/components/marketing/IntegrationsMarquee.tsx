interface Integration {
  name: string;
  src: string;
  href?: string;
}

// Placeholder logos — replace `src` values with the URLs you provide.
// Drop logos into /public/integrations/ or use external URLs.
const integrations: Integration[] = [
  { name: "Xero", src: "/integrations/xero.svg" },
  { name: "MYOB", src: "/integrations/myob.svg" },
  { name: "QuickBooks", src: "/integrations/quickbooks.svg" },
  { name: "Microsoft Teams", src: "/integrations/teams.svg" },
  { name: "Microsoft 365", src: "/integrations/microsoft365.svg" },
  { name: "Procore", src: "/integrations/procore.svg" },
  { name: "Aconex", src: "/integrations/aconex.svg" },
  { name: "Hammertech", src: "/integrations/hammertech.svg" },
  { name: "EstimateOne", src: "/integrations/estimateone.svg" },
  { name: "Employment Hero", src: "/integrations/employment-hero.svg" },
  { name: "Deputy", src: "/integrations/deputy.svg" },
  { name: "Dropbox", src: "/integrations/dropbox.svg" },
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
          <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
            {loop.map((logo, idx) => (
              <div
                key={`${logo.name}-${idx}`}
                className="flex items-center justify-center mx-8 sm:mx-12 shrink-0"
                title={logo.name}
              >
                <img
                  src={logo.src}
                  alt={`${logo.name} logo`}
                  className="h-10 sm:h-12 w-auto object-contain opacity-80 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback: show name as text if image fails
                    const target = e.currentTarget;
                    target.style.display = "none";
                    const fallback = document.createElement("span");
                    fallback.textContent = logo.name;
                    fallback.className =
                      "text-primary-foreground/70 font-semibold text-lg whitespace-nowrap";
                    target.parentElement?.appendChild(fallback);
                  }}
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

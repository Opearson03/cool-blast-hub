import { Link } from "react-router-dom";

const FixedPriceConcreteQuotes = () => (
  <>
    <p>
      Fixed-price quotes are the norm in residential concreting. The client wants a number, and they want to know it won't change. But for the concreter, a fixed price means all the risk sits with you. If the job costs more than you quoted, that's your problem. This article looks at when fixed-price quoting works, when it doesn't, and how to manage the risk.
    </p>

    <h2 id="why-fixed-price-is-risky">Why Fixed-Price Quotes Are Risky</h2>
    <p>
      A fixed-price quote locks in your revenue while leaving your costs variable. On a concrete job, several things can change between quoting and completion:
    </p>
    <ul>
      <li><strong>Concrete prices increase</strong> — suppliers adjust pricing regularly, and if your job is months away, you could be paying more per cubic metre than you quoted</li>
      <li><strong>Ground conditions are worse than expected</strong> — more excavation, deeper footings, water in trenches</li>
      <li><strong>Weather delays</strong> — a rained-out pour means you absorb crew wages and rescheduling costs</li>
      <li><strong>Scope creep</strong> — "can you just extend the slab another metre?" sounds small but costs real money</li>
      <li><strong>Access problems</strong> — expected direct pour turns into a pump job</li>
    </ul>
    <p>
      On a $20,000 slab job, these surprises can easily cost $2,000–$4,000 — wiping out your profit entirely.
    </p>

    <h2 id="when-fixed-works">When Fixed-Price Quotes Work</h2>
    <p>
      Fixed pricing works well when the scope is clear and the risk is low:
    </p>
    <ul>
      <li><strong>Simple, well-defined jobs</strong> — a plain garage slab on a flat, cleared site with good access</li>
      <li><strong>Engineering drawings are finalised</strong> — you know exactly what you're building</li>
      <li><strong>Short turnaround</strong> — the job will be done within weeks, so material prices won't change</li>
      <li><strong>You've done similar jobs before</strong> — your pricing is based on actual experience, not guesswork</li>
      <li><strong>Site conditions are known</strong> — you've visited, assessed the soil, and confirmed access</li>
    </ul>

    <h2 id="when-fixed-fails">When Fixed-Price Quotes Lose Money</h2>
    <p>
      Fixed pricing is dangerous when:
    </p>
    <ul>
      <li><strong>No engineering drawings yet</strong> — you're guessing at footing depths, steel requirements, and slab thickness</li>
      <li><strong>Reactive or unknown soil conditions</strong> — excavation costs are unpredictable</li>
      <li><strong>The job is months away</strong> — material prices and availability can change</li>
      <li><strong>The builder has a history of scope changes</strong> — expect <Link to="/articles/what-is-concrete-variation">variations</Link> that are hard to recover</li>
      <li><strong>You haven't done a site visit</strong> — you're pricing blind</li>
    </ul>

    <h2 id="protecting-yourself">How to Protect Yourself on Fixed-Price Jobs</h2>

    <h3>1. Add appropriate contingency</h3>
    <p>
      Build a <Link to="/articles/contingency-concrete-quote">contingency allowance</Link> into your fixed price. For low-risk jobs, 5% is fine. For uncertain jobs, go higher. This is the simplest way to manage risk.
    </p>

    <h3>2. Define the scope clearly</h3>
    <p>
      Your quote should spell out exactly what's included and excluded. Be specific:
    </p>
    <ul>
      <li>"Price based on engineer's drawing ref. E-2024-001 Rev B"</li>
      <li>"Assumes direct pour access for 6m³ agitator within 15m of slab edge"</li>
      <li>"Excludes excavation below 300mm depth"</li>
      <li>"Excludes any finish other than standard float"</li>
    </ul>
    <p>
      If the scope changes, you have a clear basis for issuing a variation.
    </p>

    <h3>3. Include a price validity period</h3>
    <p>
      State that your quote is valid for 30 days (or 14 days for volatile markets). After that, prices may need to be adjusted. This protects you from material price increases on jobs that take months to get approved.
    </p>

    <h3>4. Use a variation clause</h3>
    <p>
      Include a clause that allows you to charge for any work outside the original scope. This is standard practice in construction and most clients will accept it. The key is to <Link to="/articles/document-concrete-variations">document variations properly</Link> when they occur.
    </p>

    <h3>5. Quote line items, not a lump sum</h3>
    <p>
      Breaking your quote into line items (excavation, formwork, concrete, steel, labour, pump) makes it much easier to adjust individual items when the scope changes. A single lump sum gives you no flexibility. This is one of the key points in our <Link to="/articles/how-to-quote-concrete-slab-australia">step-by-step quoting guide</Link>.
    </p>

    <h2 id="alternatives-to-fixed">Alternatives to Pure Fixed-Price</h2>
    <p>
      If fixed-price feels too risky for a particular job, consider these approaches:
    </p>
    <ul>
      <li><strong>Cost-plus</strong> — charge actual costs plus a margin. Fair but some clients dislike the open-ended nature. More common in commercial work</li>
      <li><strong>Fixed price with provisional sums</strong> — fix what you can, and include provisional (estimated) amounts for uncertain items like excavation. Adjust to actuals after the work is done</li>
      <li><strong>Capped price</strong> — "the job won't exceed $X" gives the client comfort while giving you a ceiling to work within</li>
      <li><strong>Hourly rate for prep, fixed for pour</strong> — <Link to="/articles/concreters-hourly-vs-fixed-price">hybrid pricing</Link> that reflects the different risk profiles of each stage</li>
    </ul>

    <h2 id="summary">Summary</h2>
    <p>
      Fixed-price quoting is part of the game in residential concreting. You can't always avoid it, but you can manage the risk: add contingency, define scope tightly, include validity periods and variation clauses, and quote from real measurements rather than rough estimates. The concreters who make money on fixed-price jobs are the ones who've learned to price reality — not optimism.
    </p>
  </>
);

export default FixedPriceConcreteQuotes;

import { Link } from "react-router-dom";

const WhatConcretersForgetInQuotes = () => (
  <>
    <p>
      You've measured the slab, priced the concrete, and allowed for labour. The quote looks right — until you finish the job and realise you've worked for almost nothing. Sound familiar? Most concreters don't underquote because they're bad at maths. They underquote because they forget to include things that seem small but add up fast. Here are the most commonly missed items.
    </p>

    <h2 id="pump-hire">1. Concrete Pump Hire</h2>
    <p>
      This is the big one. If the truck can't pour directly into the forms, you need a pump — and pumps aren't cheap. A line pump starts around $800 and a boom pump can cost $1,200–$1,800 depending on the size and pour duration.
    </p>
    <p>
      Many concreters quote assuming direct pour access, then discover on pour day that the truck can't get close enough. By then, it's too late to adjust the price.
    </p>
    <p>
      <strong>Fix:</strong> Always assess pump requirements during the <Link to="/articles/how-to-quote-concrete-slab-australia">site visit</Link>. If there's any doubt, include pump hire in the quote.
    </p>

    <h2 id="travel-time">2. Travel Time</h2>
    <p>
      If a job is 45 minutes each way, that's 1.5 hours of driving per day — plus fuel. Over a multi-day job, that's a significant cost that often goes unpriced. 
    </p>
    <p>
      <strong>Fix:</strong> Include a travel/mobilisation allowance in every quote. Some concreters add a flat rate, others calculate it based on distance.
    </p>

    <h2 id="prep-time">3. Underestimating Prep Time</h2>
    <p>
      The pour is the exciting part. But the prep — excavation, compaction, formwork, membrane, steel placement, chairs — usually takes twice as long as the pour itself. If you're pricing for a one-day job and it takes two days of prep plus the pour day, your labour cost is way off.
    </p>
    <p>
      <strong>Fix:</strong> Price prep and pour separately. Walk through each task and estimate hours realistically, not optimistically.
    </p>

    <h2 id="waste-and-overorder">4. Concrete Waste and Over-Order</h2>
    <p>
      You never pour exactly the theoretical volume. Ground is uneven. Forms move slightly. Thickness varies. You need a <Link to="/articles/concrete-waste-allowance">waste allowance</Link> of at least 5–10%, sometimes more for complex jobs or uneven sites.
    </p>
    <p>
      <strong>Fix:</strong> Add 5–10% to your calculated concrete volume. Include this in your material cost.
    </p>

    <h2 id="formwork-materials">5. Formwork Materials</h2>
    <p>
      Timber, pegs, screws, bracing, and form oil all cost money. On a large slab with step-downs and internal beams, formwork materials can run into hundreds of dollars.
    </p>
    <p>
      <strong>Fix:</strong> Calculate formwork as a separate line item. Include the cost of timber (even if you reuse it, it wears out) and fixings.
    </p>

    <h2 id="finishing-consumables">6. Finishing Consumables</h2>
    <p>
      Curing compound, form release agent, expansion joint material, control joint blades, polythene membrane — these small items add up to $200–$500 on a typical residential slab.
    </p>
    <p>
      <strong>Fix:</strong> Keep a standard consumables list and add it to every quote.
    </p>

    <h2 id="skip-bin">7. Skip Bin and Waste Removal</h2>
    <p>
      Excavated soil, stripped formwork, mesh off-cuts, and general rubbish need to go somewhere. A skip bin costs $300–$600 depending on size and location.
    </p>
    <p>
      <strong>Fix:</strong> Include a waste removal allowance. If the client is responsible for spoil removal, state that clearly in the quote.
    </p>

    <h2 id="small-load-charges">8. Small Load Charges</h2>
    <p>
      Ordering less than a full truck (typically under 3–4m³) attracts a small load fee from most suppliers — often $100–$200 per delivery. If you're doing a small slab or a top-up pour, this can significantly increase your per-cubic-metre cost.
    </p>
    <p>
      <strong>Fix:</strong> Check minimum order quantities with your supplier and include any small load charges.
    </p>

    <h2 id="waiting-time">9. Waiting Time Charges</h2>
    <p>
      Most concrete suppliers allow 30 minutes per truck for unloading. After that, waiting time charges kick in — typically $2–$3 per minute. On a difficult pour with slow access or multiple obstructions, this adds up.
    </p>
    <p>
      <strong>Fix:</strong> Plan the pour sequence carefully. If you expect slow pours, factor in waiting time charges.
    </p>

    <h2 id="weather-delays">10. Weather Delays</h2>
    <p>
      Rain can delay a pour by days. You still need to pay your crew, your formwork is tied up, and you might lose your concrete booking. Yet most concreters include zero allowance for weather in their quotes.
    </p>
    <p>
      <strong>Fix:</strong> Add a <Link to="/articles/contingency-concrete-quote">contingency</Link> for weather — even half a day's labour cost provides a buffer.
    </p>

    <h2 id="insurance-and-overheads">11. Insurance, Rego, and Business Overheads</h2>
    <p>
      Public liability insurance, vehicle registration, tool replacement, phone bills, accounting fees — these are real costs that need to be recovered through your quotes. Many sole traders forget to include them because they don't feel like "job costs."
    </p>
    <p>
      <strong>Fix:</strong> Calculate your annual overheads, divide by the number of working weeks, and add a weekly overhead recovery amount to every quote.
    </p>

    <h2 id="summary">The Bottom Line</h2>
    <p>
      None of these items are huge on their own. But add up pump hire, travel, extra prep time, waste, consumables, and a skip bin — and you can easily be $1,500–$3,000 short on a residential slab. That's the difference between a profitable job and working for free.
    </p>
    <p>
      The fix is simple: use a checklist. Before sending any quote, run through these items and make sure each one is accounted for. Over time, you'll build a <Link to="/articles/track-job-profitability-concrete">system for tracking actual costs</Link> against quotes — and your pricing will get sharper with every job.
    </p>
  </>
);

export default WhatConcretersForgetInQuotes;

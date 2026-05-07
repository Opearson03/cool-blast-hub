import { Link } from "react-router-dom";

const ClientDisputesConcreteInvoice = () => (
  <>
    <p>
      A disputed invoice doesn't mean you won't get paid — but how you handle the first 48 hours decides how long it'll take and how much you'll recover. Most disputes are resolved between concreter and client without lawyers, tribunals, or debt collectors. The concreters who get paid quickly are the ones who stay calm, document well, and escalate in a deliberate sequence.
    </p>

    <h2 id="common-reasons">Common Reasons Clients Dispute</h2>
    <ul>
      <li>"That's not what we agreed" — scope or variation disagreement</li>
      <li>"The price is higher than the quote" — variations not approved or not itemised</li>
      <li>"Workmanship issues" — cracks, finish, levels, exposed mesh</li>
      <li>"Job isn't finished" — minor outstanding items being used as leverage</li>
      <li>"Cashflow" — they actually can't pay right now and are stalling</li>
      <li>Bad faith — they have no intention of paying without pressure</li>
    </ul>
    <p>
      Each one needs a different response. Understanding which you're dealing with should be the first step.
    </p>

    <h2 id="step-1-listen">Step 1: Listen Before You Argue</h2>
    <p>
      The first phone call should be 80% listening. Get the client to say exactly what they're disputing and why. Take notes. Don't interrupt to defend the work yet — you want a complete list of every objection now, not a fresh objection next week.
    </p>
    <p>
      End the call with: <em>"Thanks — I'll review everything and come back to you in 24 hours with a written response."</em> That buys you time, signals professionalism, and locks in the dispute scope.
    </p>

    <h2 id="step-2-review">Step 2: Pull Together Your Evidence</h2>
    <p>
      Before responding, gather:
    </p>
    <ul>
      <li>Original quote and any signed variations</li>
      <li>SMS / email approvals for each variation (see <Link to="/articles/document-concrete-variations">documenting variations</Link>)</li>
      <li>Site photos from before, during, and after the pour</li>
      <li>Concrete dockets and slump test results</li>
      <li>Engineer's drawings or instructions if relevant</li>
      <li>Time-stamped notes from your crew</li>
    </ul>

    <h2 id="step-3-respond-in-writing">Step 3: Respond in Writing</h2>
    <p>
      A written response within 24–48 hours puts you ahead. Address each objection point by point. Calm, factual, no emotion. Include a clear path forward — what you're willing to do, by when, and what the next step is.
    </p>
    <blockquote>
      <p>
        "Thanks for the call yesterday. I've reviewed your concerns and outlined our position below. Item by item:<br />
        1. Variation V02 (extra step-down): approved by SMS on 14/03 — copy attached<br />
        2. Surface finish: matches the agreed broom finish; happy to meet on site to walk through<br />
        3. Outstanding cleanup: scheduled for Friday<br />
        Net amount payable: $14,820. I propose payment of $13,000 within 7 days while we resolve item 2 — happy to discuss."
      </p>
    </blockquote>

    <h2 id="step-4-meet">Step 4: Meet on Site if Possible</h2>
    <p>
      For workmanship disputes, get back on site. Walk through the issue together. Often the client's concern is based on a misunderstanding (cosmetic surface marks vs structural defects, normal shrinkage cracks vs failure). Bring the engineer's spec or relevant Australian Standard reference if it helps.
    </p>

    <h2 id="step-5-negotiate">Step 5: Negotiate a Settlement</h2>
    <p>
      Most disputes settle for somewhere between full payment and the client's first offer. Be willing to give a small discount to close it quickly — the cost of chasing 100% over six months usually exceeds the discount. But don't give it away. A good rule: never discount more than the disputed item's value, and never discount until they've made an offer in writing.
    </p>

    <h2 id="step-6-escalate">Step 6: Escalation Path (When Negotiation Fails)</h2>
    <ol>
      <li><strong>Letter of demand</strong> — formal, stating the amount, due date, and consequences. Often this alone gets payment.</li>
      <li><strong>Security of Payment claim</strong> — under your state's SOP Act, you can issue a payment claim with strict response deadlines. Powerful but technical — get it right or it fails.</li>
      <li><strong>Tribunal</strong> — NCAT (NSW), VCAT (VIC), QCAT (QLD), etc. for residential consumer disputes. Cheap, fast, no lawyers required for smaller amounts.</li>
      <li><strong>Court</strong> — Local Court / Magistrates Court for amounts above tribunal thresholds. Use a solicitor.</li>
      <li><strong>Debt collection agency</strong> — useful when the client has gone quiet but is still trading. Costs around 10–25% of recovered amount.</li>
    </ol>

    <h2 id="what-not-to-do">What Not to Do</h2>
    <ul>
      <li>Threaten to come back and damage the slab — illegal, and ends any chance of payment</li>
      <li>Send angry messages — they'll be screenshotted and used against you</li>
      <li>Ignore the dispute hoping it goes away — it gets worse</li>
      <li>Accept "we'll sort it out later" without a written commitment</li>
      <li>Give up after one rejection — most invoices are paid after the second or third follow-up</li>
    </ul>

    <h2 id="prevention">Prevention: Make Disputes Less Likely</h2>
    <p>
      The cheapest dispute is the one that doesn't happen. Most are caused by unclear quotes, unapproved variations, or surprise final invoices. Specifically:
    </p>
    <ul>
      <li>Itemised quotes with clear inclusions and exclusions</li>
      <li>Pre-approved, written variations (see <Link to="/articles/what-is-concrete-variation">variations guide</Link>)</li>
      <li>Progress claims, not one big invoice at the end</li>
      <li>A walk-through with the client on the day of practical completion</li>
      <li>Clear payment terms on the quote and on every invoice</li>
    </ul>

    <h2 id="summary">Summary</h2>
    <p>
      Treat a disputed invoice as a process, not a fight. Listen first, respond in writing, meet on site if needed, negotiate sensibly, and escalate in a measured sequence. Most disputes settle within weeks if you handle them professionally. The ones that don't are the ones where the concreter either disappears or loses their cool — neither gets you paid.
    </p>
  </>
);

export default ClientDisputesConcreteInvoice;

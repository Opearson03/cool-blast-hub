import { Link } from "react-router-dom";

const RetentionMoneyConstruction = () => (
  <>
    <p>
      Retention is money the builder or head contractor keeps back from each progress claim, supposedly held as security in case you need to come back and fix defects. In theory it gets released months after the job is finished. In practice, it's one of the easiest ways concreters lose money — not because retention is wrong, but because the rules are routinely ignored and the cash is hard to chase.
    </p>

    <h2 id="what-is-retention">What Is Retention?</h2>
    <p>
      Retention (sometimes called "retention money" or "cash retention") is a percentage withheld from each invoice you submit on a job. The builder holds it in trust as protection against defective work. Once the defects liability period passes — usually 6 to 12 months after practical completion — the retention is released back to you.
    </p>

    <h2 id="typical-rates">Typical Retention Rates</h2>
    <table>
      <thead>
        <tr>
          <th>Contract type</th>
          <th>Typical retention</th>
          <th>Release schedule</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Residential subbie work</td>
          <td>5%</td>
          <td>Half on practical completion, half at end of defects period</td>
        </tr>
        <tr>
          <td>Small commercial</td>
          <td>5–10%</td>
          <td>Same — typically 6 months total</td>
        </tr>
        <tr>
          <td>Larger commercial / government</td>
          <td>10% (capped at 5% of contract sum)</td>
          <td>12 months defects liability standard</td>
        </tr>
      </tbody>
    </table>
    <p>
      Many subbie contracts also cap retention at a maximum dollar amount once a contract sum threshold is reached.
    </p>

    <h2 id="state-rules">State-by-State Rules (Australia)</h2>
    <p>
      Retention money is governed by Security of Payment legislation in each state and, in some states, separate retention trust account laws. Key examples:
    </p>
    <ul>
      <li><strong>NSW</strong> — Building and Construction Industry Security of Payment Act 1999. Retention money on contracts over a threshold must be held in a separate trust account.</li>
      <li><strong>QLD</strong> — Building Industry Fairness (Security of Payment) Act 2017. Project Trust Accounts (PTAs) and Retention Trust Accounts (RTAs) apply to head contracts above defined thresholds.</li>
      <li><strong>VIC</strong> — Building and Construction Industry Security of Payment Act 2002. Retention is allowed but no statutory trust account requirement at present.</li>
      <li><strong>WA, SA, TAS, ACT, NT</strong> — Each has its own SOP Act with similar but not identical rules.</li>
    </ul>
    <p>
      Rules change. Before signing a subbie contract over $50k, check the current state position or get a 30-minute legal review.
    </p>

    <h2 id="what-to-check-before-signing">What to Check Before You Sign a Subbie Contract</h2>
    <ol>
      <li><strong>Retention percentage</strong> — 5% is standard, anything higher is negotiable</li>
      <li><strong>Maximum retention amount</strong> — should cap once you've reached the threshold</li>
      <li><strong>Release dates</strong> — half at practical completion, half at end of defects period</li>
      <li><strong>Defects liability period</strong> — 6 months residential is normal, 12 months is at the longer end</li>
      <li><strong>Trust account</strong> — required by law in some states; ask where the money is held</li>
      <li><strong>Right to substitute a bank guarantee</strong> — useful on bigger contracts</li>
    </ol>

    <h2 id="how-to-actually-get-it-back">How to Actually Get Your Retention Back</h2>
    <p>
      Most concreters lose retention not because of defects but because they forget to claim it. The builder isn't going to remind you.
    </p>
    <ul>
      <li><strong>Track every retention amount.</strong> Add it to your job sheet at invoice time. Total it across all jobs with that builder.</li>
      <li><strong>Diary the release dates.</strong> Set calendar reminders for practical completion + 6 months and + 12 months.</li>
      <li><strong>Issue a formal retention release invoice.</strong> Don't wait for the builder to ask. Send the invoice on the release date with the original retention amount and a clear due date.</li>
      <li><strong>Follow up in writing.</strong> Phone calls fade; emails leave a trail.</li>
      <li><strong>Use Security of Payment if needed.</strong> A formal payment claim under your state's SOP Act is a powerful tool — but it should be a last resort, because it usually ends the relationship.</li>
    </ul>

    <h2 id="when-to-walk-away">When to Refuse Retention</h2>
    <p>
      For small residential jobs under $20k–$30k, retention often isn't worth the cashflow hit. Politely refuse, or negotiate it out and adjust your price to reflect the risk. On bigger contracts, retention is a fact of life — but make sure the trust account rules are followed.
    </p>

    <h2 id="cashflow-impact">The Cashflow Impact Most Concreters Underestimate</h2>
    <p>
      Holding 5% of every invoice across multiple builders for 12 months adds up fast. On $400k of subbie work in a year, that's $20k locked away — money you've already spent on materials, wages, and overheads. Build retention into your cashflow forecasting, not as bonus money that "appears" later. Treat it as receivable, not retainable.
    </p>
    <p>
      For more on managing job-level cashflow, see <Link to="/articles/track-job-profitability-concrete">how to track job profitability</Link>.
    </p>

    <h2 id="if-builder-wont-release">If the Builder Won't Release</h2>
    <p>
      Common reasons retention is withheld:
    </p>
    <ul>
      <li>Defects claimed (real or alleged) — request the defect list in writing</li>
      <li>Builder is in financial trouble — chase faster, not slower</li>
      <li>Head contract still in defects period — fair, but get a written confirmation date</li>
      <li>"It's lost in admin" — push for a written response within 7 days</li>
    </ul>
    <p>
      If the response is silence or stalling, escalate. Options include a written demand, formal payment claim under SOP, debt recovery, or tribunal action. See <Link to="/articles/client-disputes-concrete-invoice">handling disputed invoices</Link>.
    </p>

    <h2 id="summary">Summary</h2>
    <p>
      Retention isn't unfair — but it's only fair if you actually get it back. Read your subbie contracts before signing, track every retention amount, diary the release dates, and chase the money like any other receivable. The concreters who lose retention are the ones who treat it as future bonus. Treat it as money already earned, and you'll get it back.
    </p>
  </>
);

export default RetentionMoneyConstruction;

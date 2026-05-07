import { Link } from "react-router-dom";

const WhatIsConcreteVariation = () => (
  <>
    <p>
      A variation is any change to the work, materials, or scope agreed in your original quote. Variations are normal — almost no concrete job runs exactly to plan. The problem isn't that variations happen; it's that concreters often don't price them, document them, or get them approved before they do the work. That's where margin disappears and disputes start.
    </p>

    <h2 id="what-is-a-variation">What Counts as a Variation?</h2>
    <p>
      A variation is anything outside the scope of your accepted quote. Common examples on residential and small commercial concrete jobs:
    </p>
    <ul>
      <li>Builder asks for an extra step-down or rebate not on the original plan</li>
      <li>Engineer upgrades the slab thickness or mesh after soil test results come back</li>
      <li>Site conditions force a change — rock encountered, water in trenches, fill required</li>
      <li>Client changes the finish (e.g. broom finish to exposed aggregate)</li>
      <li>Additional area added — a path, an extra slab section, more linear metres of footing</li>
      <li>Change in concrete grade (e.g. 25MPa upgraded to 32MPa)</li>
      <li>Pump upgrade — boom pump required because line pump access wasn't possible</li>
    </ul>
    <p>
      If it wasn't in your quote and it wasn't priced, it's a variation.
    </p>

    <h2 id="variation-vs-contingency">Variation vs Contingency</h2>
    <p>
      Don't confuse the two. <Link to="/articles/contingency-concrete-quote">Contingency</Link> is a small buffer in your quote for foreseeable unknowns (weather, minor extra concrete, small site issues). Variations are scope changes — bigger items the client or builder is asking you to do that weren't in the original price.
    </p>
    <p>
      <strong>Rule of thumb:</strong> if it's a measurable extra (more m², more m³, additional materials, or significantly more labour), it's a variation and should be priced separately.
    </p>

    <h2 id="how-to-price-variations">How to Price a Variation Fairly</h2>
    <p>
      A variation should be priced on the same basis as your original quote — your real cost plus your normal margin. The mistake most concreters make is pricing variations too low because they feel awkward "charging extra" while they're already on site. That's how a half-day extra of work turns into a $200 bill instead of a $900 bill.
    </p>

    <table>
      <thead>
        <tr>
          <th>Cost component</th>
          <th>What to include</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Materials</td>
          <td>Concrete, mesh, formwork, additives — at full cost, not "leftover"</td>
        </tr>
        <tr>
          <td>Labour</td>
          <td>Hours × loaded labour rate (wages + super + insurance + overhead)</td>
        </tr>
        <tr>
          <td>Plant & equipment</td>
          <td>Pump, excavator, vibrator, hire gear — pro rata if shared with main job</td>
        </tr>
        <tr>
          <td>Margin</td>
          <td>Your standard markup — 15–25% is normal</td>
        </tr>
        <tr>
          <td>Disruption / delay</td>
          <td>If the variation pushes other work back, include the rescheduling cost</td>
        </tr>
      </tbody>
    </table>

    <h2 id="get-approval-first">Get Approval Before You Do the Work</h2>
    <p>
      The single biggest variation mistake: doing the extra work first and trying to charge for it later. By the time the client sees the invoice, the work is done, they've moved on, and they don't feel obligated to pay. See our guide on <Link to="/articles/charge-for-variations-after-pour">charging for variations after the pour</Link> for the full picture.
    </p>
    <p>
      Even on a busy site, a 30-second phone call followed by an SMS saying <em>"Confirming we'll do X for $Y, ok to proceed?"</em> is enough to lock in approval. Get a yes before you do the work.
    </p>

    <h2 id="document-it">Document Every Variation</h2>
    <p>
      Verbal approvals fade. Texts disappear. The strongest variations are written, signed (or SMS-confirmed), and dated. See <Link to="/articles/document-concrete-variations">how to document variations properly</Link> for the full checklist — what to include, what to photograph, and the paper trail that wins disputes.
    </p>

    <h2 id="when-to-walk-away">When to Walk Away From a Variation</h2>
    <p>
      Sometimes the best variation is the one you don't do. Red flags:
    </p>
    <ul>
      <li>Client refuses to put it in writing</li>
      <li>Builder pressures you to do it now and "sort the price later"</li>
      <li>Variation is structural and pushes you outside what your insurance covers</li>
      <li>Engineer hasn't signed off on the change</li>
    </ul>
    <p>
      It's better to pause for an hour than to do unapproved work you'll fight to be paid for.
    </p>

    <h2 id="summary">Summary</h2>
    <p>
      Variations are part of every concrete job. Treat them as a normal part of the workflow: identify the change, price it on the same basis as your quote, get written approval before you start, and document what you did and when. Done properly, variations protect your margin. Done poorly, they're where most concreters lose money.
    </p>
  </>
);

export default WhatIsConcreteVariation;

import { Link } from "react-router-dom";

const ConcreteStrengthCompliance = () => (
  <>
    <p>
      When a concrete slab fails its strength test, the finger-pointing starts. The builder blames the concreter. The concreter blames the supplier. The supplier says the mix was fine when it left the plant. So who is actually responsible for concrete strength compliance in Australia? The answer involves everyone in the chain — but each party has specific obligations.
    </p>

    <h2 id="how-strength-is-tested">How Concrete Strength Is Tested</h2>
    <p>
      Concrete strength is tested by making cylindrical test specimens (usually 100mm × 200mm) from the fresh concrete on site, then crushing them in a lab at 7 and 28 days. The 28-day result is the one that matters for compliance.
    </p>
    <p>
      The testing process is governed by <strong>AS 1012</strong> (Parts 8, 9, and 14), and the compliance criteria are set out in <strong>AS 1379</strong>.
    </p>
    <p>
      For a standard residential slab specified as 25MPa, the concrete must achieve an average compressive strength of at least 25MPa at 28 days, with specific rules about individual results and statistical assessment.
    </p>

    <h2 id="supplier-responsibility">The Concrete Supplier's Responsibility</h2>
    <p>
      The supplier (batch plant) is responsible for:
    </p>
    <ul>
      <li><strong>Producing concrete that meets the specified grade</strong> — if you order 25MPa, it should be 25MPa when it leaves the plant</li>
      <li><strong>Providing accurate batch dockets</strong> — showing the mix design, water content, admixtures, and the grade supplied</li>
      <li><strong>Quality control at the plant</strong> — regular testing of materials and mixes to ensure consistency</li>
      <li><strong>Delivering within time limits</strong> — AS 1379 specifies that concrete must be placed within 90 minutes of batching (or less in hot weather)</li>
    </ul>
    <p>
      If the concrete leaves the plant at the correct strength and specification, the supplier has met their obligation. What happens to it after that is where things get complicated.
    </p>

    <h2 id="concreter-responsibility">The Concreter's Responsibility</h2>
    <p>
      As the concreter, you're responsible for:
    </p>
    <ul>
      <li><strong>Checking the batch docket</strong> — confirm the grade, slump, and volume match the specification before you start pouring</li>
      <li><strong>Not adding excessive water</strong> — adding water beyond allowable limits reduces strength. This is probably the most common cause of strength failures that fall on the concreter</li>
      <li><strong>Proper placement</strong> — vibrating the concrete to remove air voids, not over-working the surface</li>
      <li><strong>Proper curing</strong> — concrete needs moisture to reach its design strength. If you don't cure properly (especially in hot or windy conditions), the surface may not reach the specified MPa</li>
      <li><strong>Not over-working the finish</strong> — excessive trowelling brings water and fines to the surface, weakening the top layer</li>
      <li><strong>Rejecting non-compliant loads</strong> — if the <Link to="/articles/concrete-slump-testing-requirements-australia">slump test</Link> is clearly wrong or the concrete looks off, don't pour it</li>
    </ul>

    <h2 id="builder-responsibility">The Builder's Responsibility</h2>
    <p>
      The builder (or principal contractor) is responsible for:
    </p>
    <ul>
      <li><strong>Specifying the correct concrete grade</strong> — as per the engineer's design</li>
      <li><strong>Organising testing</strong> — arranging for test specimens to be made and sent to a NATA-accredited lab</li>
      <li><strong>Scheduling inspections</strong> — ensuring the pre-pour inspection is done before concrete is placed</li>
      <li><strong>Overall project compliance</strong> — the builder is ultimately responsible for ensuring the building complies with the BCA and relevant standards</li>
    </ul>

    <h2 id="engineer-responsibility">The Engineer's Responsibility</h2>
    <p>
      The structural engineer is responsible for:
    </p>
    <ul>
      <li><strong>Designing the slab correctly</strong> — specifying the right MPa grade, slab thickness, and reinforcement for the site conditions</li>
      <li><strong>Specifying testing requirements</strong> — how many tests, when, and the acceptance criteria</li>
      <li><strong>Reviewing results</strong> — assessing whether test results comply with the design requirements</li>
      <li><strong>Advising on remediation</strong> — if concrete fails, the engineer determines whether the slab is acceptable, needs strengthening, or needs replacement</li>
    </ul>

    <h2 id="when-concrete-fails">What Happens When Concrete Fails</h2>
    <p>
      If 28-day cylinder tests come back below the specified strength, the typical process is:
    </p>
    <ol>
      <li><strong>Verify the test results</strong> — check for testing errors, sample handling issues, or lab problems</li>
      <li><strong>Assess the significance</strong> — a result of 24MPa on a 25MPa spec is very different from 18MPa</li>
      <li><strong>Core testing</strong> — the engineer may request core samples be drilled from the actual slab and tested. In-situ strength is often higher than cylinder strength</li>
      <li><strong>Engineering assessment</strong> — the engineer determines whether the slab is fit for purpose at the actual strength achieved</li>
      <li><strong>Remediation or acceptance</strong> — the slab may be accepted as-is (with reduced design life), strengthened (additional supports), or in worst cases, demolished and repoured</li>
    </ol>

    <h2 id="common-causes">Common Causes of Strength Failure</h2>

    <table>
      <thead>
        <tr>
          <th>Cause</th>
          <th>Who's Responsible</th>
          <th>How to Prevent</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Wrong grade supplied</td>
          <td>Supplier</td>
          <td>Check every batch docket before pouring</td>
        </tr>
        <tr>
          <td>Excessive water added on site</td>
          <td>Concreter</td>
          <td>Never add water without supplier approval</td>
        </tr>
        <tr>
          <td>Inadequate curing</td>
          <td>Concreter</td>
          <td>Apply curing compound or keep moist for 7+ days</td>
        </tr>
        <tr>
          <td>Delivery beyond time limit</td>
          <td>Supplier / Concreter</td>
          <td>Note delivery time on docket; reject late loads</td>
        </tr>
        <tr>
          <td>Poor sample handling</td>
          <td>Tester / Lab</td>
          <td>Ensure samples are properly made and cured</td>
        </tr>
        <tr>
          <td>Concrete placed in rain</td>
          <td>Concreter</td>
          <td>Don't pour in heavy rain; protect fresh concrete</td>
        </tr>
      </tbody>
    </table>

    <h2 id="protecting-yourself">Protecting Yourself</h2>
    <p>
      The best protection is documentation:
    </p>
    <ul>
      <li><strong>Keep every batch docket</strong> — these prove what was supplied and when</li>
      <li><strong>Record any water added on site</strong> — and get supplier approval in writing if possible</li>
      <li><strong>Take photos</strong> — of reinforcement, formwork, and the pour process</li>
      <li><strong>Record weather conditions</strong> — temperature, wind, rain on pour day</li>
      <li><strong>Note any <Link to="/articles/concrete-slump-testing-requirements-australia">slump test</Link> results</strong></li>
      <li><strong>Keep curing records</strong> — what curing method was used and for how long</li>
    </ul>
    <p>
      If you can show that the correct grade was supplied, no excess water was added, the pour was done properly, and curing was adequate — you've done your part. Job management software that stores documents and photos per job makes this much easier to maintain.
    </p>

    <h2 id="summary">Summary</h2>
    <p>
      Concrete strength compliance is a shared responsibility. The supplier provides the right mix. The concreter places and cures it properly. The builder coordinates testing. The engineer assesses results. When failures occur, the investigation follows the chain to find where things went wrong. Your best defence is doing the job right and keeping the records to prove it.
    </p>
  </>
);

export default ConcreteStrengthCompliance;

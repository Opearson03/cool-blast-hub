import { Link } from "react-router-dom";

const HourlyVsFixedPrice = () => (
  <>
    <p>
      "Should I quote a fixed price or just charge by the hour?" Every concreter wrestles with this. Both models work — and both can lose money. The right answer depends on the job, the client, and how confident you are in your estimating. Most established concreters use both, picking the one that suits each job.
    </p>

    <h2 id="fixed-price">Fixed Price (Lump Sum)</h2>
    <p>
      You quote a single price for the whole job. The client knows what they'll pay, you know what you'll get — assuming nothing changes.
    </p>

    <h3>When fixed price works</h3>
    <ul>
      <li>Scope is clearly defined (drawings, plans, engineer's spec)</li>
      <li>Site is straightforward and you can predict labour hours</li>
      <li>Client is a homeowner who wants budget certainty</li>
      <li>You have good <Link to="/articles/how-to-quote-concrete-slab-australia">quoting templates</Link> and historical job data</li>
    </ul>

    <h3>When fixed price hurts</h3>
    <ul>
      <li>Drawings are vague or missing</li>
      <li>Site conditions are unknown (especially excavation)</li>
      <li>Builder is the type to expect "extras" without paying for them</li>
      <li>You're new to a job type and don't know your true labour cost yet</li>
    </ul>
    <p>
      See <Link to="/articles/fixed-price-concrete-quotes">why fixed-price quotes lose money</Link> for the deeper view.
    </p>

    <h2 id="hourly">Hourly / Day Rate</h2>
    <p>
      You charge an hourly rate (or day rate) for labour, plus materials at cost-plus-margin. You bill what the job actually takes.
    </p>

    <h3>When hourly works</h3>
    <ul>
      <li>Repair work where the scope can't be properly assessed up front</li>
      <li>Variation-heavy jobs where the client wants flexibility</li>
      <li>Builder jobs on day rate where you're working as labour-only</li>
      <li>Specialist work where surprises are likely (rock, services, awkward access)</li>
    </ul>

    <h3>When hourly hurts</h3>
    <ul>
      <li>Residential clients hate it — they want a number, not an open chequebook</li>
      <li>Hard to win competitive jobs against fixed-price quotes</li>
      <li>You can't be efficient — efficiency reduces your invoice</li>
      <li>Disputes about hours are common and hard to resolve</li>
    </ul>

    <h2 id="comparison">Side-by-Side Comparison</h2>
    <table>
      <thead>
        <tr>
          <th>Factor</th>
          <th>Fixed price</th>
          <th>Hourly</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Risk on overruns</td>
          <td>You wear it</td>
          <td>Client wears it</td>
        </tr>
        <tr>
          <td>Upside on efficiency</td>
          <td>You keep it</td>
          <td>You lose it</td>
        </tr>
        <tr>
          <td>Client preference</td>
          <td>Strong — especially homeowners</td>
          <td>Weak — feels open-ended</td>
        </tr>
        <tr>
          <td>Variation handling</td>
          <td>Needs formal variations</td>
          <td>Naturally absorbed in the rate</td>
        </tr>
        <tr>
          <td>Best for</td>
          <td>Defined scope, known site</td>
          <td>Unknowns, repairs, day-rate subbie work</td>
        </tr>
      </tbody>
    </table>

    <h2 id="hybrid">The Hybrid Approach Most Pros Use</h2>
    <p>
      You don't have to choose one for every job. Common hybrid setups:
    </p>
    <ul>
      <li><strong>Fixed price + provisional sums</strong> — Quote a fixed price for the known scope, with a provisional sum for the unknown bits (e.g. excavation in clay, additional fill, mesh upgrade if engineer requires).</li>
      <li><strong>Fixed price + hourly extras</strong> — Quote a firm price for the slab, with hourly rate for any variations done on site.</li>
      <li><strong>Day rate with cap</strong> — Bill at a day rate but cap the total at an agreed maximum, so the client has certainty.</li>
    </ul>

    <h2 id="setting-rates">Setting Your Hourly Rate Properly</h2>
    <p>
      The most common hourly mistake: charging your award rate (or what you used to earn as an employee) plus a small bump. That's not a business rate — that's a wage.
    </p>
    <p>
      A real hourly charge-out rate has to cover:
    </p>
    <ul>
      <li>Your wage equivalent (what you want to take home)</li>
      <li>Super, leave, sick days, public holidays (~25% loading on wage)</li>
      <li>Vehicle, tools, plant — pro-rated per hour</li>
      <li>Insurance (PL, contract works, tools)</li>
      <li>Overheads (phone, software, accountant, marketing)</li>
      <li>Non-billable hours (quoting, admin, travel between jobs)</li>
      <li>Profit margin on top</li>
    </ul>
    <p>
      For a small concreting business, $110–$160/hour is a realistic charge-out rate for an experienced operator — much higher for finishers in tight markets. Anything below $90/hour and you're probably losing money on every billed hour. See <Link to="/articles/run-profitable-concreting-business-australia">running a profitable concreting business</Link> for the full cost breakdown.
    </p>

    <h2 id="protect-yourself">Protect Yourself Either Way</h2>
    <p>
      Whichever model you use, the same fundamentals apply:
    </p>
    <ul>
      <li>Quote in writing with clear inclusions and exclusions</li>
      <li>Take deposits on residential work</li>
      <li>Document <Link to="/articles/what-is-concrete-variation">variations</Link> as they happen</li>
      <li>Invoice promptly — same day or next day</li>
      <li>Track actual hours and materials so next quote is sharper</li>
    </ul>

    <h2 id="summary">Summary</h2>
    <p>
      Fixed price suits clear-scope jobs and clients who want certainty. Hourly suits unknown scope, repairs, and day-rate subbie work. Most experienced concreters use a hybrid — fixed for the bulk of the work, hourly or provisional for the unknowns. Whichever model you use, set your rates properly, document everything, and never quote a fixed price for work you don't fully understand.
    </p>
  </>
);

export default HourlyVsFixedPrice;

import { Link } from "react-router-dom";

const TrackJobProfitability = () => (
  <>
    <p>
      "How did that job go?" Most concreters answer that question by feel — it felt like a good one, or a tough one. Without numbers, you're guessing. And guesses repeat the same mistakes job after job. Tracking job profitability doesn't have to be complicated. Even a basic system reveals patterns that change the way you quote and which work you chase.
    </p>

    <h2 id="why-track">Why Track Per Job?</h2>
    <p>
      Year-end profit is too late and too vague. It tells you the business made money, but not which jobs, which clients, or which job types. Per-job tracking answers questions that matter:
    </p>
    <ul>
      <li>Are driveways more profitable than house slabs?</li>
      <li>Does Builder A actually pay better than Builder B once variations and slow payment are factored in?</li>
      <li>How accurate is your labour estimating?</li>
      <li>Where are you bleeding money — materials, labour overruns, or unpriced variations?</li>
    </ul>

    <h2 id="what-to-track">What to Capture for Every Job</h2>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Quoted</th>
          <th>Actual</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Concrete (m³)</td>
          <td>From quote</td>
          <td>From dockets</td>
        </tr>
        <tr>
          <td>Concrete cost ($)</td>
          <td>From quote</td>
          <td>From supplier invoices</td>
        </tr>
        <tr>
          <td>Mesh / steel</td>
          <td>From quote</td>
          <td>From supplier invoices</td>
        </tr>
        <tr>
          <td>Formwork & sundries</td>
          <td>From quote</td>
          <td>Actual cost</td>
        </tr>
        <tr>
          <td>Pump / plant hire</td>
          <td>From quote</td>
          <td>From invoices</td>
        </tr>
        <tr>
          <td>Labour hours</td>
          <td>Estimated</td>
          <td>Actual hours × loaded rate</td>
        </tr>
        <tr>
          <td>Variations</td>
          <td>$0 (or expected)</td>
          <td>Sum of approved variations</td>
        </tr>
        <tr>
          <td>Total revenue</td>
          <td>Quote total</td>
          <td>Quote + variations actually paid</td>
        </tr>
        <tr>
          <td>Total cost</td>
          <td>Estimated</td>
          <td>Sum of all actual costs</td>
        </tr>
        <tr>
          <td>Gross profit</td>
          <td>Revenue – cost</td>
          <td>Revenue – cost</td>
        </tr>
        <tr>
          <td>Margin %</td>
          <td>GP / revenue</td>
          <td>GP / revenue</td>
        </tr>
      </tbody>
    </table>

    <h2 id="loaded-labour-rate">Use a Loaded Labour Rate, Not Just Wages</h2>
    <p>
      "Labour cost" isn't just the hourly wage. To compare quoted vs actual labour fairly, use a loaded rate that includes:
    </p>
    <ul>
      <li>Wage</li>
      <li>Super (~11.5%)</li>
      <li>Workers comp (~3–6% depending on state)</li>
      <li>Leave loading and public holidays (~15–20% on top)</li>
      <li>Allowances, RDOs, supervisory time</li>
    </ul>
    <p>
      Most concreting wages of $35/hour become $50–$60/hour when fully loaded. Use that number when costing labour against jobs.
    </p>

    <h2 id="simple-system">A Simple System That Actually Gets Used</h2>
    <p>
      Don't aim for a perfect system. Aim for one you'll maintain on a Friday afternoon. Three options that work:
    </p>

    <h3>Option 1: One spreadsheet row per job</h3>
    <p>
      Columns: Job name, quote total, materials cost, labour hours, plant cost, variations, total paid, margin %. Add a row when the job invoices, fill in actuals when supplier invoices land, finalise when the job is paid. Sortable by builder, job type, month.
    </p>

    <h3>Option 2: Job folders</h3>
    <p>
      A folder per job (digital or paper). All quotes, dockets, supplier invoices, variation approvals, and the final invoice in one place. Add a one-page summary sheet on the front. Easy to find when something is disputed.
    </p>

    <h3>Option 3: Job management software</h3>
    <p>
      A purpose-built tool (PourHub, simPRO, AroFlo, etc.) tracks all of this automatically once set up. Worth the cost when you're doing more than a handful of jobs a month — it pays for itself in better visibility and faster invoicing.
    </p>

    <h2 id="when-to-update">When to Update the Numbers</h2>
    <ul>
      <li><strong>End of pour day</strong> — note actual hours, concrete delivered, any variations</li>
      <li><strong>When supplier invoices arrive</strong> — record actual material costs</li>
      <li><strong>When the client pays</strong> — close out the job, calculate actual margin, save the file</li>
    </ul>
    <p>
      Don't try to do it all at year end. The detail is gone by then.
    </p>

    <h2 id="what-to-look-for">What the Numbers Tell You</h2>
    <p>
      After 10–20 tracked jobs, patterns emerge:
    </p>
    <ul>
      <li><strong>Labour overruns</strong> — your hour estimates are consistently 20% under reality. Adjust your quoting.</li>
      <li><strong>Material waste</strong> — actual concrete is 8% over quote average. Increase your <Link to="/articles/concrete-waste-allowance">waste allowance</Link>.</li>
      <li><strong>Variation leakage</strong> — variations done but not charged. Tighten your <Link to="/articles/document-concrete-variations">variation process</Link>.</li>
      <li><strong>Client profitability</strong> — Builder A is 22% margin average, Builder B is 7%. Time to drop Builder B or reprice.</li>
      <li><strong>Job-type margin</strong> — driveways yield 25%, house slabs yield 12%. Chase more driveways.</li>
    </ul>

    <h2 id="job-debrief">Run a Quick Debrief on Every Job</h2>
    <p>
      Five-minute habit at job close. Ask:
    </p>
    <ul>
      <li>Did we hit the quoted margin?</li>
      <li>If not, why? (underquote, scope creep, weather, crew issue, supplier problem)</li>
      <li>What would we change next time?</li>
      <li>Should we update the price list?</li>
    </ul>
    <p>
      Write the answers somewhere you'll see them at the next quote.
    </p>

    <h2 id="connect-to-business">Connect Job Profit to Business Profit</h2>
    <p>
      Job-level tracking feeds into the bigger picture covered in <Link to="/articles/run-profitable-concreting-business-australia">running a profitable concreting business</Link>. Without per-job data, you can't fix the patterns that cause businesses to fail (see <Link to="/articles/concreting-business-fail-reasons">why concreting businesses fail</Link>).
    </p>

    <h2 id="summary">Summary</h2>
    <p>
      You can't improve what you don't measure. Even a basic per-job spreadsheet — quoted vs actual on materials, labour, variations, and final paid — surfaces the patterns that change which work you chase and how you quote. Build the habit job by job, debrief at every close, and let the numbers tell you what's actually working.
    </p>
  </>
);

export default TrackJobProfitability;

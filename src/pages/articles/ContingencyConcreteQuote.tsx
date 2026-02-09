import { Link } from "react-router-dom";

const ContingencyConcreteQuote = () => (
  <>
    <p>
      Every concreter has had that job where something unexpected ate into the margin. Rain delayed the pour. The ground was worse than expected. The builder changed the levels at the last minute. Contingency is how you protect yourself from these unknowns — but how much is enough, and how do you include it without pricing yourself out of the job?
    </p>

    <h2 id="what-is-contingency">What Is Contingency in a Concrete Quote?</h2>
    <p>
      Contingency is a buffer built into your quote to cover costs you can't predict precisely at the time of quoting. It's not profit — it's risk management. If everything goes perfectly, you keep the contingency as extra margin. If things go sideways, it absorbs the unexpected costs without wiping out your profit.
    </p>
    <p>
      Think of it as insurance you charge the client for — the price of uncertainty.
    </p>

    <h2 id="how-much-contingency">How Much Contingency Should You Add?</h2>
    <p>
      There's no single right number, but here are practical guidelines based on job type and risk:
    </p>

    <table>
      <thead>
        <tr>
          <th>Job Type / Risk Level</th>
          <th>Suggested Contingency</th>
          <th>Why</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Simple slab, flat site, good access</td>
          <td>5%</td>
          <td>Low risk, few unknowns</td>
        </tr>
        <tr>
          <td>Standard residential slab</td>
          <td>5–10%</td>
          <td>Normal risk, some variables</td>
        </tr>
        <tr>
          <td>Sloping site or difficult access</td>
          <td>10–15%</td>
          <td>Excavation, pump requirements uncertain</td>
        </tr>
        <tr>
          <td>Reactive clay / unknown soil</td>
          <td>10–15%</td>
          <td>Footing depths may increase</td>
        </tr>
        <tr>
          <td>No engineering drawings yet</td>
          <td>15–20%</td>
          <td>Scope not fully defined</td>
        </tr>
        <tr>
          <td>Commercial / multi-pour job</td>
          <td>10–15%</td>
          <td>More coordination, more variables</td>
        </tr>
      </tbody>
    </table>

    <h2 id="what-contingency-covers">What Should Contingency Cover?</h2>
    <p>
      Contingency isn't a catch-all. It should cover reasonable unknowns, not things you should have measured or priced. Common items contingency absorbs:
    </p>
    <ul>
      <li><strong>Weather delays</strong> — a rained-out pour day costs you crew wages and rescheduling</li>
      <li><strong>Ground conditions</strong> — soft spots, unexpected rock, water in trenches</li>
      <li><strong>Concrete waste</strong> — actual volume almost always exceeds theoretical (see <Link to="/articles/concrete-waste-allowance">waste allowance guide</Link>)</li>
      <li><strong>Minor scope changes</strong> — builder asks for an extra step-down or different finish</li>
      <li><strong>Supplier price increases</strong> — if the job is months away, material costs may rise</li>
      <li><strong>Access issues</strong> — truck can't get as close as expected, longer pump lines needed</li>
    </ul>

    <h2 id="contingency-vs-variation">Contingency vs Variations</h2>
    <p>
      Contingency covers small, foreseeable risks that are hard to price exactly. <Link to="/articles/what-is-concrete-variation">Variations</Link> cover significant scope changes requested by the client or builder after the quote is accepted.
    </p>
    <p>
      Don't use contingency to absorb major changes. If the builder changes the slab design or adds 20 linear metres of footing, that's a variation — not something your 10% contingency should cover.
    </p>
    <p>
      <strong>Rule of thumb:</strong> If the change would take more than a paragraph to describe, it's a variation. Price it separately and get written approval.
    </p>

    <h2 id="how-to-include">How to Include Contingency in Your Quote</h2>
    <p>
      There are two approaches:
    </p>
    <h3>Option 1: Build it into your rates</h3>
    <p>
      Add your contingency percentage across all line items. The client sees a single price and doesn't know what's buffer and what's base cost. This is the most common approach and avoids awkward conversations about "what's the contingency for?"
    </p>

    <h3>Option 2: Show it as a separate line item</h3>
    <p>
      Some concreters include a visible "contingency" or "site conditions allowance" line in their quote. This is more transparent and can be useful on larger jobs where the client expects it. However, some clients will try to negotiate it down or remove it — which defeats the purpose.
    </p>

    <p>
      For most residential work, Option 1 is simpler and less likely to cause friction. For commercial work or builder contracts, Option 2 is more standard.
    </p>

    <h2 id="not-enough-contingency">What Happens When You Don't Add Enough</h2>
    <p>
      Without contingency, every minor issue comes straight out of your profit. Consider a $15,000 slab job with a 15% profit margin — that's $2,250 in profit. Now add:
    </p>
    <ul>
      <li>One rain delay: $500–$800 (crew wages, rescheduling)</li>
      <li>Extra 0.5m³ concrete for uneven ground: $150</li>
      <li>Pump waited 20 minutes extra: $50</li>
      <li>Extra formwork for step-down not on plans: $200</li>
    </ul>
    <p>
      That's $900–$1,200 in unexpected costs. Without contingency, your $2,250 profit just dropped to $1,050. With a 10% contingency ($1,500 built in), you're still ahead.
    </p>

    <h2 id="summary">Summary</h2>
    <p>
      Adding contingency isn't about padding your quote — it's about pricing reality. Things go wrong on every job. The question isn't whether you'll face unexpected costs, but whether you've planned for them. Start with 5–10% for straightforward jobs and increase for higher-risk work. Your future self will thank you.
    </p>
  </>
);

export default ContingencyConcreteQuote;

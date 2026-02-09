import { Link } from "react-router-dom";

const ConcreteWasteAllowance = () => (
  <div>
    <p>
      Every concrete pour in Australia involves some waste. Whether it's concrete left in the agitator, minor over-excavation, formwork bulge, or spillage during placement, you'll always use more than the theoretical calculated volume. Understanding how much to allow for waste is critical for accurate ordering and profitable quoting. This guide explains standard waste allowances and how to adjust them for different job types.
    </p>

    <h2 id="why-waste-happens">Why Concrete Waste Is Unavoidable</h2>
    <p>
      Concrete waste occurs for several reasons, most of which are difficult to eliminate entirely:
    </p>
    <ul>
      <li><strong>Retained concrete:</strong> Every agitator truck retains 50–150 litres of concrete in the drum and chute that can't be fully discharged</li>
      <li><strong>Over-excavation:</strong> Trenches and footings are rarely excavated to exact dimensions — even small variations add volume</li>
      <li><strong>Formwork movement:</strong> Boards can bow or shift slightly under the weight of wet concrete, increasing the slab thickness</li>
      <li><strong>Sub-base variation:</strong> Uneven compacted fill means some areas of the slab are thicker than designed</li>
      <li><strong>Spillage:</strong> Concrete spilt during pump line connections, truck positioning, or placement</li>
      <li><strong>Finishing requirements:</strong> Screeding to a level surface sometimes requires extra concrete in low spots</li>
    </ul>

    <h2 id="standard-allowances">Standard Waste Allowances</h2>
    <p>
      The industry-standard waste allowance in Australia varies by job complexity:
    </p>
    <table>
      <thead>
        <tr>
          <th>Job Type</th>
          <th>Recommended Waste %</th>
          <th>Rationale</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Simple rectangular slab on flat ground</td>
          <td>5%</td>
          <td>Minimal variables, good formwork control</td>
        </tr>
        <tr>
          <td>Standard residential slab with edge beams</td>
          <td>7–8%</td>
          <td>Edge beam over-excavation, formwork tolerances</td>
        </tr>
        <tr>
          <td>Complex shapes or multiple thickenings</td>
          <td>10%</td>
          <td>More cutting, forming, and placement challenges</td>
        </tr>
        <tr>
          <td>Sloping site or stepped slab</td>
          <td>10–12%</td>
          <td>Variable depths, increased spillage risk</td>
        </tr>
        <tr>
          <td>Strip footings (excavated)</td>
          <td>10–15%</td>
          <td>Trench walls rarely straight, over-dig common</td>
        </tr>
        <tr>
          <td><Link to="/articles/waffle-pod-slabs-pros-cons-cost">Waffle pod slabs</Link></td>
          <td>5–8%</td>
          <td>Pods control shape well, but rib filling adds some</td>
        </tr>
      </tbody>
    </table>

    <h2 id="calculating-order-volume">Calculating Your Order Volume</h2>
    <p>
      The formula is straightforward:
    </p>
    <p><strong>Order volume = Calculated volume × (1 + waste percentage)</strong></p>
    <p>
      For example, if your <Link to="/articles/how-much-concrete-do-i-need">calculated volume</Link> is 15.2 m³ and you're using an 8% waste allowance:
    </p>
    <p><strong>15.2 × 1.08 = 16.4 m³</strong></p>
    <p>
      Most concreters round up to the nearest 0.5 m³ when ordering, so you'd order 16.5 m³ in this case. Some experienced concreters round to the nearest whole number for additional safety margin.
    </p>

    <h2 id="cost-of-waste">The Cost of Getting It Wrong</h2>
    <h3 id="under-ordering">Under-Ordering</h3>
    <p>
      Running short mid-pour is one of the most expensive mistakes in concreting:
    </p>
    <ul>
      <li><strong>Second delivery fee:</strong> $150–$400+ depending on supplier and distance</li>
      <li><strong>Cold joint risk:</strong> If the gap between loads is too long, the joint between old and new concrete is weakened</li>
      <li><strong>Crew downtime:</strong> Your team waits while the next truck is dispatched — that's labour cost with no productivity</li>
      <li><strong>Quality compromise:</strong> Rushed placement of the second load can affect finish quality</li>
    </ul>

    <h3 id="over-ordering">Over-Ordering</h3>
    <p>
      Ordering too much is wasteful but far less damaging:
    </p>
    <ul>
      <li><strong>Returned concrete:</strong> Most suppliers charge a return fee of $50–$150 per m³ of unused concrete sent back</li>
      <li><strong>Disposal:</strong> Excess concrete can sometimes be used for paths, mower strips, or other small jobs on site</li>
      <li><strong>Environmental:</strong> Unused concrete must be disposed of responsibly — most suppliers have washout facilities</li>
    </ul>
    <p>
      The cost of 0.5–1.0 m³ of "extra" concrete ($130–$310) is almost always less than the cost of being short. This is why experienced concreters err on the side of over-ordering.
    </p>

    <h2 id="reducing-waste">How to Minimise Waste</h2>
    <ul>
      <li><strong>Accurate formwork:</strong> Well-built, braced formwork at the correct dimensions reduces over-pour</li>
      <li><strong>Level sub-base:</strong> A properly compacted and levelled sub-base ensures consistent slab thickness</li>
      <li><strong>Precise excavation:</strong> For strip footings, use a machine operator experienced in footing excavation</li>
      <li><strong>Pre-pour check:</strong> Measure actual dimensions before ordering — don't rely solely on plan measurements</li>
      <li><strong>Communicate with the supplier:</strong> Order with a "hold" option — some suppliers will let you hold the last 0.5–1.0 m³ on the truck pending your final call</li>
      <li><strong>Plan for surplus:</strong> Identify small fill jobs on site where excess concrete can be used productively</li>
    </ul>

    <h2 id="quoting-for-waste">Including Waste in Your Quote</h2>
    <p>
      When <Link to="/articles/how-to-quote-concrete-slab-australia">preparing quotes</Link>, waste allowance should be built into your concrete cost — not shown as a separate line item. Clients don't want to see they're paying for "waste." Instead:
    </p>
    <ul>
      <li>Calculate the total volume including waste</li>
      <li>Price concrete at the total order volume</li>
      <li>Present the total concrete cost as a single figure</li>
    </ul>
    <p>
      This is one of the <Link to="/articles/what-concreters-forget-in-quotes">commonly missed items</Link> in quotes — concreters who price only the theoretical volume end up absorbing waste costs from their margin. Over a year's worth of jobs, that can amount to thousands of dollars in lost profit.
    </p>

    <h2 id="summary">Key Takeaways</h2>
    <ul>
      <li>Always add a waste allowance — 5% minimum, 7–10% for most residential work</li>
      <li>Under-ordering is far more costly than over-ordering</li>
      <li>Build waste into your quote pricing, not as a visible line item</li>
      <li>Good formwork, accurate excavation, and a level sub-base reduce waste</li>
      <li>Round up when ordering — the extra cost is cheap insurance</li>
    </ul>
  </div>
);

export default ConcreteWasteAllowance;

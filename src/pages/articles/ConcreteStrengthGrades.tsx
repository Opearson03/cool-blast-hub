import { Link } from "react-router-dom";

const ConcreteStrengthGrades = () => (
  <div>
    <p>
      Concrete strength grades in Australia are specified in megapascals (MPa) and indicate the characteristic compressive strength of the concrete at 28 days. Choosing the right grade is critical — too low and the structure may not meet engineering requirements or Australian Standards; too high and you're paying for performance you don't need. This guide explains the common grades, what they're used for, and how to select the right one.
    </p>

    <h2 id="what-mpa-means">What MPa Actually Means</h2>
    <p>
      MPa stands for megapascals — a unit of pressure. When we say concrete is "32 MPa", it means a test cylinder of that concrete can withstand 32 megapascals of compressive force before failing. Testing is performed at 28 days after placement, in accordance with <Link to="/articles/concrete-strength-compliance-responsibility">AS 1012</Link>.
    </p>
    <p>
      The "characteristic strength" (f'c) is a statistical measure: it's the strength below which no more than 5% of test results are expected to fall. This means most concrete will actually be stronger than its specified grade.
    </p>

    <h2 id="common-grades">Common Concrete Grades in Australia</h2>
    <table>
      <thead>
        <tr>
          <th>Grade (MPa)</th>
          <th>Common Name</th>
          <th>Typical Applications</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>20 MPa</td>
          <td>N20</td>
          <td>Footpaths, garden slabs, non-structural work, house blinding</td>
        </tr>
        <tr>
          <td>25 MPa</td>
          <td>N25</td>
          <td>Driveways, shed slabs, light-duty residential slabs, footings</td>
        </tr>
        <tr>
          <td>32 MPa</td>
          <td>N32</td>
          <td>Residential house slabs, suspended slabs, structural footings</td>
        </tr>
        <tr>
          <td>40 MPa</td>
          <td>N40</td>
          <td>Commercial slabs, heavy-duty industrial floors, bridge decks</td>
        </tr>
        <tr>
          <td>50 MPa</td>
          <td>N50</td>
          <td>High-rise construction, precast elements, heavy industrial</td>
        </tr>
      </tbody>
    </table>
    <p>
      The "N" prefix denotes normal-class concrete. Special-class concrete (S-grade) is used where additional properties like durability or chemical resistance are required, and is specified by the project engineer.
    </p>

    <h2 id="residential-grades">Grades for Residential Work</h2>
    <p>
      For most residential concreting in Australia, three grades dominate:
    </p>
    <h3 id="n20-grade">N20 — Non-Structural</h3>
    <p>
      Used for paths, garden edging, mower strips, and blinding layers. N20 is the minimum grade most suppliers will batch. It's not suitable for any load-bearing application.
    </p>
    <h3 id="n25-grade">N25 — Light Residential</h3>
    <p>
      The workhorse grade for driveways, shed slabs, and light-duty applications. Many engineers specify N25 for garage slabs and carports where vehicle loads are expected but structural demands are moderate.
    </p>
    <h3 id="n32-grade">N32 — Standard Residential</h3>
    <p>
      The most commonly specified grade for residential house slabs in Australia. <Link to="/articles/australian-standards-residential-concrete">AS 2870</Link> typically requires a minimum of N25 for residential slabs, but most engineers default to N32 for its additional strength margin and better workability characteristics.
    </p>
    <p>
      N32 is also the standard choice for suspended slabs, structural footings, and retaining walls in residential construction.
    </p>

    <h2 id="exposure-classification">Exposure Classification and Durability</h2>
    <p>
      AS 3600 requires concrete to meet minimum durability requirements based on exposure classification. This can override the structural strength requirement:
    </p>
    <table>
      <thead>
        <tr>
          <th>Exposure Class</th>
          <th>Environment</th>
          <th>Min. f'c (MPa)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>A1</td>
          <td>Inland, protected from weather</td>
          <td>20</td>
        </tr>
        <tr>
          <td>A2</td>
          <td>Inland, exposed to weather</td>
          <td>25</td>
        </tr>
        <tr>
          <td>B1</td>
          <td>Near coast (1–50 km), exposed</td>
          <td>32</td>
        </tr>
        <tr>
          <td>B2</td>
          <td>Coastal (up to 1 km from sea)</td>
          <td>40</td>
        </tr>
        <tr>
          <td>C1/C2</td>
          <td>Severe marine, aggressive soil</td>
          <td>50</td>
        </tr>
      </tbody>
    </table>
    <p>
      This means a simple house slab within 1 km of the coast may require N40 concrete purely for durability, even though N25 would be structurally adequate. Always check the engineer's specification — it accounts for both structural and durability requirements.
    </p>

    <h2 id="slump-and-grade">Slump and Its Relationship to Grade</h2>
    <p>
      <Link to="/articles/concrete-slump-testing-requirements-australia">Slump</Link> measures workability, not strength. However, higher-grade concrete often has different workability characteristics due to its mix design. Common slump values:
    </p>
    <ul>
      <li><strong>80 mm slump:</strong> Standard for slabs placed by direct discharge or pump</li>
      <li><strong>100 mm slump:</strong> Common for pumped applications</li>
      <li><strong>120 mm slump:</strong> Used for difficult placement conditions</li>
    </ul>
    <p>
      Adding water on-site to increase slump reduces strength. If you need higher workability, request it from the supplier at batching — they'll adjust the mix design using plasticisers to maintain the specified MPa.
    </p>

    <h2 id="cost-implications">Cost Implications</h2>
    <p>
      Higher-grade concrete costs more per cubic metre. As a rough guide for 2026 pricing:
    </p>
    <table>
      <thead>
        <tr>
          <th>Grade</th>
          <th>Approx. Cost per m³ (ex. GST)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>N20</td><td>$230–$270</td></tr>
        <tr><td>N25</td><td>$245–$290</td></tr>
        <tr><td>N32</td><td>$260–$310</td></tr>
        <tr><td>N40</td><td>$290–$350</td></tr>
        <tr><td>N50</td><td>$330–$400</td></tr>
      </tbody>
    </table>
    <p>
      Prices vary by region, supplier, and order size. The difference between N25 and N32 is typically only $15–$25 per m³ — on a 12 m³ house slab, that's roughly $180–$300. Given the structural benefits, most concreters default to N32 unless the specification says otherwise.
    </p>

    <h2 id="specifying-correctly">Getting the Grade Right</h2>
    <p>
      The golden rule: <strong>always pour the grade specified on the engineer's drawings</strong>. Never downgrade to save money — you risk non-compliance, structural issues, and personal liability. If no engineer's specification exists (e.g., a simple garden path), N20 or N25 is generally appropriate, but check local council requirements.
    </p>
    <p>
      When <Link to="/articles/how-to-quote-concrete-slab-australia">quoting a job</Link>, always confirm the specified grade early. It affects your <Link to="/articles/concrete-pricing-per-square-metre-australia">pricing per square metre</Link> and ensures your quote is accurate from the start.
    </p>
  </div>
);

export default ConcreteStrengthGrades;

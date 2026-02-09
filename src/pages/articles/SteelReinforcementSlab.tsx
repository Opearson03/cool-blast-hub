import { Link } from "react-router-dom";

const SteelReinforcementSlab = () => (
  <div>
    <p>
      Steel reinforcement is essential in almost every concrete slab poured in Australia. Concrete is strong in compression but weak in tension — steel provides the tensile strength needed to resist cracking, support loads, and meet Australian Standards. This guide covers the types of reinforcement used in residential and commercial slabs, how to read specifications, and what concreters need to know for accurate quoting and compliant placement.
    </p>

    <h2 id="why-reinforcement">Why Concrete Needs Steel</h2>
    <p>
      Unreinforced concrete cracks under tension, bending, and shrinkage. Steel reinforcement:
    </p>
    <ul>
      <li>Controls crack width and spacing</li>
      <li>Transfers loads across joints and cracks</li>
      <li>Provides structural capacity for bending (in suspended and ground slabs)</li>
      <li>Resists shrinkage and temperature stresses</li>
      <li>Satisfies <Link to="/articles/australian-standards-residential-concrete">AS 3600</Link> minimum reinforcement requirements</li>
    </ul>
    <p>
      Even "non-structural" slabs like driveways typically require mesh reinforcement to control cracking and meet council or engineer requirements.
    </p>

    <h2 id="types-of-reinforcement">Types of Steel Reinforcement</h2>
    <h3 id="mesh-reinforcement">Mesh (Fabric) Reinforcement</h3>
    <p>
      Welded wire mesh is the most common reinforcement for residential slabs. It comes in flat sheets (typically 6 m × 2.4 m) or rolls, with a grid pattern of steel wires welded at intersections.
    </p>
    <table>
      <thead>
        <tr>
          <th>Mesh Type</th>
          <th>Wire Diameter</th>
          <th>Grid Spacing</th>
          <th>Common Use</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>SL62</td>
          <td>6 mm</td>
          <td>200 mm × 200 mm</td>
          <td>Paths, light-duty slabs</td>
        </tr>
        <tr>
          <td>SL72</td>
          <td>7 mm</td>
          <td>200 mm × 200 mm</td>
          <td>Garage slabs, driveways</td>
        </tr>
        <tr>
          <td>SL82</td>
          <td>8 mm</td>
          <td>200 mm × 200 mm</td>
          <td>House slabs (most common)</td>
        </tr>
        <tr>
          <td>SL92</td>
          <td>9 mm</td>
          <td>200 mm × 200 mm</td>
          <td>Heavy residential, light commercial</td>
        </tr>
        <tr>
          <td>SL102</td>
          <td>10 mm</td>
          <td>200 mm × 200 mm</td>
          <td>Commercial, industrial slabs</td>
        </tr>
      </tbody>
    </table>
    <p>
      The "SL" prefix denotes square mesh with longitudinal bars. "RL" mesh has rectangular spacing (e.g., RL718 has 7 mm bars at 100 mm spacing in one direction and 8 mm at 200 mm in the other).
    </p>

    <h3 id="bar-reinforcement">Bar (Rebar) Reinforcement</h3>
    <p>
      Deformed reinforcing bars (rebar) are used for edge beams, thickenings, suspended slabs, and where mesh doesn't provide enough capacity. Common sizes:
    </p>
    <ul>
      <li><strong>N12:</strong> 12 mm diameter — edge beams, small footings</li>
      <li><strong>N16:</strong> 16 mm diameter — standard structural footings and beams</li>
      <li><strong>N20:</strong> 20 mm diameter — heavy footings, retaining walls</li>
      <li><strong>N24/N28:</strong> Larger bars for commercial and heavy structural work</li>
    </ul>
    <p>
      The "N" prefix indicates normal ductility class (500 MPa yield strength). "L" class is low ductility and is used for mesh; "N" class is required for all bar reinforcement in structural applications.
    </p>

    <h2 id="typical-slab-specs">Typical Residential Slab Specifications</h2>
    <p>
      A standard residential house slab designed to <Link to="/articles/as-2870-explained-simply">AS 2870</Link> typically includes:
    </p>
    <ul>
      <li><strong>Slab mesh:</strong> SL82 (one layer, centrally placed or as specified)</li>
      <li><strong>Edge beams:</strong> 2 × N12 top, 2 × N12 bottom (or as per engineer's design)</li>
      <li><strong>Internal beams:</strong> 2 × N12 bottom (under load-bearing walls)</li>
      <li><strong>Ligatures:</strong> R10 ties at 300 mm centres in beams</li>
      <li><strong>Lapping:</strong> Minimum 500 mm mesh overlap, bar splices per AS 3600</li>
    </ul>
    <p>
      Always follow the engineer's drawings precisely. These are typical values — actual specifications vary with soil class, building loads, and design method.
    </p>

    <h2 id="cover-and-placement">Concrete Cover and Placement</h2>
    <p>
      Cover is the distance between the reinforcement and the nearest concrete surface. Minimum cover protects steel from corrosion and is specified in AS 3600 based on exposure classification:
    </p>
    <table>
      <thead>
        <tr>
          <th>Location</th>
          <th>Exposure Class</th>
          <th>Min. Cover</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Slab on ground (top)</td>
          <td>A1/A2</td>
          <td>20–25 mm</td>
        </tr>
        <tr>
          <td>Slab on ground (bottom)</td>
          <td>A1/A2</td>
          <td>30–40 mm</td>
        </tr>
        <tr>
          <td>External exposed</td>
          <td>B1</td>
          <td>40 mm</td>
        </tr>
        <tr>
          <td>Coastal</td>
          <td>B2</td>
          <td>45–50 mm</td>
        </tr>
      </tbody>
    </table>
    <p>
      Use bar chairs (plastic or concrete) to support mesh and rebar at the correct height. Mesh sitting on the ground or kicked down during the pour provides zero structural benefit — it must be at the correct position within the slab.
    </p>

    <h2 id="quoting-steel">Quoting for Steel Reinforcement</h2>
    <p>
      When <Link to="/articles/how-to-quote-concrete-slab-australia">preparing a quote</Link>, steel is one of the costs concreters commonly underestimate. Account for:
    </p>
    <ul>
      <li><strong>Mesh sheets:</strong> Calculate the number of sheets needed, including lapping allowances (add ~15% for laps and waste)</li>
      <li><strong>Rebar:</strong> Measure total lineal metres from the drawings, add 10% for laps and cutting waste</li>
      <li><strong>Bar chairs:</strong> Approximately 4–6 per square metre for mesh support</li>
      <li><strong>Tie wire:</strong> Budget for 1–2 kg per 50 m² of mesh</li>
      <li><strong>Labour:</strong> Fixing steel typically takes 1–2 hours per 20 m² for experienced teams</li>
    </ul>
    <p>
      Steel prices fluctuate with global markets. Check current supplier pricing when quoting, and consider including a <Link to="/articles/contingency-concrete-quote">contingency allowance</Link> for material price changes on jobs with long lead times.
    </p>

    <h2 id="common-mistakes">Common Reinforcement Mistakes</h2>
    <ul>
      <li><strong>Insufficient lapping:</strong> Mesh should overlap by at least one full grid square (200 mm minimum), with many engineers requiring 300–500 mm</li>
      <li><strong>Wrong cover:</strong> Mesh too high or too low in the slab compromises both strength and durability</li>
      <li><strong>Missing chairs:</strong> Mesh that collapses during the pour is useless reinforcement</li>
      <li><strong>Substituting grades:</strong> Never swap SL72 for SL82 or change bar sizes without engineer approval</li>
      <li><strong>Inadequate edge beam steel:</strong> Edge beams carry significant loads — missing or incorrectly placed rebar is a serious compliance issue</li>
    </ul>
    <p>
      Reinforcement placement is inspected before every pour. Getting it right the first time avoids delays, re-work, and the cost of a failed inspection.
    </p>
  </div>
);

export default SteelReinforcementSlab;

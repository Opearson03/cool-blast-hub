import { Link } from "react-router-dom";

const HowMuchConcreteDoINeed = () => (
  <div>
    <p>
      Ordering the right amount of concrete is one of the most important parts of any pour. Order too little and you're left short mid-pour — a nightmare scenario that can compromise structural integrity. Order too much and you're paying for waste that gets sent back or dumped. This guide walks you through how to calculate concrete volume accurately for common residential and commercial jobs in Australia.
    </p>

    <h2 id="basic-volume-formula">The Basic Volume Formula</h2>
    <p>
      Concrete is ordered in cubic metres (m³). The fundamental formula is straightforward:
    </p>
    <p><strong>Volume (m³) = Length (m) × Width (m) × Depth (m)</strong></p>
    <p>
      For example, a simple rectangular slab that is 10 m long, 5 m wide, and 100 mm (0.1 m) thick requires:
    </p>
    <p><strong>10 × 5 × 0.1 = 5.0 m³</strong></p>
    <p>
      Always convert millimetres to metres before calculating. The most common mistake concreters see from DIYers is forgetting this step and ending up with wildly incorrect figures.
    </p>

    <h2 id="common-slab-calculations">Common Slab Calculations</h2>
    <p>
      Here are typical volume calculations for common residential concrete jobs:
    </p>
    <table>
      <thead>
        <tr>
          <th>Job Type</th>
          <th>Typical Dimensions</th>
          <th>Approx. Volume</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Single garage slab</td>
          <td>3 m × 6 m × 100 mm</td>
          <td>1.8 m³</td>
        </tr>
        <tr>
          <td>Double garage slab</td>
          <td>6 m × 6 m × 100 mm</td>
          <td>3.6 m³</td>
        </tr>
        <tr>
          <td>Driveway (standard)</td>
          <td>3 m × 15 m × 125 mm</td>
          <td>5.6 m³</td>
        </tr>
        <tr>
          <td>House slab (average)</td>
          <td>12 m × 10 m × 100 mm</td>
          <td>12.0 m³ (slab only)</td>
        </tr>
        <tr>
          <td>Footpath</td>
          <td>1.2 m × 10 m × 75 mm</td>
          <td>0.9 m³</td>
        </tr>
        <tr>
          <td>Shed slab</td>
          <td>6 m × 9 m × 100 mm</td>
          <td>5.4 m³</td>
        </tr>
      </tbody>
    </table>
    <p>
      These figures represent slab volume only. You'll also need to account for edge beams, thickenings, and any step-downs, which can add 15–30% more concrete depending on the design.
    </p>

    <h2 id="calculating-edge-beams">Calculating Edge Beams and Thickenings</h2>
    <p>
      Most residential slabs in Australia include edge beams (also called edge thickenings) that extend deeper than the slab itself. A typical edge beam might be 300 mm deep × 300 mm wide around the full perimeter.
    </p>
    <p>
      To calculate edge beam volume:
    </p>
    <p><strong>Edge beam volume = Perimeter (m) × Beam width (m) × (Beam depth − Slab depth) (m)</strong></p>
    <p>
      For a 10 m × 12 m slab with 300 mm × 300 mm edge beams on a 100 mm slab:
    </p>
    <ul>
      <li>Perimeter = 2 × (10 + 12) = 44 m</li>
      <li>Additional depth = 300 mm − 100 mm = 200 mm = 0.2 m</li>
      <li>Edge beam volume = 44 × 0.3 × 0.2 = 2.64 m³</li>
    </ul>
    <p>
      Internal thickenings under load-bearing walls follow the same principle. Check the engineer's drawings for exact dimensions — these vary significantly between designs.
    </p>

    <h2 id="irregular-shapes">Handling Irregular Shapes</h2>
    <p>
      Not every slab is a perfect rectangle. For L-shaped, curved, or irregular areas:
    </p>
    <ul>
      <li><strong>Break it into rectangles:</strong> Divide the area into simple rectangular sections, calculate each separately, then add them together</li>
      <li><strong>Circular areas:</strong> Use π × r² × depth (where r is the radius in metres)</li>
      <li><strong>Triangular sections:</strong> Use 0.5 × base × height × depth</li>
      <li><strong>Curved edges:</strong> Approximate with small rectangular segments or use the average of the inner and outer dimensions</li>
    </ul>
    <p>
      For complex shapes, digital takeoff tools can measure areas directly from plans, reducing calculation errors significantly.
    </p>

    <h2 id="waste-allowance">Adding a Waste Allowance</h2>
    <p>
      You should always order more concrete than your calculated volume. The standard <Link to="/articles/concrete-waste-allowance">waste allowance in Australia</Link> is typically 5–10%, depending on the job:
    </p>
    <ul>
      <li><strong>5%</strong> — Simple rectangular slabs with good formwork on flat ground</li>
      <li><strong>7–8%</strong> — Standard residential work with some complexity</li>
      <li><strong>10%+</strong> — Complex shapes, sloping sites, or jobs with many thickenings</li>
    </ul>
    <p>
      This allowance covers minor over-excavation, formwork bulging, uneven sub-base, spillage during placement, and the concrete left in the agitator truck that can't be fully discharged.
    </p>

    <h2 id="waffle-pod-slabs">Waffle Pod Slab Calculations</h2>
    <p>
      <Link to="/articles/waffle-pod-slabs-pros-cons-cost">Waffle pod slabs</Link> use polystyrene void formers to reduce concrete volume. Calculating the volume requires subtracting the pod volumes from the total slab area:
    </p>
    <ul>
      <li>Calculate the total slab volume as if it were a conventional slab at the full depth</li>
      <li>Count the number of pods and calculate their total volume</li>
      <li>Subtract pod volume from total volume</li>
      <li>Add rib and edge beam volumes</li>
    </ul>
    <p>
      Standard pods are typically 1090 mm × 1090 mm × 225 mm. The ribs between pods (usually 110 mm wide) and perimeter beams still need concrete. Most engineers' drawings will specify the expected concrete volume — always cross-check your calculations against theirs.
    </p>

    <h2 id="ordering-tips">Practical Ordering Tips</h2>
    <ul>
      <li><strong>Minimum order:</strong> Most Australian suppliers have a minimum order of 0.5–1.0 m³, with a short-load fee for orders under 3–4 m³</li>
      <li><strong>Truck capacity:</strong> A standard agitator carries 5–6 m³. Plan your pour timing around truck arrivals</li>
      <li><strong>Over-ordering is cheaper than under-ordering:</strong> A short-fall mid-pour means a second delivery fee plus the risk of cold joints</li>
      <li><strong>Round up:</strong> If your calculation comes to 7.3 m³, order 8 m³. The cost of 0.7 m³ extra is far less than the cost of being short</li>
      <li><strong>Communicate with your supplier:</strong> Tell them the job type and total volume so they can advise on truck scheduling</li>
    </ul>
    <p>
      Getting your concrete volume right saves money and avoids costly problems on pour day. For accurate quoting that accounts for all these variables, using dedicated <Link to="/articles/how-to-quote-concrete-slab-australia">estimating workflows</Link> helps ensure nothing gets missed.
    </p>

    <h2 id="quick-reference">Quick Reference Volumes</h2>
    <p>
      Use this table to quickly estimate volume per square metre at common slab thicknesses:
    </p>
    <table>
      <thead>
        <tr>
          <th>Slab Thickness</th>
          <th>m³ per m²</th>
          <th>m³ per 10 m²</th>
          <th>m³ per 50 m²</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>75 mm</td><td>0.075</td><td>0.75</td><td>3.75</td></tr>
        <tr><td>100 mm</td><td>0.100</td><td>1.00</td><td>5.00</td></tr>
        <tr><td>125 mm</td><td>0.125</td><td>1.25</td><td>6.25</td></tr>
        <tr><td>150 mm</td><td>0.150</td><td>1.50</td><td>7.50</td></tr>
        <tr><td>200 mm</td><td>0.200</td><td>2.00</td><td>10.00</td></tr>
      </tbody>
    </table>
    <p>
      Remember: these are slab-only volumes. Always add edge beams, thickenings, and your waste allowance on top.
    </p>
  </div>
);

export default HowMuchConcreteDoINeed;

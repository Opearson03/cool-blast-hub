import { Link } from "react-router-dom";

const ConcreteSlumpTesting = () => (
  <>
    <p>
      Slump testing is one of the most common quality checks in concreting. It measures the workability (consistency) of fresh concrete when it arrives on site. Understanding what slump tests are, when they're required, and what to do when concrete fails is essential for every Australian concreter.
    </p>

    <h2 id="what-is-slump-test">What Is a Slump Test?</h2>
    <p>
      A slump test measures how much a cone of fresh concrete "slumps" (drops in height) when the mould is removed. It's a quick, on-site test that takes about 5 minutes and tells you whether the concrete has the right consistency for placing and finishing.
    </p>
    <p>
      The test is performed using a standard slump cone (300mm tall, 200mm base, 100mm top), a tamping rod, and a flat surface. The method is defined in <strong>AS 1012.3</strong>.
    </p>

    <h3>How the test works</h3>
    <ol>
      <li>Fill the slump cone in three equal layers, rodding each layer 25 times</li>
      <li>Strike off the top level with the tamping rod</li>
      <li>Lift the cone straight up in 5–10 seconds</li>
      <li>Place the cone upside down next to the concrete and measure the difference in height</li>
    </ol>
    <p>
      The measurement (in millimetres) is the "slump." A higher slump means wetter, more workable concrete. A lower slump means stiffer, drier concrete.
    </p>

    <h2 id="typical-slump-values">Typical Slump Values</h2>
    <p>
      The required slump depends on what you're pouring and how. Here are typical ranges used in Australian residential work:
    </p>

    <table>
      <thead>
        <tr>
          <th>Application</th>
          <th>Typical Slump (mm)</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Footings (direct pour)</td>
          <td>80–100</td>
          <td>Stiffer mix for trench pours</td>
        </tr>
        <tr>
          <td>Slabs (direct pour)</td>
          <td>80–100</td>
          <td>Standard residential slab</td>
        </tr>
        <tr>
          <td>Slabs (pump pour)</td>
          <td>100–120</td>
          <td>Slightly wetter for pump lines</td>
        </tr>
        <tr>
          <td>Suspended slabs</td>
          <td>80–120</td>
          <td>Depends on reinforcement density</td>
        </tr>
        <tr>
          <td>Exposed aggregate</td>
          <td>60–80</td>
          <td>Stiffer to hold aggregate at surface</td>
        </tr>
        <tr>
          <td>Piers / columns</td>
          <td>100–120</td>
          <td>Needs to flow around rebar cages</td>
        </tr>
      </tbody>
    </table>

    <p>
      The engineer's specification should state the required slump. If it doesn't, the <Link to="/articles/concrete-strength-grades-australia">concrete grade specification</Link> from the supplier will include a target slump.
    </p>

    <h2 id="when-required">When Is Slump Testing Required?</h2>
    <p>
      Slump testing may be required by:
    </p>
    <ul>
      <li><strong>The engineer's specification</strong> — often specifies a target slump or slump range</li>
      <li><strong>The building certifier</strong> — may require slump test records as part of compliance documentation</li>
      <li><strong>AS 1379</strong> — requires testing when concrete is sampled for strength testing</li>
      <li><strong>Project specifications</strong> — commercial and larger residential projects often mandate testing of every load</li>
    </ul>
    <p>
      For standard residential slabs, formal slump testing (with written records) isn't always mandated — but it's good practice. Many experienced concreters can judge slump visually, but a documented test protects you if questions arise later.
    </p>

    <h2 id="what-affects-slump">What Affects Slump on Site?</h2>
    <p>
      The slump when concrete arrives on site can differ from the slump at the batch plant. Common factors:
    </p>
    <ul>
      <li><strong>Travel time</strong> — concrete stiffens during transit. Longer travel = lower slump on arrival</li>
      <li><strong>Temperature</strong> — hot weather accelerates stiffening. Concrete can lose 20–30mm of slump in hot conditions</li>
      <li><strong>Waiting time</strong> — concrete sitting in the agitator loses slump over time</li>
      <li><strong>Water content</strong> — adding water on site increases slump but reduces strength</li>
    </ul>

    <h2 id="adding-water">The Water Question</h2>
    <p>
      This is where many concreters get into trouble. When concrete arrives stiffer than expected, the temptation is to add water to increase workability. But adding water:
    </p>
    <ul>
      <li>Reduces the concrete's compressive strength</li>
      <li>Increases shrinkage and cracking risk</li>
      <li>Can push the water-cement ratio outside the specification</li>
      <li>May void the supplier's guarantee on the mix</li>
    </ul>
    <p>
      <strong>AS 1379 allows</strong> a small amount of water to be added on site, but only within strict limits — typically up to the maximum water-cement ratio for the specified grade. The batch docket should show the amount of water that can be added.
    </p>
    <p>
      <strong>Best practice:</strong> If the concrete is too stiff, call the supplier. They can advise on whether water can be safely added, or they may offer a plasticiser (superplasticiser) that increases workability without adding water.
    </p>

    <h2 id="when-concrete-fails">What Happens When Concrete Fails Slump?</h2>
    <p>
      If a slump test shows the concrete is outside the specified range:
    </p>
    <ul>
      <li><strong>Too low (too stiff):</strong> The concrete may be difficult to place and finish. It won't flow around reinforcement properly and may leave voids. Contact the supplier before placing</li>
      <li><strong>Too high (too wet):</strong> The concrete may not reach its design strength. It's also more likely to bleed, segregate, and crack. If significantly over slump, consider rejecting the load</li>
    </ul>
    <p>
      Rejecting a load of concrete is never fun — it costs time and money. But pouring concrete that's clearly out of spec is worse. If a slab fails <Link to="/articles/concrete-strength-compliance-responsibility">strength testing</Link> later, you'll be involved in the conversation about what went wrong.
    </p>

    <h2 id="recording-results">Recording Slump Test Results</h2>
    <p>
      When you do perform slump tests, record:
    </p>
    <ul>
      <li>Date and time of the test</li>
      <li>Truck / docket number</li>
      <li>Specified slump range</li>
      <li>Actual slump measured</li>
      <li>Any water added on site</li>
      <li>Weather conditions (temperature, wind)</li>
      <li>Who performed the test</li>
    </ul>
    <p>
      Keep these records with your job documentation. They're part of the quality trail for the project and can be invaluable if disputes arise.
    </p>

    <h2 id="summary">Summary</h2>
    <p>
      Slump testing is a simple but important quality check. Understanding what slump values mean, when testing is required, and how to handle out-of-spec concrete helps you maintain quality and protect yourself. When in doubt, test and record — it takes five minutes and could save you a lot of headaches down the track.
    </p>
  </>
);

export default ConcreteSlumpTesting;

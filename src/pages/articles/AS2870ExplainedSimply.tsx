import { Link } from "react-router-dom";

const AS2870ExplainedSimply = () => (
  <>
    <p>
      AS 2870 is the Australian Standard for residential slabs and footings. It's the document engineers use to design house slabs — and the one that determines what you're building. The problem is, it reads like a legal textbook crossed with a soil science journal. This guide explains what you actually need to know as a concreter, in plain English.
    </p>

    <h2 id="what-as2870-covers">What Does AS 2870 Cover?</h2>
    <p>
      AS 2870 sets out the design rules for slabs and footings on residential buildings up to two storeys. It covers:
    </p>
    <ul>
      <li>How to classify a site based on soil reactivity</li>
      <li>What type of slab or footing system is appropriate for each site class</li>
      <li>Minimum dimensions for beams, slabs, and footings</li>
      <li>Reinforcement requirements</li>
      <li>Articulation joints, moisture barriers, and drainage</li>
    </ul>
    <p>
      If you're pouring a house slab, the engineer's design is almost certainly based on this standard. Understanding it helps you read drawings, ask the right questions, and build the job properly.
    </p>

    <h2 id="site-classification">Site Classification Explained</h2>
    <p>
      The foundation of AS 2870 (no pun intended) is site classification. Before anything gets designed, a geotechnical engineer tests the soil and classifies the site. The classification tells the structural engineer how much the ground is expected to move — which determines the slab design.
    </p>

    <table>
      <thead>
        <tr>
          <th>Site Class</th>
          <th>Expected Ground Movement</th>
          <th>What It Means</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Class A</td>
          <td>Little or no movement (0–20mm)</td>
          <td>Sand, rock, or stable gravel. Simplest slab design</td>
        </tr>
        <tr>
          <td>Class S</td>
          <td>Slight movement (20–40mm)</td>
          <td>Slightly reactive clay. Standard slab designs work well</td>
        </tr>
        <tr>
          <td>Class M</td>
          <td>Moderate movement (20–40mm)</td>
          <td>Moderately reactive clay. Common in Australian suburbs</td>
        </tr>
        <tr>
          <td>Class H1</td>
          <td>High movement (40–60mm)</td>
          <td>Highly reactive clay. Deeper beams, more steel required</td>
        </tr>
        <tr>
          <td>Class H2</td>
          <td>Very high movement (60–75mm)</td>
          <td>Very reactive clay. Significant footing design needed</td>
        </tr>
        <tr>
          <td>Class E</td>
          <td>Extreme movement (75mm+)</td>
          <td>Extremely reactive clay. Specialist engineering required</td>
        </tr>
        <tr>
          <td>Class P</td>
          <td>Problem site</td>
          <td>Fill, landslip, mine subsidence, soft soils. Requires specific engineering</td>
        </tr>
      </tbody>
    </table>

    <p>
      <strong>Why this matters to you:</strong> The site class directly affects how deep your footings are, how much steel goes in, and how thick the slab needs to be. A Class A site might need a simple 85mm slab with basic edge beams. A Class H2 site might need 450mm deep beams with heavy reinforcement. Same house — very different job.
    </p>

    <h2 id="slab-types">Slab Types Under AS 2870</h2>
    <p>
      The standard covers several slab systems. The engineer chooses the most appropriate one based on site class, building loads, and site conditions.
    </p>

    <h3>Stiffened Raft Slab</h3>
    <p>
      The most common system for new residential builds. The slab and beams are poured as one unit, forming a stiff "raft" that resists ground movement. Beam depth and spacing increase with higher site classes.
    </p>

    <h3>Waffle Pod Slab</h3>
    <p>
      A type of stiffened raft where polystyrene pods create voids between the beams. Popular on flat sites with lower reactivity (Class A to M). See our <Link to="/articles/waffle-pod-slabs-pros-cons-cost">waffle pod slab guide</Link> for more detail.
    </p>

    <h3>Conventional Slab with Strip Footings</h3>
    <p>
      The traditional system: strip footings are poured first, then the slab is poured on top. Common on sloping sites, reactive soils, and renovation work. See our <Link to="/articles/strip-footings-vs-raft-slabs-quoting">strip footings vs raft slabs comparison</Link>.
    </p>

    <h3>Suspended Slab</h3>
    <p>
      A slab supported by beams or walls rather than sitting on the ground. Used for upper floors, slabs over garages, and split-level designs. Designed under AS 3600 rather than AS 2870.
    </p>

    <h2 id="key-requirements">Key Construction Requirements</h2>
    <p>
      AS 2870 specifies minimum requirements that you need to meet during construction:
    </p>

    <h3>Beam dimensions</h3>
    <p>
      Minimum beam widths and depths are specified based on site class. For example, on a Class M site, internal beams are typically 300mm wide × 300mm deep minimum. On a Class H2 site, beams might be 400mm wide × 450mm deep.
    </p>

    <h3>Reinforcement</h3>
    <p>
      The standard specifies minimum <Link to="/articles/steel-reinforcement-required-for-slab">reinforcement</Link> for each slab type and site class. This includes slab mesh (typically SL72 or SL82), beam reinforcement (N12 or N16 bars with ligatures), and starter bars at construction joints.
    </p>

    <h3>Cover to reinforcement</h3>
    <p>
      Minimum cover (distance from concrete surface to steel) must be maintained. Typically 20mm for internal slabs and 30–40mm for external or exposed concrete. Use appropriate chairs and spacers to achieve this.
    </p>

    <h3>Moisture barriers</h3>
    <p>
      A moisture barrier (polyethylene membrane) must be placed under the slab. AS 2870 specifies minimum thickness (typically 0.2mm) and how joints should be lapped and sealed.
    </p>

    <h3>Articulation joints</h3>
    <p>
      For longer buildings, the standard may require articulation joints (full breaks in the slab) to allow controlled movement. These are shown on the engineer's drawings and must be built as specified.
    </p>

    <h2 id="what-concreters-get-wrong">What Concreters Most Often Get Wrong</h2>
    <ul>
      <li><strong>Not reading the drawings properly</strong> — beam sizes, steel details, and cover requirements are all specified. Don't assume</li>
      <li><strong>Skipping the moisture barrier</strong> — or not lapping and taping joints properly</li>
      <li><strong>Incorrect steel placement</strong> — mesh sitting on the ground instead of on chairs, or beam steel not tied to the drawing</li>
      <li><strong>Pouring on unprepared ground</strong> — the standard assumes proper compaction and preparation. Pouring on loose fill or wet ground creates problems</li>
      <li><strong>Ignoring curing</strong> — AS 2870 assumes concrete reaches design strength. Without proper curing, it may not</li>
    </ul>

    <h2 id="do-you-need-a-copy">Do You Need Your Own Copy?</h2>
    <p>
      You don't need to own or memorise AS 2870. The engineer designs to the standard, and you build to the engineer's drawings. But understanding the basics — site classes, slab types, and minimum requirements — helps you:
    </p>
    <ul>
      <li>Read and understand engineering drawings</li>
      <li>Ask informed questions when something doesn't look right</li>
      <li>Quote more accurately by understanding what's involved</li>
      <li>Protect yourself if compliance issues arise later</li>
    </ul>
    <p>
      If you do want to reference the standard, copies are available from Standards Australia (standards.org.au). It's not cheap, but it's a worthwhile investment for your business library.
    </p>

    <h2 id="summary">Summary</h2>
    <p>
      AS 2870 is the rulebook for residential slabs and footings in Australia. The site class determines the design, which determines what you build. Understanding the basics — site classification, slab types, beam requirements, and construction obligations — makes you a better concreter and helps you quote and build with confidence.
    </p>
  </>
);

export default AS2870ExplainedSimply;

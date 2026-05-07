import { Link } from "react-router-dom";

const DocumentConcreteVariations = () => (
  <>
    <p>
      Most variation disputes aren't about whether the extra work was done — they're about whether it was approved, what it was supposed to cost, and who agreed to what. Good documentation closes that gap. The aim isn't a legal essay; it's enough evidence to make the conversation simple: "Here's what was added, here's what you agreed to, here's the price."
    </p>

    <h2 id="why-it-matters">Why Documentation Matters</h2>
    <p>
      A documented variation is paid in days. An undocumented variation becomes a debate, then a discount, then a write-off. Builders and clients aren't necessarily acting in bad faith — but without records, their memory of "what was agreed" rarely matches yours.
    </p>

    <h2 id="checklist">The Variation Documentation Checklist</h2>
    <p>
      For every variation, capture these six things:
    </p>
    <ol>
      <li><strong>Date and time</strong> the change was requested</li>
      <li><strong>Who requested it</strong> (name + role: client, builder, supervisor, engineer)</li>
      <li><strong>What was changed</strong> (compared to the original scope)</li>
      <li><strong>Why</strong> (engineer instruction, site conditions, client preference)</li>
      <li><strong>Price</strong> (itemised — materials, labour, plant, margin)</li>
      <li><strong>Approval</strong> (signed variation, SMS reply, email confirmation)</li>
    </ol>

    <h2 id="formats-that-work">Formats That Actually Work on Site</h2>
    <p>
      You don't need lawyers' contracts. You need something you'll actually fill out between pours.
    </p>

    <h3>Option 1: SMS / message thread</h3>
    <p>
      For small variations, an SMS is enough if it includes the scope and price:
    </p>
    <blockquote>
      <p>
        "Hi Mark — confirming we'll add the 600mm step-down on the south side, plus extra mesh and 0.4m³ extra concrete. Cost is $480 + GST. OK to proceed?"
      </p>
    </blockquote>
    <p>
      A "yes" reply is your approval. Screenshot it and save it to the job file the same day.
    </p>

    <h3>Option 2: Written variation form</h3>
    <p>
      For anything over a few hundred dollars, use a one-page variation form. Include:
    </p>
    <ul>
      <li>Job name, address, date</li>
      <li>Variation number (V01, V02…) — they'll add up across a job</li>
      <li>Description of original scope vs new scope</li>
      <li>Itemised pricing</li>
      <li>Total inc. GST</li>
      <li>Signature lines for both parties</li>
    </ul>

    <h3>Option 3: Email chain</h3>
    <p>
      If everything is done by email, fine — just make sure the price and scope are explicitly confirmed in the same chain, not buried across multiple threads.
    </p>

    <h2 id="photos-and-evidence">Photos and Site Evidence</h2>
    <p>
      Photograph the variation as it happens — not after the pour. Useful shots:
    </p>
    <ul>
      <li>The original plan (or the part you were quoted on)</li>
      <li>The change being marked out on site (chalk lines, pegs, formwork)</li>
      <li>Materials added (extra mesh, additional formwork, larger pour zone)</li>
      <li>The concrete docket showing the extra volume</li>
      <li>The finished work clearly showing what was added</li>
    </ul>
    <p>
      Photos with timestamps and GPS metadata are gold in disputes. Most phones do this automatically — don't strip the data when sharing.
    </p>

    <h2 id="numbering-and-tracking">Number and Track Variations</h2>
    <p>
      Even on a small job, variations stack up. Track them with simple numbering (V01, V02…) and keep a running total. This makes the final invoice clear:
    </p>
    <ul>
      <li>Original quote: $18,500</li>
      <li>V01 — additional step-down: $480</li>
      <li>V02 — upgraded slab to 32MPa: $620</li>
      <li>V03 — extra path on south side: $1,950</li>
      <li><strong>Total: $21,550 + GST</strong></li>
    </ul>
    <p>
      Clients are far more likely to pay an itemised total than a single inflated final invoice with no breakdown.
    </p>

    <h2 id="store-it">Store It Where You Can Find It</h2>
    <p>
      The best documentation is useless if you can't find it three months later when payment is in dispute. Save everything against the job — in your job management software, a shared folder, or even a dated WhatsApp folder per job. Make this a habit, not a one-off.
    </p>

    <h2 id="when-things-go-wrong">If You Didn't Document It Properly</h2>
    <p>
      Even if you didn't follow this perfectly, you can still recover. Pull together everything you do have — SMS, photos, dockets, witness statements from your crew — and present it as a written variation claim. See <Link to="/articles/charge-for-variations-after-pour">charging for variations after the pour</Link> and <Link to="/articles/client-disputes-concrete-invoice">handling disputed invoices</Link> for the next steps.
    </p>

    <h2 id="summary">Summary</h2>
    <p>
      Variation documentation isn't paperwork for paperwork's sake — it's the difference between getting paid and arguing. Capture the six core details (date, who, what, why, price, approval), use whatever format you'll actually maintain, and photograph the work as it happens. A two-minute SMS today saves hours of follow-up next month.
    </p>
  </>
);

export default DocumentConcreteVariations;

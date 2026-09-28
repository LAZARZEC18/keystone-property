import { setMeta, esc } from '../ui.js';
import { SITE } from '../site.js';

const PAGES = {
  about: {
    title: 'About Ownaroo',
    description: 'What Ownaroo is, where its numbers come from, and how it is funded.',
    body: (h) => `
      <p class="lead" style="font-size:18px">Ownaroo is a free, independent calculator site for Australian home buyers and investors. It works out what you can comfortably afford in each state, the schemes you qualify for, the real weekly cost of a purchase under the 2026 tax rules, and advertised rates from more than 90 lenders. It gives suburb-based price ranges as a guide, not valuations.</p>
      <h2>Why it exists</h2>
      <p>Most property tools either sell you something or only show part of the picture. Ownaroo puts official sales, census, building approval and lending data in one place, shows its working, and is honest when the numbers are weak: it shows when a deal ranks in the bottom 30% as plainly as the top 15%, and it tells you when a suburb figure is really a city-wide index or a model.</p>
      <h2>Where the numbers come from</h2>
      <p>State valuer-general and government sales medians (Victoria, New South Wales, South Australia), the ABS Census and building approvals, Cotality's monthly Home Value Index, SQM Research vacancy rates, the RBA, and the public Open Banking product feeds of more than 90 lenders. Lender rates are checked several times a day, RBA data and news several times a day, market figures each month-end, and suburb figures are rebuilt monthly. The full method, including the price and rent models and their measured error, is on the <a href="/methodology" data-link>methodology page</a>.</p>
      <h2>Who runs it</h2>
      <p>Ownaroo is built and run independently from ${h.location || 'Perth, Western Australia'}. It isn't owned by a bank, lender, agency or property portal, and nobody pays to be ranked. The business details below will show the registered business name and ABN once they're issued. Questions go straight to the person who builds it: use the <a href="/contact" data-link>contact form</a>.</p>
      <h2>Independence</h2>
      <p>Ownaroo is not a lender, broker, agent or financial adviser, and no lender pays to appear in the rate tables: they're ranked by rate alone. If Ownaroo ever earns money from a referral or a paid feature, it will be labelled clearly where it appears, and it will never change a rating.</p>
      <h2>General information only</h2>
      <p>Everything on Ownaroo is general information. It doesn't consider your objectives, finances or needs, and it isn't financial, credit, tax or legal advice. Talk to a licensed adviser or broker before making a decision. See the <a href="/terms" data-link>terms of use</a>.</p>
      ${h.business}
      <p><a class="btn primary" href="/contact" data-link>Contact Ownaroo</a></p>`,
  },
  privacy: {
    title: 'Privacy policy',
    description: 'What Ownaroo collects, why, and what it does with it.',
    body: (h) => `
      <p class="note">Last updated ${h.updated}.</p>
      <h2>The short version</h2>
      <p>Ownaroo collects as little as it can. You can use every tool without an account. Ownaroo doesn't use advertising or tracking cookies and doesn't sell or share your details. If that ever changes, you'll be asked first.</p>
      <h2>What Ownaroo collects</h2>
      <ul>
        <li><b>What you type into the calculators</b> (savings, income, debts, prices) stays in your browser. It isn't sent to Ownaroo or stored. The page address keeps your choices (such as the state and deposit type) but not your savings or income; those go into a link only if you press "Copy link with my numbers".</li>
        <li><b>If you send a message:</b> your name, email and message, used only to reply.</li>
        <li><b>Addresses you look up:</b> sent through Ownaroo's server to OpenStreetMap's Nominatim service to find the location. Ownaroo doesn't store them, and no address is sent to any property data company.</li>
        <li><b>Your saved suburbs, deals and theme:</b> saved in your own browser, not on Ownaroo's servers, so they aren't on your other devices and are lost if you clear your browser data.</li>
        <li><b>Page views:</b> Ownaroo counts which pages are viewed, with no cookies and nothing that identifies you (no IP address or device ID is kept), to learn which tools are useful.</li>
        <li><b>Server logs:</b> the hosting provider (Netlify) keeps standard request logs, such as IP address and pages requested, for security and reliability.</li>
      </ul>
      <h2>Other services your browser contacts</h2>
      <p>Like most websites, pages load a few things from other companies, which receive your IP address and browser details when they do:</p>
      <ul>
        <li><b>Google Fonts</b> (fonts.googleapis.com, fonts.gstatic.com), for the typefaces.</li>
        <li><b>cdnjs</b> (Cloudflare), for the Leaflet map library.</li>
        <li><b>OpenStreetMap's tile servers</b>, for the map images.</li>
        <li><b>Wikimedia Commons</b>, for photos of a suburb on its report.</li>
      </ul>
      <p>Links to Google Maps, realestate.com.au, Domain, lenders and government sites only contact those sites if you click them.</p>
      <h2>Where it's stored</h2>
      <p>Messages are stored with Netlify, which may hold data outside Australia. Ownaroo takes reasonable steps to keep it secure and deletes it when it's no longer needed.</p>
      <h2>Your choices</h2>
      <p>To see, correct or delete what Ownaroo holds about you, email <a href="mailto:${h.email}">${h.email}</a> or use the <a href="/contact" data-link>contact form</a>. If you're not happy with the response, you can contact the Office of the Australian Information Commissioner (oaic.gov.au).</p>`,
  },
  terms: {
    title: 'Terms of use',
    description: 'The terms for using Ownaroo: general information and calculators, not financial, credit, tax or legal advice, and how estimates and third-party data should be used.',
    body: (h) => `
      <p class="note">Last updated ${h.updated}.</p>
      <h2>General information, not advice</h2>
      <p>Ownaroo provides general information and calculators. It doesn't take into account your objectives, financial situation or needs, and it isn't financial product advice, credit assistance, tax advice or legal advice. Ownaroo doesn't hold an Australian Financial Services Licence or an Australian Credit Licence. Before acting, consider whether the information suits you and get advice from a licensed professional.</p>
      <h2>Estimates and ratings</h2>
      <p>Price ranges, rents, yields, scores and relative ranks are automated estimates from suburb-level data and the details entered. They describe the numbers, not whether you should buy. They can be wrong. They are not valuations or appraisals of any property, and Ownaroo is not a licensed valuer or real estate agent. A bank valuation, an agent's appraisal of recent sales, and building and pest inspections are more reliable for a specific property.</p>
      <h2>Third-party data</h2>
      <p>Figures from Cotality, the ABS, the RBA, SQM Research, state governments and lenders are credited where they appear and belong to their owners. Interest rates are advertised rates from lenders' public product feeds and may not be the rate you're offered. Tax and duty rules are summarised; check the official source.</p>
      <h2>Using and copying the site</h2>
      <p>You can use Ownaroo for your own decisions and share links to its pages. You may not copy, scrape, download in bulk or republish its data, scores or estimates, or use automated tools to collect them, without written permission. Some of the data behind the figures is licensed for display on this site only, which is why suburb data can't be downloaded.</p>
      <h2>Hazards</h2>
      <p>Ownaroo doesn't assess flood, bushfire, storm-tide, coastal erosion or other hazards, and its scores don't include them. Check the official hazard maps linked on each suburb and address page, the council's planning certificate and an insurance quote before you buy.</p>
      <h2>Liability</h2>
      <p>To the extent the law allows, Ownaroo isn't liable for loss arising from use of the site or reliance on its information. Nothing in these terms excludes rights you have under the Australian Consumer Law.</p>
      <h2>Who we are and governing law</h2>
      <p>Ownaroo is operated from ${h.location || 'Australia'}${h.abn ? ` by ${h.entity}, ABN ${h.abn}` : ''}. Contact: <a href="mailto:${h.email}">${h.email}</a>. These terms are governed by the laws of ${h.law}, and you submit to the non-exclusive jurisdiction of its courts.</p>
      <h2>Changes</h2>
      <p>These terms may be updated; the date above shows the latest version.</p>`,
  },
  contact: {
    title: 'Contact',
    description: 'Contact Ownaroo with a question, a data correction or a privacy request. Every message gets a reply by email.',
    body: (h) => `
      <p>Questions, corrections, data you think is wrong, or partnership enquiries (Ownaroo doesn't sell advertising, placements or rankings): email <a href="mailto:${h.email}">${h.email}</a> or send a message below. You'll get a reply by email, usually within two business days.</p>
      ${h.business}
      <form class="card" name="contact" method="POST" data-netlify="true" netlify-honeypot="company" id="contact-form" style="max-width:620px">
        <input type="hidden" name="form-name" value="contact">
        <p hidden><label>Leave empty <input name="company"></label></p>
        <div class="fields" style="grid-template-columns:1fr 1fr">
          <label class="field">Name<input name="name" autocomplete="name" required></label>
          <label class="field">Email<input name="email" type="email" autocomplete="email" required></label>
          <label class="field" style="grid-column:1/-1">About<select name="topic"><option>General question</option><option>Data correction</option><option>Partnership enquiry</option><option>Privacy request</option></select></label>
          <label class="field" style="grid-column:1/-1">Message<textarea name="message" rows="6" required style="width:100%;border:1px solid var(--line-2);border-radius:10px;padding:10px;font:inherit;background:var(--surface);color:var(--ink)"></textarea></label>
        </div>
        <button class="btn primary" style="margin-top:12px">Send message</button>
        <p class="fine" id="contact-status" style="margin-top:8px">Your details are used only to reply. <a href="/privacy" data-link>Privacy policy</a>.</p>
      </form>`,
  },
};

export default async function infoPage(main, params) {
  const key = params.page;
  const P = PAGES[key];
  setMeta({ title: P.title, description: P.description });
  const business = SITE.abn || SITE.email || SITE.businessName
    ? `<div class="card flat tint" style="margin:18px 0"><div class="kv">${SITE.businessName ? `<span>Business</span><span>${esc(SITE.businessName)}</span>` : ''}${SITE.abn ? `<span>ABN</span><span>${esc(SITE.abn)}</span>` : ''}${SITE.email ? `<span>Email</span><span><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></span>` : ''}${SITE.location ? `<span>Based in</span><span>${esc(SITE.location)}</span>` : ''}</div></div>`
    : '';
  main.innerHTML = `<div class="page-head"><div class="eyebrow">Ownaroo</div><h1>${P.title}</h1></div><div class="prose" style="max-width:760px">${P.body({ business, updated: SITE.policyUpdated, abn: esc(SITE.abn || ''), entity: esc(SITE.entity || SITE.businessName), email: esc(SITE.email), location: esc(SITE.location), law: esc(SITE.governingLaw || 'Western Australia') })}</div>`;
  const form = main.querySelector('#contact-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = main.querySelector('#contact-status');
    try {
      const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() });
      if (!r.ok) throw new Error(r.status);
      form.innerHTML = '<h3>Thanks, your message is in.</h3><p class="note">You\'ll get a reply by email.</p>';
    } catch {
      status.textContent = 'That didn\'t send. Please try again in a moment.';
    }
  });
}


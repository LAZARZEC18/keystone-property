import { setMeta, esc } from '../ui.js';
import { SITE } from '../site.js';
import { WHO, tourFigure, wireTour } from './why.js';

const PAGES = {
  about: {
    title: 'About Ownaroo',
    description: 'What Ownaroo does for home buyers and investors, who runs it, where its numbers come from and how it stays independent.',
    body: (h) => `
      <p class="lead" style="font-size:18px">Ownaroo is a free, independent calculator site for Australian home buyers and investors. It answers four questions: what can I afford, what will this investment really cost, what is this suburb like, and what rate can I get.</p>
      ${h.tour}
      <h2>Built for people buying a home</h2>
      <div class="grid g3 why-who" style="margin-bottom:8px">${WHO.map(([t, d, href]) => `<a class="card product" href="${href}" data-link><h3>${t}</h3><p class="muted">${d}</p></a>`).join('')}</div>
      <h2>Who runs it</h2>
      ${h.owner}
      <h2>Where the numbers come from</h2>
      <p>Official sales medians where states publish them (Victoria, NSW, South Australia), the ABS Census, income, labour force and building approvals, the RBA, Cotality's month-end Home Value Index, and the Open Banking product feeds of more than 90 lenders. Rates and RBA data are checked several times a day, market figures each month-end, and suburb figures are rebuilt monthly. Every price says how sure it is. The <a href="/methodology" data-link>methodology page</a> shows the method and its tested error.</p>
      <h2>Independence</h2>
      <p>Ownaroo isn't a lender, broker, agent or financial adviser. Rankings are never paid for: rates are ranked by rate alone, and suburbs by the same formula everywhere.</p>
      <h2>General information only</h2>
      <p>Everything here is general information, not financial, credit, tax or legal advice. See the <a href="/terms" data-link>terms of use</a>.</p>
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
        <li><b>Addresses you look up:</b> sent in the body of a request (not in the page address, so they don't appear in web logs) through Ownaroo's server to a map service, MapTiler or OpenStreetMap's Nominatim, to find the location. The result is cached for 30 days under a one-way code made from the address, so the address itself isn't stored, and no address is sent to any property data company.</li>
        <li><b>Your saved suburbs, deals and theme:</b> saved in your own browser, not on Ownaroo's servers, so they aren't on your other devices and are lost if you clear your browser data.</li>
        <li><b>Page views and tool use:</b> Ownaroo counts which pages are viewed and when a tool finishes, a link is copied, a plan is printed or a listing link is opened, as daily totals with no cookies and nothing that identifies you (no IP address, device ID or figures you entered), to learn which tools are useful.</li>
        <li><b>Server logs:</b> the hosting provider (Netlify) keeps standard request logs, such as IP address and pages requested, for security and reliability.</li>
      </ul>
      <h2>Other services your browser contacts</h2>
      <p>Like most websites, pages load a few things from other companies, which receive your IP address and browser details when they do:</p>
      <ul>
        <li><b>Google Fonts</b> (fonts.googleapis.com, fonts.gstatic.com), for the typefaces.</li>
        <li><b>cdnjs</b> (Cloudflare), for the Leaflet map library and the QR code maker.</li>
        <li><b>MapTiler</b> or <b>OpenStreetMap's tile servers</b>, for the map images.</li>
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
      <p>You can use Ownaroo for your own decisions and share links to its pages. You may not copy, scrape, download in bulk or republish its data, scores or estimates, or use automated tools to collect them, without written permission. Third-party figures belong to their owners and are shown with credit; they aren't Ownaroo's to pass on, which is why suburb data can't be downloaded.</p>
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
    title: 'Contact Ownaroo',
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
  const o = SITE.owner || {};
  const owner = o.name
    ? `<div class="owner card flat">${o.photo ? `<img src="${esc(o.photo)}" alt="${esc(o.name)}" width="96" height="96">` : ''}<div><h3 style="margin:0">${esc(o.name)}</h3>${o.role ? `<p class="muted" style="margin:2px 0 6px">${esc(o.role)}</p>` : ''}<p style="margin:0">${esc(o.bio || '')}</p>${o.linkedin ? `<p style="margin:6px 0 0"><a href="${esc(o.linkedin)}" target="_blank" rel="noopener">LinkedIn ↗</a></p>` : ''}</div></div>`
    : `<p>Ownaroo is built and run independently in ${esc(SITE.location || 'Perth, Western Australia')}. It isn't owned by a bank, lender, agency or property portal. Questions and corrections go straight to the person who builds it, through the <a href="/contact" data-link>contact form</a>.</p>`;
  const business = SITE.abn || SITE.email || SITE.businessName
    ? `<div class="card flat tint" style="margin:18px 0"><div class="kv">${SITE.businessName ? `<span>Business</span><span>${esc(SITE.businessName)}</span>` : ''}${SITE.abn ? `<span>ABN</span><span>${esc(SITE.abn)}</span>` : ''}${SITE.email ? `<span>Email</span><span><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></span>` : ''}${SITE.location ? `<span>Based in</span><span>${esc(SITE.location)}</span>` : ''}</div></div>`
    : '';
  main.innerHTML = `<div class="page-head"><div class="eyebrow">Ownaroo</div><h1>${P.title}</h1></div><div class="prose" style="max-width:760px">${P.body({ business, owner, tour: key === 'about' ? tourFigure() : '', updated: SITE.policyUpdated, abn: esc(SITE.abn || ''), entity: esc(SITE.entity || SITE.businessName), email: esc(SITE.email), location: esc(SITE.location), law: esc(SITE.governingLaw || 'Western Australia') })}</div>`;
  if (key === 'about') wireTour(main);
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


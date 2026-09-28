import { setMeta, esc } from '../ui.js';
import { SITE } from '../site.js';

const PAGES = {
  about: {
    title: 'About Keyzing',
    description: 'What Keyzing is, where its numbers come from, and how it is funded.',
    body: (h) => `
      <p class="lead" style="font-size:18px">Keyzing is an independent Australian property research site. It values homes, rates every suburb, tracks the market through the day and runs the full numbers on a purchase, for home buyers and investors.</p>
      <h2>Why it exists</h2>
      <p>Most property tools either sell you something or only show part of the picture. Keyzing puts official sales, census, building approval and lending data in one place, shows its working, and is honest when the numbers are weak: it rates a deal D as readily as A, and it tells you when a suburb figure is really a city-wide index.</p>
      <h2>Where the numbers come from</h2>
      <p>State valuer-general and government sales medians (Victoria, New South Wales, South Australia), the ABS Census and building approvals, Cotality's daily home value index, SQM Research vacancy rates, the RBA, and every lender's public Open Banking product feed. The daily index, RBA data and news are checked about every hour, lender rates several times a day, and suburb figures are rebuilt monthly. The full method, including the price and rent models and their measured error, is on the <a href="/methodology" data-link>methodology page</a>.</p>
      <h2>Independence</h2>
      <p>Keyzing is not a lender, broker, agent or financial adviser, and no lender pays to appear in the rate tables: they're ranked by rate alone. If Keyzing ever earns money from a referral or a paid feature, it will be labelled clearly where it appears, and it will never change a rating.</p>
      <h2>General information only</h2>
      <p>Everything on Keyzing is general information. It doesn't consider your objectives, finances or needs, and it isn't financial, credit, tax or legal advice. Talk to a licensed adviser or broker before making a decision. See the <a href="/terms" data-link>terms of use</a>.</p>
      ${h.business}
      <p><a class="btn primary" href="/contact" data-link>Contact Keyzing</a></p>`,
  },
  privacy: {
    title: 'Privacy policy',
    description: 'What Keyzing collects, why, and what it does with it.',
    body: (h) => `
      <p class="note">Last updated ${h.updated}.</p>
      <h2>The short version</h2>
      <p>Keyzing collects as little as it can. You can use every tool without an account. Keyzing doesn't use advertising or tracking cookies and doesn't sell or share your details. If that ever changes, you'll be asked first.</p>
      <h2>What Keyzing collects</h2>
      <ul>
        <li><b>If you register for updates:</b> your email, and optionally your name, buyer type, the suburbs you're watching and your budget. Used only to send the weekly update and flag moves in your suburbs.</li>
        <li><b>If you send a message:</b> your name, email and message, used only to reply.</li>
        <li><b>Addresses you value:</b> sent to OpenStreetMap's Nominatim service through Keyzing's server to find the location. Keyzing doesn't store them.</li>
        <li><b>Your watchlist and theme:</b> saved in your own browser, not on Keyzing's servers.</li>
        <li><b>Server logs:</b> the hosting provider (Netlify) keeps standard request logs, such as IP address and pages requested, for security and reliability.</li>
      </ul>
      <h2>Where it's stored</h2>
      <p>Form submissions are stored with Netlify, which may hold data outside Australia. Keyzing takes reasonable steps to keep it secure and deletes it when it's no longer needed.</p>
      <h2>Your choices</h2>
      <p>Every update email has an unsubscribe link. To see, correct or delete what Keyzing holds about you, email <a href="mailto:${h.email}">${h.email}</a> or use the <a href="/contact" data-link>contact form</a>. If you're not happy with the response, you can contact the Office of the Australian Information Commissioner (oaic.gov.au).</p>`,
  },
  terms: {
    title: 'Terms of use',
    description: 'The terms for using Keyzing.',
    body: (h) => `
      <p class="note">Last updated ${h.updated}.</p>
      <h2>General information, not advice</h2>
      <p>Keyzing provides general information and calculators. It doesn't take into account your objectives, financial situation or needs, and it isn't financial product advice, credit assistance, tax advice or legal advice. Keyzing doesn't hold an Australian Financial Services Licence or an Australian Credit Licence. Before acting, consider whether the information suits you and get advice from a licensed professional.</p>
      <h2>Estimates and ratings</h2>
      <p>Valuations, rents, yields, scores and relative ranks are automated estimates from suburb-level data and the details entered. They describe the numbers, not whether you should buy. They can be wrong, and they are not formal valuations. A bank valuation, an agent's appraisal of recent sales, and building and pest inspections are more reliable for a specific property.</p>
      <h2>Third-party data</h2>
      <p>Figures from Cotality, the ABS, the RBA, SQM Research, state governments and lenders are credited where they appear and belong to their owners. Interest rates are advertised rates from lenders' public product feeds and may not be the rate you're offered. Tax and duty rules are summarised; check the official source.</p>
      <h2>Liability</h2>
      <p>To the extent the law allows, Keyzing isn't liable for loss arising from use of the site or reliance on its information. Nothing in these terms excludes rights you have under the Australian Consumer Law.</p>
      <h2>Who we are and governing law</h2>
      <p>Keyzing is operated from ${h.location || 'Australia'}. Contact: <a href="mailto:${h.email}">${h.email}</a>. These terms are governed by the laws of ${h.law}, and you submit to the non-exclusive jurisdiction of its courts.</p>
      <h2>Changes</h2>
      <p>These terms may be updated; the date above shows the latest version.</p>`,
  },
  contact: {
    title: 'Contact',
    description: 'Get in touch with Keyzing.',
    body: (h) => `
      <p>Questions, corrections, data you think is wrong, or partnership enquiries (Keyzing doesn't sell advertising, placements or rankings): email <a href="mailto:${h.email}">${h.email}</a> or send a message below and you'll get a reply by email.</p>
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
  main.innerHTML = `<div class="page-head"><div class="eyebrow">Keyzing</div><h1>${P.title}</h1></div><div class="prose" style="max-width:760px">${P.body({ business, updated: SITE.policyUpdated, email: esc(SITE.email), location: esc(SITE.location), law: esc(SITE.governingLaw || 'Western Australia') })}</div>`;
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


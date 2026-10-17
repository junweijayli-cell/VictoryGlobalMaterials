import { mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { homeContent } from './home-content.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const production = process.argv.includes('--production');
const outputIndex = process.argv.indexOf('--out');
if (production && (outputIndex < 0 || !process.argv[outputIndex + 1])) throw new Error('Production builds require an explicit --out directory.');
const outputRoot = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : root;
const read = name => readFileSync(path.join(root, name), 'utf8');
const write = (name, value) => {
  const filename = path.join(outputRoot, name);
  mkdirSync(path.dirname(filename), { recursive: true });
  const content = name.endsWith('.html') ? value.replace('<html lang="en">', `<html lang="en" data-mode="${production ? 'production' : 'preview'}">`) : value;
  writeFileSync(filename, content);
};
const catalog = JSON.parse(read('data/catalog.json'));
const ui = JSON.parse(read('data/ui.json'));
if (production) {
  const assetRoot = path.basename(path.resolve(root)) === '_source' ? path.resolve(root, '../assets') : path.join(root, 'assets');
  const assetOutput = path.join(outputRoot, 'assets');
  if (path.resolve(assetRoot) !== path.resolve(assetOutput)) cpSync(assetRoot, assetOutput, { recursive: true, filter: filename => !['catalog.js', 'analytics.js'].includes(path.basename(filename)) });
}
if (production) {
  const formCopy = {
    en: ['Include your application, specifications, quantities and destination. We will review the requirements before a quotation.', 'Send Enquiry →'],
    vi: ['Cung cấp ứng dụng, quy cách, số lượng và địa điểm giao hàng. Chúng tôi sẽ xem xét yêu cầu trước khi báo giá.', 'Gửi yêu cầu →'],
    zh: ['请提供用途、规格、数量与目的地，我们将先核对需求再沟通报价。', '发送询盘 →']
  };
  for (const [language, [note, submit]] of Object.entries(formCopy)) Object.assign(ui[language], { previewNote: note, sendEnquiry: submit });
}
const { products, categories, company, canonicalOrigin: origin } = catalog;
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const serialize = value => JSON.stringify(value).replace(/</g, '\\u003c');
const productPath = p => `products/${p.slug}.html`;
const productUrl = p => `${origin}/${productPath(p)}`;
const categoryName = p => categories.find(c => c.key === p.category).name;
const list = values => `<ul class="answer-list">${values.map(value => `<li>${escape(value)}</li>`).join('')}</ul>`;
const banner = production ? '' : '<div class="beta-banner" role="note"><span class="beta-badge">BETA PREVIEW</span><span>Local sample · live website unchanged · enquiries are simulated</span></div>';

const organization = {
  '@type': 'Organization', '@id': `${origin}/#organization`, name: company.name,
  url: `${origin}/`, logo: `${origin}/${company.logo}`, email: company.email,
  telephone: '+8618664333510', description: catalog.positioning.description,
  address: { '@type': 'PostalAddress', streetAddress: '1703B-04, Dabaihui Plaza, Futian District', addressLocality: 'Shenzhen', addressRegion: 'Guangdong', addressCountry: 'CN' },
  contactPoint: [{ '@type': 'ContactPoint', contactType: 'WhatsApp enquiries', telephone: '+6589736956', url: company.whatsappUrl }]
};

function head({ title, description, pathname, image = company.logo, graph = [] }, base = '') {
  const canonical = `${origin}/${pathname}`;
  return `<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<meta name="robots" content="${production ? (pathname === 'thank-you.html' ? 'noindex, follow' : 'index, follow') : 'noindex, nofollow'}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${escape(company.name)}">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${origin}/${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(title)}">
<meta name="twitter:description" content="${escape(description)}">
<meta name="twitter:image" content="${origin}/${image}">
<link rel="icon" href="${base}${company.logo}" type="image/png">
<link rel="stylesheet" href="${base}assets/site.css">
<link rel="stylesheet" href="${base}assets/beta.css">
${production ? `<script src="${base}assets/analytics.js" defer></script>` : ''}
${graph.length ? `<script type="application/ld+json">${serialize({ '@context': 'https://schema.org', '@graph': graph })}</script>` : ''}`;
}

function contactBlock() {
  return `<p><strong id="contactCompany">${escape(company.name)}</strong></p>
<p id="contact-address"><strong id="address-label">Address:</strong> <span>1703B-04, Dabaihui Plaza<br>Futian District, Shenzhen<br>Guangdong, China</span></p>
<p><strong id="email-label">Email:</strong> <a href="mailto:${company.email}">${company.email}</a></p>
<p><strong id="telephone-label">Telephone:</strong> <a href="${company.telephoneUri}">${company.telephone}</a></p>
<p><strong id="wechat-label">WeChat:</strong> <span>${company.wechat}</span></p>
<p><strong id="whatsapp-label">WhatsApp:</strong> <a href="${company.whatsappUrl}" target="_blank" rel="noopener noreferrer">${company.whatsapp}</a></p>`;
}

function footerContact() {
  return `<div class="footer-contact"><a href="mailto:${company.email}">${company.email}</a><span><span data-contact-label="telephoneLabel">Telephone:</span> <a href="${company.telephoneUri}">${company.telephone}</a></span><span><span data-contact-label="wechatLabel">WeChat:</span> ${company.wechat}</span><span><span data-contact-label="whatsappLabel">WhatsApp:</span> <a href="${company.whatsappUrl}" target="_blank" rel="noopener noreferrer">${company.whatsapp}</a></span></div>`;
}

function chatButton(base = '') {
  return `<div class="chat-fab"><a class="wa" href="${company.whatsappUrl}" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp at ${company.whatsapp}" title="WhatsApp ${company.whatsapp}"><img src="${base}assets/img_a640eb27ac.png" alt="" width="34" height="34" class="fab-icon"></a></div>`;
}

function nav(base = '', languages = false) {
  const links = ['about', 'products', 'markets', 'partners', 'contact'];
  return `<nav id="siteNav" aria-label="Main navigation"><a class="logo" href="${base}index.html" aria-label="Victory Global Materials home"><span class="logo-row"><img class="logo-icon" src="${base}${company.logo}" alt="" width="60" height="60"><span class="logo-main">VICTORY GLOBAL</span></span><span class="logo-sub">VICTORY FOR EVERY PROJECT</span></a><button class="nav-toggle" type="button" aria-label="Open menu" aria-controls="siteNav" aria-expanded="false"><span></span><span></span><span></span></button><ul class="nav-links">${links.map((id, i) => `<li><a href="${base}index.html#${id}">${escape(ui.en.nav[i])}</a></li>`).join('')}</ul><div class="nav-right">${languages ? '<div class="lang-switcher" aria-label="Website language"><button class="lang-btn active" type="button" data-lang="en" aria-pressed="true">EN</button><button class="lang-btn" type="button" data-lang="vi" aria-pressed="false">VI</button><button class="lang-btn" type="button" data-lang="zh" aria-pressed="false">中文</button></div>' : ''}<a class="nav-cta" href="${base}index.html#contact">${escape(ui.en.navCta)}</a></div></nav>`;
}

function footer(base = '') {
  return `<footer><div><a class="footer-brand" href="${base}index.html" data-ui="brandMain">VICTORY GLOBAL</a><div class="footer-tagline" data-ui="footerSub">${escape(ui.en.footerSub)}</div><div class="footer-copy">${escape(ui.en.footerCopy)}</div></div>${footerContact()}</footer>`;
}

function card(p, base = '') {
  return `<article class="product-card" data-product-key="${p.key}"><div class="product-img-wrap"><img class="product-img" src="${base}${p.image}" alt="${escape(p.name)}" loading="lazy" decoding="async" width="640" height="440"></div><div class="product-info"><div class="product-cat-label">${escape(categoryName(p))}</div><h3 class="product-name">${escape(p.name)}</h3><p class="product-desc">${escape(p.cardSummary)}</p><div class="product-tags">${p.tags.map(tag => `<span class="tag">${escape(tag)}</span>`).join('')}</div><div class="product-actions"><a class="product-link" href="${base}${productPath(p)}" aria-label="View ${escape(p.name)} details">VIEW DETAILS ↗</a></div></div></article>`;
}

function buildMarkets() {
  mkdirSync(path.join(outputRoot, 'markets'), { recursive: true });
  for (const market of catalog.markets) {
    const pathname = `markets/${market.slug}.html`;
    const canonical = `${origin}/${pathname}`;
    const graph = [organization, { '@type': 'WebPage', '@id': canonical, url: canonical, name: market.heading, description: market.description, inLanguage: 'en', about: { '@type': 'Country', name: market.name }, publisher: { '@id': organization['@id'] } }, { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` }, { '@type': 'ListItem', position: 2, name: 'Markets', item: `${origin}/#markets` }, { '@type': 'ListItem', position: 3, name: market.name, item: canonical }] }];
    const quote = `../index.html?market=${market.key}#contact`;
    write(pathname, `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${head({ title: market.title, description: market.description, pathname, graph }, '../')}</head><body>${banner}<a class="skip-link" href="#market-main">Skip to market guide</a>${nav('../')}<main id="market-main" class="detail-main market-main"><div class="breadcrumbs" aria-label="Breadcrumb"><a href="../index.html">Home</a><span aria-hidden="true">/</span><a href="../index.html#markets">Markets</a><span aria-hidden="true">/</span><span>${escape(market.name)}</span></div><header class="market-lead"><p class="section-tag">${escape(market.eyebrow)}</p><h1>${escape(market.heading)}</h1><p class="detail-summary">${escape(market.intro)}</p><a class="btn-primary" href="${quote}">${escape(market.cta)}</a></header><section class="detail-panel market-focus-panel"><h2>${escape(market.focusHeading)}</h2>${list(market.focus)}</section><div class="detail-columns"><section class="detail-panel"><h2>${escape(market.documentsHeading)}</h2>${list(market.documents)}${market.authority ? `<a class="text-link" href="${market.authority.url}" target="_blank" rel="noopener noreferrer">${escape(market.authority.name)} ↗</a><p class="source-date">Official source checked ${market.authority.checkedDate}. Requirements must be rechecked for the actual product and use.</p>` : ''}</section><section class="detail-panel"><h2>${escape(market.deliveryHeading)}</h2>${list(market.delivery)}</section></div><section class="detail-panel detail-questions"><p class="section-tag">Buyer questions</p><h2>${escape(market.name)} procurement questions</h2>${market.questions.map(q => `<details open><summary>${escape(q.question)}</summary><p>${escape(q.answer)}</p></details>`).join('')}</section><section class="detail-contact"><div><p class="section-tag">Start with your requirements</p><h2>${escape(market.cta)}</h2><p>Share the application, specification, quantities, required documents and destination. The initial discussion establishes what needs to be verified.</p><a class="btn-primary" href="${quote}">Prepare your enquiry</a><p><a class="market-return" href="../index.html#markets">Explore our regional focus</a></p></div><div class="contact-info">${contactBlock()}</div></section></main>${footer('../')}${chatButton('../')}<script src="../assets/catalog.js" defer></script><script src="../assets/site.js" defer></script></body></html>\n`);
  }
}

function homeCards() {
  return `<div class="products-header reveal"><div class="section-tag">${escape(ui.en.productsTag)}</div><h2 class="section-title">${escape(ui.en.productsTitle)}</h2><div class="divider"></div><p class="catalogue-note" data-ui="catalogueNote">${escape(ui.en.catalogueNote)}</p><p class="details-language" data-ui="detailsNote">${escape(ui.en.detailsNote)}</p></div><div class="cat-tabs reveal" role="group" aria-label="Filter products by application">${categories.map((c, i) => `<button class="cat-tab${i === 0 ? ' active' : ''}" type="button" data-category="${c.key}" aria-pressed="${i === 0}">${escape(c.name)}</button>`).join('')}</div>${categories.map((c, i) => `<div class="product-category${i === 0 ? ' active' : ''}" id="cat-${c.key}" aria-label="${escape(c.name)} products"><h3 class="category-heading">${escape(c.name)}</h3><div class="products-grid">${products.filter(p => p.category === c.key).map(p => card(p)).join('')}</div></div>`).join('')}`;
}

const homeGraph = [organization, { '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: company.name, publisher: { '@id': organization['@id'] }, inLanguage: 'en' }, { '@type': 'ItemList', name: 'Victory Global Materials piping catalogue', itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: productUrl(p) })) }];
let home = read('src/home.html');
const substitutions = {
  PAGE_HEAD: head({ title: catalog.positioning.homeTitle, description: catalog.positioning.homeDescription, pathname: '', graph: homeGraph }),
  ...homeContent({ catalog, ui, escape, nav, contactBlock, footer, production }),
  BETA_BANNER: banner, PRODUCT_CARDS: homeCards(), CONTACT_BLOCK: contactBlock(), FOOTER_CONTACT: footerContact(), CHAT_BUTTON: chatButton(), BASE: ''
};
home = home.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
  if (!(key in substitutions)) throw new Error(`Unresolved template slot ${key}`);
  return substitutions[key];
});
write('index.html', home.trimEnd() + '\n');
const runtimeData = {
  mode: production ? 'production' : 'preview', ui, categories,
  products: products.map(({ key, name, image, cardSummary, tags, locale }) => ({ key, name, image, cardSummary, tags, locale })),
  markets: catalog.markets.map(({ key, name }) => ({ key, name }))
};
write('assets/catalog.js', `window.VGM_CATALOG = ${serialize(runtimeData)};\n`);
mkdirSync(path.join(outputRoot, 'products'), { recursive: true });

for (const p of products) {
  const canonical = productUrl(p);
  const productEntity = { '@type': 'Product', '@id': `${canonical}#product`, name: p.name, description: p.summary, image: `${origin}/${p.image}`, category: categoryName(p), url: canonical, additionalProperty: p.specifications.map(([name, value]) => ({ '@type': 'PropertyValue', name, value })) };
  const graph = [organization, productEntity, { '@type': 'WebPage', '@id': canonical, url: canonical, name: p.name, inLanguage: 'en', mainEntity: { '@id': productEntity['@id'] } }, { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` }, { '@type': 'ListItem', position: 2, name: 'Products', item: `${origin}/#products` }, { '@type': 'ListItem', position: 3, name: p.name, item: canonical }] }];
  const sameCategory = products.filter(other => other.category === p.category && other.key !== p.key);
  const related = (sameCategory.length ? sameCategory : products.filter(other => ['hdpe_water', 'hdpe_corrugated'].includes(other.key))).slice(0, 3);
  const quoteLink = `../index.html?product=${p.key}#contact`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head({ title: `${p.name} | Victory Global`, description: p.cardSummary + ' Review specifications and documentation for your project enquiry.', pathname: productPath(p), image: p.image, graph }, '../')}</head><body>${banner}<a class="skip-link" href="#product-main">Skip to product details</a>${nav('../')}
<main id="product-main" class="detail-main">
<div class="breadcrumbs" aria-label="Breadcrumb"><a href="../index.html">Home</a><span aria-hidden="true">/</span><a href="../index.html#products">Products</a><span aria-hidden="true">/</span><span>${escape(p.name)}</span></div>
<div class="detail-hero"><div><p class="section-tag">${escape(categoryName(p))} · Catalogue reference</p><h1>${escape(p.name)}</h1><p class="detail-summary">${escape(p.summary)}</p><div class="product-tags">${p.tags.map(tag => `<span class="tag">${escape(tag)}</span>`).join('')}</div><div class="detail-actions"><a class="btn-primary" href="${quoteLink}">Discuss this product</a><a class="btn-outline" href="${company.whatsappUrl}" target="_blank" rel="noopener noreferrer">WhatsApp ${company.whatsapp}</a></div></div><div class="detail-image"><img src="../${p.image}" alt="${escape(p.name)}" width="800" height="600" fetchpriority="high" decoding="async"></div></div>
<div class="detail-columns"><section class="detail-panel" aria-labelledby="spec-heading"><p class="section-tag">Product information</p><h2 id="spec-heading">Specifications at a glance</h2><p class="spec-note">These are family-level references from our existing catalogue. Confirm the selected configuration, ratings and availability with your quotation.</p><table class="spec-table"><caption class="sr-only">${escape(p.name)} catalogue specifications</caption><tbody>${p.specifications.map(([name, value]) => `<tr><th scope="row">${escape(name)}</th><td>${escape(value)}</td></tr>`).join('')}</tbody></table></section><section class="detail-panel"><p class="section-tag">Where it is used</p><h2>Typical applications</h2>${list(p.applications)}<p class="selection-note">Project suitability depends on the selected product and installation requirements.</p></section></div>
<div class="detail-columns"><section class="detail-panel"><p class="section-tag">Plan your enquiry</p><h2>Before you specify</h2>${list(p.selection)}</section><section class="detail-panel"><p class="section-tag">Supporting evidence</p><h2>Documents to request</h2>${list(p.documents)}<a class="text-link" href="${quoteLink}">Ask about product documentation ↗</a></section></div>
<section class="detail-panel detail-questions"><p class="section-tag">Buyer questions</p><h2>Questions about ${escape(p.name)}</h2>${p.questions.map(q => `<details open><summary>${escape(q.question)}</summary><p>${escape(q.answer)}</p></details>`).join('')}</section>
<section class="related-section"><p class="section-tag">Explore the catalogue</p><h2>${sameCategory.length ? 'More ' + escape(categoryName(p).toLowerCase()) + ' ranges' : 'Other piping ranges'}</h2><div class="related-grid">${related.map(other => card(other, '../')).join('')}</div></section>
<section class="detail-contact"><div><p class="section-tag">Start your project</p><h2>Request a project quotation</h2><p>Share the product, specification, quantity and destination so your requirements can be reviewed.</p><a class="btn-primary" href="${quoteLink}">Prepare your enquiry</a></div><div class="contact-info">${contactBlock()}</div></section>
</main>${footer('../')}${chatButton('../')}<script src="../assets/catalog.js" defer></script><script src="../assets/site.js" defer></script></body></html>\n`;
  write(productPath(p), html);
}

write('thank-you.html', `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head({ title: production ? 'Thank You | Victory Global Materials' : 'Enquiry Preview | Victory Global Materials', description: production ? 'Thank you for your project enquiry to Victory Global Materials. Contact our team for further information.' : 'Local beta demonstration of the project enquiry flow. No enquiry has been sent.', pathname: 'thank-you.html' })}</head><body>${banner}<a class="skip-link" href="#enquiry-result">Skip to enquiry result</a>${nav()}<main class="detail-main thank-main" id="enquiry-result"><div class="thank-card"><div><span class="result-pill">${production ? 'Thank you for getting in touch' : '✓ Preview complete'}</span><h1>${production ? 'Thank you for your enquiry.' : 'Your enquiry flow is ready to review.'}</h1><p class="detail-summary">${production ? 'Our team will review the requirements you provided. For additional details or a direct project discussion, please use the contact information below.' : 'This is the local beta sample. No enquiry has been sent, saved or shared, and the live website has not changed.'}</p><p>${production ? 'You can continue browsing the catalogue or share another project requirement.' : 'For a real project discussion, you can contact Victory Global Materials directly using the details below.'}</p><div class="detail-actions"><a class="btn-primary" href="index.html#products">View Products</a><a class="btn-outline" href="index.html#contact">${production ? 'Discuss another requirement' : 'Back to the sample form'}</a></div></div><div class="thank-contact"><h2>Contact Victory Global Materials</h2><div class="contact-info">${contactBlock()}</div><a class="btn-whatsapp" href="${company.whatsappUrl}" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></div></div></main>${footer()}<script src="assets/catalog.js" defer></script><script src="assets/site.js" defer></script></body></html>\n`);

buildMarkets();
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['', ...products.map(productPath), ...catalog.markets.map(m => `markets/${m.slug}.html`)].map(pathname => `  <url><loc>${origin}/${pathname}</loc><lastmod>${catalog.reviewDate}</lastmod></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', production ? `User-agent: *\nDisallow:\n\nSitemap: ${origin}/sitemap.xml\n` : '# Local beta only. Production crawler settings have not changed.\nUser-agent: *\nDisallow: /\n');
if (production) {
  write('CNAME', new URL(origin).hostname);
  write('assets/analytics.js', `(() => {\n  if (!['victoryglobalmaterials.com', 'www.victoryglobalmaterials.com'].includes(location.hostname)) return;\n  window.dataLayer = window.dataLayer || [];\n  window.gtag = function () { window.dataLayer.push(arguments); };\n  window.gtag('js', new Date());\n  window.gtag('config', 'G-G62KT54MPQ');\n  const script = document.createElement('script');\n  script.async = true;\n  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-G62KT54MPQ';\n  document.head.append(script);\n})();\n`);
}
console.log(`Built ${production ? 'production site in ' + outputRoot : 'local beta'}: homepage, 10 products, 2 market guides, thank-you and sitemap.`);

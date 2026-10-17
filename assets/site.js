(() => {
  'use strict';
  const data = window.VGM_CATALOG;
  if (!data) return;
  const languageStorageKey = data.mode === 'production' ? 'vgmLanguage' : 'vgmBetaLanguage';
  const nav = document.getElementById('siteNav');
  const toggle = nav?.querySelector('.nav-toggle');
  const closeMenu = () => {
    nav?.classList.remove('nav-open');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Open menu');
  };
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 900) closeMenu(); });

  const home = document.getElementById('home');
  const text = (selector, value) => {
    const element = document.querySelector(selector);
    if (element && value != null) element.textContent = value;
  };
  function setLanguage(language) {
    const lang = data.ui[language] ? language : 'en';
    const t = data.ui[lang];
    document.documentElement.lang = t.htmlLang;
    document.querySelectorAll('.logo-main').forEach(el => el.textContent = t.brandMain);
    const subs = document.querySelectorAll('.logo .logo-sub');
    if (subs[0]) subs[0].textContent = t.brandSub;
    if (subs[1]) subs[1].textContent = t.footerSub;
    nav.querySelectorAll('.nav-links a').forEach((el, i) => el.textContent = t.nav[i]);
    text('.nav-cta', t.navCta);
    home.querySelector('h1').innerHTML = t.heroTitle;
    text('.hero-sub', t.heroSub);
    home.querySelectorAll('.hero-btns a').forEach((el, i) => el.textContent = t.heroBtns[i]);
    home.querySelectorAll('.stat-label').forEach((el, i) => el.textContent = t.stats[i]);
    for (const sectionKey of ['about', 'vision']) {
      const section = document.getElementById(sectionKey);
      const sectionText = section.querySelector('.about-text');
      sectionText.querySelector('.section-tag').textContent = t[sectionKey + 'Tag'];
      sectionText.querySelector('.section-title').innerHTML = t[sectionKey + 'Title'];
      sectionText.querySelectorAll('p').forEach((el, i) => el.textContent = t[sectionKey + 'Ps'][i]);
      section.querySelectorAll('.feature-card').forEach((card, i) => {
        const [title, description] = t[sectionKey + 'Features'][i];
        card.querySelector('.feature-title').textContent = title;
        card.querySelector('.feature-desc').textContent = description;
      });
    }
    text('#products .section-tag', t.productsTag);
    text('#products .section-title', t.productsTitle);
    document.querySelectorAll('.cat-tab').forEach((el, i) => el.textContent = t.categoryTabs[i]);
    document.querySelectorAll('.category-heading').forEach((el, i) => el.textContent = t.categoryTabs[i]);
    for (const p of data.products) {
      const card = document.querySelector(`[data-product-key="${p.key}"]`);
      const translated = p.locale[lang];
      const name = translated?.name || p.name;
      card.querySelector('.product-cat-label').textContent = t.categoryTabs[data.categories.findIndex(c => c.key === p.category)];
      card.querySelector('.product-name').textContent = name;
      card.querySelector('.product-desc').textContent = translated?.summary || p.cardSummary;
      const tags = translated?.tags || p.tags;
      card.querySelectorAll('.tag').forEach((el, i) => el.textContent = tags[i]);
      card.querySelector('img').alt = name;
      const link = card.querySelector('.product-link');
      link.textContent = t.viewDetails;
      link.setAttribute('aria-label', `${t.viewDetails} ${name} (English)`);
    }
    text('#partners .section-tag', t.partnersTag);
    text('#partners .section-title', t.partnersTitle);
    text('#partners .reveal p', t.partnersDesc);
    text('#contact .section-tag', t.contactTag);
    text('#contact .section-title', t.contactTitle);
    text('#contactCompany', t.contactCompany);
    for (const key of ['address', 'email', 'telephone', 'wechat', 'whatsapp']) text(`#${key}-label`, t[key + 'Label']);
    document.querySelectorAll('[data-contact-label]').forEach(el => el.textContent = t[el.dataset.contactLabel]);
    document.querySelectorAll('[data-ui]').forEach(el => el.textContent = t[el.dataset.ui]);
    document.querySelectorAll('[data-html-ui]').forEach(el => el.innerHTML = t[el.dataset.htmlUi]);
    data.markets.forEach((market, i) => {
      const card = document.querySelector(`[data-market="${market.key}"]`);
      const copy = t.marketCards[i];
      card.querySelector('h3').textContent = copy.name;
      card.querySelector('.market-focus').textContent = copy.focus;
      card.querySelector('.market-description').textContent = copy.description;
      card.querySelector('a').textContent = copy.linkText;
      card.querySelector('a').setAttribute('aria-label', `${copy.linkText} (English)`);
    });
    text('#preview-form-note', t.previewNote);
    document.querySelectorAll('[data-form-label]').forEach(el => el.textContent = t.formLabels[Number(el.dataset.formLabel)]);
    document.querySelectorAll('.contact-form input:not([name="destination"])').forEach(el => el.placeholder = t.formLabels[Number(document.querySelector(`label[for="${el.id}"]`).dataset.formLabel)]);
    document.getElementById('enquiry-destination').placeholder = t.destinationPlaceholder;
    document.getElementById('enquiry-message').placeholder = t.messagePlaceholder;
    text('.contact-form button', t.sendEnquiry);
    text('.footer-copy', t.footerCopy);
    document.querySelectorAll('.lang-btn').forEach(button => {
      const active = button.dataset.lang === lang;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    try { localStorage.setItem(languageStorageKey, lang); } catch { /* Storage is optional. */ }
  }

  if (home) {
    document.querySelectorAll('.lang-btn').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
    let lang = 'en';
    try { lang = localStorage.getItem(languageStorageKey) || 'en'; } catch { /* English stays the default. */ }
    setLanguage(lang);
    document.querySelectorAll('.cat-tab').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('.cat-tab').forEach(tab => {
        const active = tab === button;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-pressed', String(active));
      });
      document.querySelectorAll('.product-category').forEach(category => category.classList.toggle('active', category.id === 'cat-' + button.dataset.category));
    }));
    const params = new URLSearchParams(location.search);
    const productKey = params.get('product');
    const product = data.products.find(p => p.key === productKey);
    const market = data.markets.find(m => m.key === params.get('market'));
    const destination = document.getElementById('enquiry-destination');
    if (market) destination.value = market.name;
    if (product) document.getElementById('enquiry-message').value = `Product enquiry: ${product.name}\nApplication: \nSpecification: \nQuantity: \nRequired documents: `;
    // Only the local review sample intercepts submission. Production uses the form backend.
    if (data.mode !== 'production') document.querySelector('.contact-form').addEventListener('submit', event => {
      event.preventDefault();
      location.assign('thank-you.html');
    });
    const rotator = document.getElementById('heroRotator');
    if (rotator && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const slides = data.products.filter(p => ['hdpe_water', 'pvc_water', 'ss_water'].includes(p.key));
      let index = 0;
      setInterval(() => {
        if (document.hidden) return;
        index = (index + 1) % slides.length;
        rotator.src = slides[index].image;
        rotator.alt = slides[index].name;
      }, 5000);
    }
  }
  // Only hide filtered categories after the interactive controls are initialized.
  document.documentElement.classList.add('has-js');
})();

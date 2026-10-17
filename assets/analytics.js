(() => {
  if (!['victoryglobalmaterials.com', 'www.victoryglobalmaterials.com'].includes(location.hostname)) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-G62KT54MPQ');
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-G62KT54MPQ';
  document.head.append(script);
})();

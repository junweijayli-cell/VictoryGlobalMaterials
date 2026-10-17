# Victory Global Materials

Static website at https://victoryglobalmaterials.com, published by the existing GitHub Pages deployment from `main` and the repository root.

The site introduces China-based independent sourcing for Southeast Asia projects, highlighting Malaysia and Singapore. It includes ten English product-family pages, two market guides, and English, Vietnamese and Chinese homepage controls. Specifications are catalogue references, not blanket destination approvals.

WhatsApp: +65 89736956. Telephone and WeChat: +86 18664333510.

## Maintenance

Edit the shared catalogue and homepage translations in `_source/data`, layout in `_source/src`, rendering in `_source/scripts`, and public styles/behavior in `assets`. Build with Node.js (built-in modules only):

```text
npm run build
npm run check
```

The optional check uses Python and BeautifulSoup. It checks public pages, internal links, metadata, schema, indexing and production configuration without sending enquiries. For HTTP checks, run the checker with `--base` against the published origin.

GitHub Pages excludes `_source` and maintenance files through `_config.yml`. Local beta review notes, internal business planning and test screenshots are not included in the production release.

The enquiry form uses the existing FormSubmit recipient `info@victory-global.cn` and redirects to the custom-domain thank-you page. The existing analytics property is initialized only on the production domain. The thank-you page remains noindex; public product and market pages are included in the sitemap.

No prices, stock promises, authorization, model-specific certifications or regional delivery track record are inferred from catalogue inclusion. Confirm the actual product documentation and commercial route for each enquiry.

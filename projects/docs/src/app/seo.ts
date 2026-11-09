import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TitleStrategy, type RouterStateSnapshot } from '@angular/router';
import { NAV_SECTIONS, PAGES, SITE_NAME, SITE_URL, groupOf, sectionRoute } from './docs';

const HOME = {
  title: 'Exeris documentation',
  description: 'Guides, architecture and reference of the Exeris kernel, SDK, tooling and Spring runtime, with the decisions behind them, rendered from their repositories.',
};
const NOT_FOUND = { title: 'Page not found', description: 'This address is not a page of the Exeris documentation.' };
const SOCIAL_IMAGE = `${SITE_URL}/assets/brand/exeris-social-1200x630.png`;

/** A section's page list: its label in its group, and what it lists. */
function sectionSeo(section: (typeof NAV_SECTIONS)[number]): { title: string; description: string } {
  const group = groupOf(section).label;
  const titles = section.pages.slice(0, 3).map((p) => p.navTitle ?? p.title);
  return {
    title: `${section.label} · ${group}`,
    description: `${section.pages.length} pages of ${group}, ${section.label}: ${titles.join(', ')}${section.pages.length > 3 ? ' and more' : ''}.`,
  };
}

/**
 * Sets the title, description, canonical and Open Graph tags of every page from the generated
 * index, so the prerendered HTML of each route carries its own. The home route and the not-found
 * page have fixed copy; the not-found page is noindex.
 */
@Injectable({ providedIn: 'root' })
export class DocsTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const path = snapshot.url.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '');
    const page = PAGES.find((p) => p.route === path);
    const section = NAV_SECTIONS.find((s) => sectionRoute(s) === `/${path}`);
    const home = path === '';
    const seo = home
      ? HOME
      : page
        ? { title: page.headTitle ?? page.title, description: page.description }
        : section
          ? sectionSeo(section)
          : NOT_FOUND;
    const indexable = home || !!page || !!section;
    const url = indexable ? `${SITE_URL}/${path}` : `${SITE_URL}/404`;
    const title = home ? `${SITE_NAME}` : `${seo.title} — ${SITE_NAME}`;

    this.title.setTitle(title);
    this.tag('name', 'description', seo.description || HOME.description);
    this.tag('name', 'robots', indexable ? 'index, follow' : 'noindex');
    this.tag('property', 'og:type', home ? 'website' : 'article');
    this.tag('property', 'og:site_name', SITE_NAME);
    this.tag('property', 'og:title', title);
    this.tag('property', 'og:description', seo.description || HOME.description);
    this.tag('property', 'og:url', url);
    this.tag('property', 'og:image', SOCIAL_IMAGE);
    this.tag('property', 'og:locale', 'en');
    this.tag('name', 'twitter:card', 'summary_large_image');
    this.canonical(url);
  }

  private tag(attr: 'name' | 'property', key: string, content: string): void {
    this.meta.updateTag({ [attr]: key, content }, `${attr}="${key}"`);
  }

  private canonical(href: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}

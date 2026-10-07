import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TitleStrategy, type ActivatedRouteSnapshot, type RouterStateSnapshot } from '@angular/router';
import seoJson from '../../../content/meta/seo.json';
import { SITE_NAME, SITE_URL } from '../../content/site';
import type { ViewJson } from '../view/view-types';

interface PageSeo {
  readonly title: string;
  readonly description: string;
  readonly index?: boolean;
}

const SEO = seoJson as Readonly<Record<string, PageSeo>>;
const SOCIAL_IMAGE = `${SITE_URL}/assets/brand/exeris-social-1200x630.png`;

/** The view a route renders: its `view` route data, or the generated page's route path. */
function viewName(snapshot: RouterStateSnapshot): string {
  let route: ActivatedRouteSnapshot | null = snapshot.root;
  let name: string | null = null;
  while (route) {
    const view = route.data['view'] as ViewJson | undefined;
    if (view) name = view.view.name;
    else if (route.data['viewName']) name = route.data['viewName'] as string;
    route = route.firstChild;
  }
  return name ?? 'not-found';
}

/**
 * Sets the document title and the SEO and Open Graph tags of every page from
 * content/meta/seo.json, keyed by view name. Runs on the server too, so the prerendered HTML of
 * each route carries its own tags.
 */
@Injectable({ providedIn: 'root' })
export class SeoTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const name = viewName(snapshot);
    const seo = SEO[name];
    if (!seo) throw new Error(`content/meta/seo.json has no entry for view "${name}"`);
    const path = snapshot.url.split(/[?#]/)[0];
    const indexable = seo.index !== false;
    const url = indexable ? `${SITE_URL}${path === '/' ? '/' : path}` : `${SITE_URL}/404`;
    const title = name === 'home' ? `${SITE_NAME} — ${seo.title}` : `${seo.title} — ${SITE_NAME}`;

    this.title.setTitle(title);
    this.tag('name', 'description', seo.description);
    this.tag('name', 'robots', indexable ? 'index, follow' : 'noindex');
    this.tag('property', 'og:type', 'website');
    this.tag('property', 'og:site_name', SITE_NAME);
    this.tag('property', 'og:title', title);
    this.tag('property', 'og:description', seo.description);
    this.tag('property', 'og:url', url);
    this.tag('property', 'og:image', SOCIAL_IMAGE);
    this.tag('property', 'og:image:width', '1200');
    this.tag('property', 'og:image:height', '630');
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

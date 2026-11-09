import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaletteService } from '@exeris-web/shell';
import { NAV_GROUPS, PAGES, navTitle, sectionRoute, type NavGroup, type NavSection } from './docs';

/** The first pages a reader can start from, by what they want to do. */
const START = [
  {
    title: 'Generate an application',
    body: 'Add the tooling to a Maven build, then see what one annotated entity turns into and what you still write.',
    route: 'tooling/guides/01-add-the-tooling-to-a-build',
  },
  {
    title: 'Model a domain',
    body: 'Write a first entity with the SDK annotations and check what each one declares.',
    route: 'sdk/guides/02-model-a-domain',
  },
  {
    title: 'Run an application on the kernel',
    body: 'Boot an application on the kernel, serve HTTP, configure it and test it.',
    route: 'kernel/guides/02-build-an-application',
  },
  {
    title: 'Host a Spring application',
    body: 'A Spring Boot application whose HTTP ingress the Exeris kernel owns, with no servlet container.',
    route: 'spring-runtime/guides/getting-started',
  },
] as const;

/** One sentence per group: what its documents describe. */
const ABOUT: Readonly<Record<string, string>> = {
  kernel: 'The runtime: a Spring-free SPI and core, the Community driver, and the subsystems for transport, memory, persistence and flow.',
  sdk: 'The annotations an application is declared with, the source model that reads them, and the UI kit.',
  tooling: 'The annotation processor and the generators that turn declared entities into a backend and an Angular front end.',
  'spring-runtime': 'Spring applications hosted on the Exeris kernel, in Pure Mode or Compatibility Mode.',
  platform: 'How the repositories fit together: the high-level architecture, the capability model and its licences.',
};

/** One sentence per section of the records group. */
const RECORDS: Readonly<Record<string, string>> = {
  decisions: 'The architecture decision records of every repository, in the order of the registry.',
  rfcs: 'Requests for comments: the options weighed before a decision.',
  standards: 'The standards the code and the documentation of the repositories follow.',
};

const RECORDS_GROUP = 'records';

/**
 * The entry to the documentation: search, a few places to start by task, each product with what it
 * covers and its sections, and the records as page lists.
 */
@Component({
  selector: 'ex-docs-home',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section ex-docs-hero">
      <div class="ex-container">
        <p class="ex-eyebrow">DOCUMENTATION</p>
        <h1 class="ex-docs-title">Exeris documentation</h1>
        <p class="ex-docs-lede">
          Guides, architecture and reference for the kernel, the SDK, the tooling and the Spring runtime, read from the main branch
          of each repository when the site is built.
        </p>
        <button type="button" class="ex-docs-search" (click)="palette.show()" aria-keyshortcuts="Control+K Meta+K /">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.4" />
            <path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.4" />
          </svg>
          <span>Search {{ count }} pages</span>
          <kbd>⌘K</kbd>
        </button>
      </div>
    </section>

    <section class="ex-docs-band" aria-labelledby="start">
      <div class="ex-container">
        <h2 id="start" class="ex-docs-band__title">Start here</h2>
        <ul class="ex-docs-start">
          @for (s of start; track s.route) {
            <li>
              <a class="ex-docs-start__card" [routerLink]="'/' + s.route">
                <span class="ex-docs-start__title">{{ s.title }}</span>
                <span class="ex-docs-start__body">{{ s.body }}</span>
                <span class="ex-docs-start__go" aria-hidden="true">Read the guide →</span>
              </a>
            </li>
          }
        </ul>
      </div>
    </section>

    <section class="ex-docs-band" aria-labelledby="products">
      <div class="ex-container">
        <h2 id="products" class="ex-docs-band__title">By product</h2>
        <div class="ex-docs-products">
          @for (g of products; track g.id) {
            <article class="ex-docs-product" [id]="g.id">
              <h3 class="ex-docs-product__name">
                <a [routerLink]="'/' + first(g).route">{{ g.label }}</a>
              </h3>
              @if (about[g.id]; as text) {
                <p class="ex-docs-product__about">{{ text }}</p>
              }
              <ul class="ex-docs-product__sections">
                @for (s of g.sections; track s.id) {
                  <li>
                    <a [routerLink]="route(s)">{{ s.label }}</a>
                    <span class="ex-docs-product__count">{{ s.pages.length }}</span>
                  </li>
                }
              </ul>
              <a class="ex-docs-product__first" [routerLink]="'/' + first(g).route">Start with {{ label(first(g)) }} →</a>
            </article>
          }
        </div>
      </div>
    </section>

    @if (records; as r) {
      <section class="ex-docs-band" aria-labelledby="records">
        <div class="ex-container">
          <h2 [id]="r.id" class="ex-docs-band__title">{{ r.label }}</h2>
          <ul class="ex-docs-records">
            @for (s of r.sections; track s.id) {
              <li>
                <a class="ex-docs-records__card" [routerLink]="route(s)">
                  <span class="ex-docs-records__count">{{ s.pages.length }}</span>
                  <span class="ex-docs-records__name">{{ s.label }}</span>
                  @if (recordsAbout[s.id]; as text) {
                    <span class="ex-docs-records__about">{{ text }}</span>
                  }
                </a>
              </li>
            }
          </ul>
        </div>
      </section>
    }
  `,
})
export class HomePageComponent {
  protected readonly palette = inject(PaletteService);
  protected readonly count = PAGES.length;
  protected readonly start = START;
  protected readonly about = ABOUT;
  protected readonly recordsAbout = RECORDS;
  protected readonly products = NAV_GROUPS.filter((g) => g.id !== RECORDS_GROUP);
  protected readonly records = NAV_GROUPS.find((g) => g.id === RECORDS_GROUP) ?? null;

  protected first(g: NavGroup) {
    return g.sections[0].pages[0];
  }

  protected label(p: (typeof PAGES)[number]): string {
    return navTitle(p);
  }

  protected route(s: NavSection): string {
    return sectionRoute(s);
  }
}

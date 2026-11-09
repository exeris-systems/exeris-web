import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import type { DocPage } from './doc-types';
import { NAV_GROUPS, NAV_SECTIONS, navTitle, sectionRoute } from './docs';

/** Sections longer than this (the records) are a disclosure of their own inside the group. */
const LONG_SECTION = 25;

/**
 * Every group and its sections, in the order of projects/docs/sources.json. A group is a
 * disclosure, open when it holds the current page or section; inside it each section is a heading
 * that links to its page list, then its pages, except that a long section is a disclosure too. On
 * a narrow screen the whole list folds behind a Contents button that names where the reader is.
 */
@Component({
  selector: 'ex-docs-sidebar',
  imports: [RouterLink, RouterLinkActive, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ex-docs-side' },
  template: `
    <button type="button" class="ex-docs-side__toggle" aria-controls="docs-nav" [attr.aria-expanded]="open()" (click)="open.set(!open())">
      <span class="ex-docs-side__toggle-label">Contents</span>
      @if (place(); as at) {
        <span class="ex-docs-side__toggle-place">{{ at }}</span>
      }
      <span class="ex-docs-side__caret" aria-hidden="true"></span>
    </button>
    <nav id="docs-nav" class="ex-docs-nav" [class.is-open]="open()" aria-label="Documentation">
      @for (g of groups; track g.id) {
        <details class="ex-docs-nav__group" [open]="g.id === group()">
          <summary>{{ g.label }}</summary>
          @for (s of g.sections; track s.id) {
            @if (s.pages.length > long) {
              <details class="ex-docs-nav__section" [open]="s.id === section()">
                <summary>{{ s.label }} <span class="ex-docs-nav__count">{{ s.pages.length }}</span></summary>
                <a class="ex-docs-nav__all" [routerLink]="route(s)">All {{ s.pages.length }} as a list</a>
                <ng-container *ngTemplateOutlet="list; context: { $implicit: s.pages }" />
              </details>
            } @else {
              <a class="ex-docs-nav__heading" [routerLink]="route(s)" routerLinkActive="is-active" [routerLinkActiveOptions]="exact">{{ s.label }}</a>
              <ng-container *ngTemplateOutlet="list; context: { $implicit: s.pages }" />
            }
          }
        </details>
      }
    </nav>

    <ng-template #list let-pages>
      <ul>
        @for (p of pages; track p.id) {
          <li>
            <a [routerLink]="'/' + p.route" routerLinkActive="is-active" [routerLinkActiveOptions]="exact" [attr.aria-current]="current() === p.id ? 'page' : null">{{ label(p) }}</a>
          </li>
        }
      </ul>
    </ng-template>
  `,
})
export class SidebarComponent {
  /** The id of the page shown beside, if any. */
  readonly current = input<string | null>(null);
  /** The section whose list is shown beside, when no page is. */
  readonly currentSection = input<string | null>(null);

  protected readonly open = signal(false);
  protected readonly groups = NAV_GROUPS;
  protected readonly long = LONG_SECTION;
  /** A page is active only at its own route: `/sdk` is not active on `/sdk/guides`. */
  protected readonly exact = { exact: true };
  protected readonly section = computed(
    () => this.currentSection() ?? NAV_SECTIONS.find((s) => s.pages.some((p) => p.id === this.current()))?.id ?? null,
  );
  protected readonly group = computed(() => NAV_SECTIONS.find((s) => s.id === this.section())?.group ?? null);
  protected readonly place = computed(() => {
    const s = NAV_SECTIONS.find((x) => x.id === this.section());
    const g = NAV_GROUPS.find((x) => x.id === s?.group);
    return s && g ? `${g.label} › ${s.label}` : null;
  });

  protected label(p: DocPage): string {
    return navTitle(p);
  }

  protected route(s: (typeof NAV_SECTIONS)[number]): string {
    return sectionRoute(s);
  }

  constructor() {
    // On a narrow screen the list closes once a navigation completes.
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.open.set(false));
  }
}

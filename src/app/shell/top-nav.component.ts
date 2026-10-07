import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { CONSOLE_URL, NAV, type NavItem } from '../../content/site';
import { HrefDirective } from './href.directive';
import { LogoComponent } from './logo.component';
import { PaletteService } from './palette.service';

@Component({
  selector: 'ex-top-nav',
  imports: [HrefDirective, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeAll()',
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <header class="ex-nav">
      <div class="ex-nav__bar">
        <ex-logo />
        <span class="ex-nav__divider" aria-hidden="true"></span>
        <nav class="ex-nav__primary" aria-label="Primary">
          <ul>
            @for (item of nav; track item.id) {
              <li class="ex-nav__item" [class.is-active]="active() === item.id">
                @if (item.children) {
                  <button
                    type="button"
                    class="ex-nav__link"
                    [attr.aria-expanded]="openMenu() === item.id"
                    [attr.aria-controls]="'menu-' + item.id"
                    (click)="toggleMenu(item.id)"
                  >
                    {{ item.label }}
                    <svg class="ex-nav__chev" viewBox="0 0 10 6" width="10" height="6" aria-hidden="true">
                      <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4" />
                    </svg>
                  </button>
                  <ul class="ex-nav__menu" [id]="'menu-' + item.id" [hidden]="openMenu() !== item.id">
                    @for (child of item.children; track child.href) {
                      <li>
                        <a [exHref]="child.href">
                          <span class="ex-nav__menu-label">{{ child.label }}</span>
                          @if (child.description) {
                            <span class="ex-nav__menu-desc">{{ child.description }}</span>
                          }
                        </a>
                      </li>
                    }
                  </ul>
                } @else {
                  <a class="ex-nav__link" [exHref]="item.href" [attr.aria-current]="active() === item.id ? 'page' : null">
                    {{ item.label }}
                  </a>
                }
              </li>
            }
          </ul>
        </nav>
        <span class="ex-nav__flex"></span>
        <button type="button" class="ex-nav__search" (click)="palette.show()" aria-label="Search the site" aria-keyshortcuts="Control+K Meta+K /">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.4" />
            <path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.4" />
          </svg>
          <span class="ex-nav__search-label">Search</span>
          <kbd>⌘K</kbd>
        </button>
        <a class="ex-nav__signin" [href]="consoleUrl">Sign in</a>
        <a class="ex-btn ex-btn--solid ex-btn--sm ex-nav__cta" [href]="consoleUrl">Get started →</a>
        <button
          type="button"
          class="ex-nav__burger"
          [attr.aria-expanded]="mobileOpen()"
          aria-controls="mobile-menu"
          (click)="mobileOpen.set(!mobileOpen())"
        >
          <span class="ex-sr">Menu</span>
          <svg viewBox="0 0 18 14" width="18" height="14" aria-hidden="true">
            @if (mobileOpen()) {
              <path d="M2 1l14 12M16 1L2 13" stroke="currentColor" stroke-width="1.6" />
            } @else {
              <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" stroke-width="1.6" />
            }
          </svg>
        </button>
      </div>
      <nav id="mobile-menu" class="ex-nav__mobile" aria-label="Site" [hidden]="!mobileOpen()">
        @for (item of nav; track item.id) {
          <div class="ex-nav__mobile-group">
            <a class="ex-nav__mobile-top" [exHref]="item.href">{{ item.label }}</a>
            @if (item.children) {
              <ul>
                @for (child of item.children; track child.href) {
                  @if (child.href !== item.href) {
                    <li><a [exHref]="child.href">{{ child.label }}</a></li>
                  }
                }
              </ul>
            }
          </div>
        }
        <div class="ex-nav__mobile-actions">
          <a class="ex-btn ex-btn--sm" [href]="consoleUrl">Sign in</a>
          <a class="ex-btn ex-btn--solid ex-btn--sm" [href]="consoleUrl">Get started →</a>
        </div>
      </nav>
    </header>
  `,
})
export class TopNavComponent {
  protected readonly nav: readonly NavItem[] = NAV;
  protected readonly consoleUrl = CONSOLE_URL;
  protected readonly palette = inject(PaletteService);
  protected readonly openMenu = signal<string | null>(null);
  protected readonly mobileOpen = signal(false);

  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  constructor() {
    // Any navigation, from a menu link or elsewhere, closes the open menus.
    effect(() => {
      this.url();
      this.closeAll();
    });
  }

  /** The top-level item whose section the current page belongs to. */
  protected readonly active = computed(() => {
    const path = this.url().split(/[?#]/)[0];
    const hit = NAV.find((item) => path === item.href || path.startsWith(`${item.href}/`));
    return hit?.id ?? null;
  });

  protected toggleMenu(id: string): void {
    this.openMenu.set(this.openMenu() === id ? null : id);
  }

  protected closeAll(): void {
    this.openMenu.set(null);
    this.mobileOpen.set(false);
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.openMenu() && !this.host.nativeElement.contains(event.target as Node)) {
      this.openMenu.set(null);
    }
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import indexJson from '../../data/search-index.json';
import { isExternal } from './href.directive';
import { searchIndex, type SearchEntry } from './fuzzy';
import { PaletteService } from './palette.service';

const INDEX = indexJson as readonly SearchEntry[];

const KIND_LABEL: Record<SearchEntry['kind'], string> = {
  page: 'Page',
  capability: 'Cap',
  sku: 'SKU',
  concept: 'Concept',
  doc: 'Doc',
};

/**
 * ⌘K / Ctrl+K / "/" command palette over the build-time index (routes, capabilities, SKUs,
 * concepts, docs). A combobox with a listbox: ↑ ↓ move, ↵ opens, Esc closes and returns focus.
 */
@Component({
  selector: 'ex-command-palette',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onGlobalKey($event)',
  },
  template: `
    @if (palette.open()) {
      <div class="ex-palette__scrim" (click)="close()" aria-hidden="true"></div>
      <div class="ex-palette" role="dialog" aria-modal="true" aria-label="Search the site">
        <div class="ex-palette__field">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.4" />
            <path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.4" />
          </svg>
          <input
            #field
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="palette-results"
            [attr.aria-expanded]="results().length > 0"
            [attr.aria-activedescendant]="results().length ? 'palette-opt-' + cursor() : null"
            placeholder="Search pages, capabilities, SKUs, concepts…"
            autocomplete="off"
            spellcheck="false"
            [value]="query()"
            (input)="onInput($event)"
            (keydown)="onKey($event)"
          />
          <kbd>Esc</kbd>
        </div>
        <ul id="palette-results" class="ex-palette__list" role="listbox" aria-label="Results">
          @for (entry of results(); track entry.href + entry.title; let i = $index) {
            <li
              role="option"
              [id]="'palette-opt-' + i"
              [attr.aria-selected]="i === cursor()"
              [class.is-active]="i === cursor()"
              (mousemove)="cursor.set(i)"
              (click)="go(entry)"
            >
              <span class="ex-tag" [class.ex-tag--flow]="entry.kind === 'page'" [class.ex-tag--cyan]="entry.kind === 'capability'">{{ kindLabel[entry.kind] }}</span>
              <span class="ex-palette__title">{{ entry.title }}</span>
              @if (entry.hint) {
                <span class="ex-palette__hint">{{ entry.hint }}</span>
              }
            </li>
          } @empty {
            <li class="ex-palette__empty" role="option" aria-disabled="true">No match for “{{ query() }}”.</li>
          }
        </ul>
        <p class="ex-palette__foot" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> move · <kbd>↵</kbd> open · <kbd>Esc</kbd> close</p>
      </div>
    }
  `,
})
export class CommandPaletteComponent {
  protected readonly palette = inject(PaletteService);
  protected readonly kindLabel = KIND_LABEL;
  protected readonly query = signal('');
  protected readonly cursor = signal(0);
  protected readonly results = computed(() => searchIndex(INDEX, this.query()));

  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');
  private readonly router = inject(Router);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    effect(() => {
      if (this.palette.open()) {
        this.query.set('');
        this.cursor.set(0);
      }
    });
    effect(() => {
      const el = this.field()?.nativeElement;
      if (el && this.palette.open()) el.focus();
    });
  }

  protected onGlobalKey(event: KeyboardEvent): void {
    if (!this.browser) return;
    const target = event.target as HTMLElement | null;
    const typing = !!target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    const combo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
    if (combo || (event.key === '/' && !typing && !this.palette.open())) {
      event.preventDefault();
      if (this.palette.open()) {
        this.close();
      } else {
        this.palette.show();
      }
    }
  }

  protected onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.cursor.set(0);
  }

  protected onKey(event: KeyboardEvent): void {
    const n = this.results().length;
    if (event.key === 'ArrowDown' && n) {
      event.preventDefault();
      this.cursor.set((this.cursor() + 1) % n);
    } else if (event.key === 'ArrowUp' && n) {
      event.preventDefault();
      this.cursor.set((this.cursor() - 1 + n) % n);
    } else if (event.key === 'Enter' && n) {
      event.preventDefault();
      this.go(this.results()[this.cursor()]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    } else if (event.key === 'Tab') {
      // The dialog has a single control; keep focus inside it.
      event.preventDefault();
    }
  }

  protected go(entry: SearchEntry): void {
    this.close(false);
    if (isExternal(entry.href)) {
      window.location.href = entry.href;
    } else {
      void this.router.navigateByUrl(entry.href);
    }
  }

  protected close(restoreFocus = true): void {
    this.palette.hide();
    if (restoreFocus) this.palette.returnFocus?.focus();
    this.palette.returnFocus = null;
  }
}

import { Directive, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';

/** Whether an href leaves the site (another origin, mailto). */
export function isExternal(href: string): boolean {
  return /^(https?:|mailto:)/.test(href);
}

/**
 * One attribute for every link the content names: `<a [exHref]="href">`. A site path navigates
 * through the router, so the page is not reloaded; anything else is a plain link.
 */
@Directive({
  selector: 'a[exHref]',
  host: {
    '[attr.href]': 'href()',
    '[attr.rel]': 'rel()',
    '(click)': 'onClick($event)',
  },
})
export class HrefDirective {
  readonly href = input.required<string>({ alias: 'exHref' });

  private readonly router = inject(Router);

  protected readonly rel = computed(() => (/^https?:/.test(this.href()) ? 'noopener' : null));

  protected onClick(event: MouseEvent): void {
    const href = this.href();
    if (isExternal(href) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    void this.router.navigateByUrl(href);
  }
}

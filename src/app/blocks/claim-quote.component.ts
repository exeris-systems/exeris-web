import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LINKS } from '../../content/site';
import { claim } from '../data/data';

/** A link to a claim's entry in the claims register. */
export function claimUrl(key: string): string {
  return `${LINKS.claims}#${key.split('.')[0].toLowerCase()}`;
}

/**
 * A registered claim quoted verbatim, with its id, its fence and its source report. The copy
 * comes from claims.json by key; nothing here is typed by hand.
 */
@Component({
  selector: 'ex-claim-quote',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="ex-quote">
      <blockquote>{{ c().copy }}</blockquote>
      <figcaption>
        <a class="ex-claim-id" [href]="url()">{{ c().id }} · {{ c().variant }}</a>
        @for (s of c().sources; track s.url) {
          <a class="ex-link" [href]="s.url">{{ s.label }}</a>
        }
      </figcaption>
      @if (showFence() && c().fence) {
        <p class="ex-fence"><strong>Fence</strong>{{ c().fence }}</p>
      }
    </figure>
  `,
})
export class ClaimQuoteComponent {
  readonly key = input.required<string>();
  readonly showFence = input(true);
  protected readonly c = computed(() => claim(this.key()));
  protected readonly url = computed(() => claimUrl(this.key()));
}

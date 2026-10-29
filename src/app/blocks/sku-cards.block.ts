import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SKUS, SKUS_WITH_REPO, sku, type Sku } from '../data/data';
import { StatusBadgeComponent } from './status-badge.component';
import { TextComponent } from './text.component';

export interface SkuCardProps {
  readonly id: string;
  readonly description: string;
}

export interface SkuCardsProps {
  readonly id?: string;
  readonly alt?: boolean;
  /** The sentence every card carries about the licence of its source. */
  readonly licence: string;
  readonly skus: readonly SkuCardProps[];
}

interface CardView extends SkuCardProps {
  readonly sku: Sku;
}

/**
 * One card per SKU whose repository is public, and one line naming the other SKUs of the registry.
 * Name, readiness, family, composed caps and the repository come from the registers; the
 * description is the content's. A card for a SKU whose repository is not public is not rendered.
 */
@Component({
  selector: 'ex-sku-cards',
  imports: [StatusBadgeComponent, TextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section" [class.ex-section--alt]="props().alt" [attr.id]="props().id ?? null">
      <div class="ex-container">
        <div class="ex-grid ex-grid--2">
          @for (c of cards(); track c.id) {
            <article class="ex-card ex-card--edge ex-sku-card" [attr.id]="'sku-' + c.id" style="--ex-tone: var(--ex-flow-blue-text)">
              <div class="ex-sku-card__top">
                <span class="ex-eyebrow">{{ c.sku.family }}</span>
                <span class="ex-sku-card__badges">
                  <ex-status-badge [status]="c.sku.status" />
                  <span class="ex-tag">{{ c.sku.capCount }} caps</span>
                </span>
              </div>
              <h2 class="ex-sku-card__name">{{ c.sku.name }}</h2>
              <p><ex-text [text]="c.description" /></p>
              <p class="ex-sku-card__caps-label ex-eyebrow">Composes</p>
              <ul class="ex-sku-card__caps">
                @for (cap of c.sku.caps; track cap) {
                  <li><code class="ex-inline-code">{{ cap }}</code></li>
                }
              </ul>
              <p class="ex-card__foot ex-sku-card__vis">{{ props().licence }}</p>
              @if (c.sku.repo; as repo) {
                <p class="ex-card__code">
                  <a class="ex-link" [href]="repo.url">{{ repo.url.replace('https://github.com/', '') }}</a>
                  @if (repo.builtAgainst) { · kernel {{ repo.builtAgainst }} }
                </p>
              }
            </article>
          }
        </div>
        @if (planned().length) {
          <p class="ex-sku-planned"><strong>No public repository yet:</strong> {{ planned().join(', ') }}.</p>
        }
      </div>
    </section>
  `,
})
export class SkuCardsComponent {
  readonly props = input.required<SkuCardsProps, unknown>({ transform: (value: unknown) => value as SkuCardsProps });

  protected readonly cards = computed<CardView[]>(() =>
    this.props().skus.filter((c) => SKUS_WITH_REPO.includes(c.id)).map((c) => ({ ...c, sku: sku(c.id) })),
  );

  protected readonly planned = computed(() => SKUS.filter((s) => !SKUS_WITH_REPO.includes(s.id)).map((s) => s.name));
}

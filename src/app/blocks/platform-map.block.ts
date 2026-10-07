import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LAYERS, SKUS } from '../data/data';
import { SectionHeadComponent, type SectionHeadProps } from './section-head.block';
import { TextComponent } from './text.component';

export interface MapTier {
  readonly label: string;
  readonly title: string;
  readonly body: string;
  /** Static items, or the SKU names / layer names from the registers. */
  readonly items: readonly string[] | 'skus' | 'layers';
  readonly arrow?: string;
}

export interface PlatformMapProps {
  readonly id?: string;
  readonly head: SectionHeadProps;
  readonly tiers: readonly MapTier[];
  readonly family?: { readonly title: string; readonly body: string };
  readonly alt?: boolean;
}

@Component({
  selector: 'ex-platform-map',
  imports: [SectionHeadComponent, TextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section" [class.ex-section--alt]="props().alt" [attr.id]="props().id ?? null">
      <div class="ex-container">
        <ex-section-head [props]="props().head" />
        <div class="ex-map">
          <ol class="ex-map__tiers">
            @for (t of props().tiers; track t.label; let last = $last) {
              <li class="ex-map__tier">
                <div class="ex-map__label">
                  <span class="ex-eyebrow">{{ t.label }}</span>
                  <h3>{{ t.title }}</h3>
                  <p><ex-text [text]="t.body" /></p>
                </div>
                <ul class="ex-tags ex-map__items">
                  @for (item of itemsOf(t); track item) {
                    <li class="ex-tag">{{ item }}</li>
                  }
                </ul>
              </li>
              @if (!last && t.arrow) {
                <li class="ex-map__arrow" aria-hidden="true"><span>↓</span> {{ t.arrow }}</li>
              }
            }
          </ol>
          @if (props().family; as f) {
            <aside class="ex-map__family">
              <p class="ex-eyebrow">{{ f.title }}</p>
              <p><ex-text [text]="f.body" /></p>
            </aside>
          }
        </div>
      </div>
    </section>
  `,
})
export class PlatformMapComponent {
  readonly props = input.required<PlatformMapProps>();

  protected itemsOf(t: MapTier): readonly string[] {
    if (t.items === 'skus') return SKUS.map((s) => s.name);
    if (t.items === 'layers') return LAYERS.map((l) => `L${l.n} ${l.name}`);
    return t.items;
  }
}

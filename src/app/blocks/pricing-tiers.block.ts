import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HrefDirective } from '../shell/href.directive';
import { TextComponent } from './text.component';
import { toneVar, type Cta, type Tone } from './types';

export interface PricingTier {
  readonly name: string;
  readonly sub: string;
  readonly price: string;
  readonly cta: Cta;
  readonly points: readonly string[];
  readonly foot: string;
  readonly tone?: Tone;
  readonly featured?: boolean;
}

/** The three tiers, described qualitatively; no tier carries a price figure. */
@Component({
  selector: 'ex-pricing-tiers',
  imports: [HrefDirective, TextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section">
      <div class="ex-container">
        <ul class="ex-joined ex-joined--3 ex-pricing">
          @for (t of props().tiers; track t.name) {
            <li class="ex-pricing__tier" [class.is-featured]="t.featured" [style.--ex-tone]="toneVar(t.tone)">
              <h2 class="ex-pricing__name">{{ t.name }}</h2>
              <p class="ex-pricing__sub ex-mono">{{ t.sub }}</p>
              <p class="ex-pricing__price">{{ t.price }}</p>
              <ul class="ex-points ex-points--check">
                @for (p of t.points; track p) {
                  <li><span><ex-text [text]="p" /></span></li>
                }
              </ul>
              <div class="ex-pricing__foot">
                <a [exHref]="t.cta.href" [class]="t.featured ? 'ex-btn ex-btn--solid ex-btn--lg' : 'ex-btn ex-btn--lg'">{{ t.cta.label }}</a>
                <p class="ex-mono">{{ t.foot }}</p>
              </div>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
})
export class PricingTiersComponent {
  readonly props = input.required<{ readonly tiers: readonly PricingTier[] }>();
  protected readonly toneVar = toneVar;
}

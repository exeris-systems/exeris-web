import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HrefDirective } from '../shell/href.directive';
import { CAP_TOTALS, SKUS, type Licence } from '../data/data';
import { ClaimQuoteComponent } from './claim-quote.component';
import { CodePaneComponent, type CodePaneProps } from './code-pane.block';
import { SectionHeadComponent, type SectionHeadProps } from './section-head.block';
import { TextComponent } from './text.component';

export type BentoExtra =
  | { readonly kind: 'claim'; readonly claim: string }
  | { readonly kind: 'licences' }
  | { readonly kind: 'skus' }
  | ({ readonly kind: 'code' } & CodePaneProps);

export interface BentoCell {
  readonly size?: 'hero' | 'wide' | 'normal';
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly href?: string;
  readonly linkLabel?: string;
  readonly extra?: BentoExtra;
}

export interface BentoProps {
  readonly head: SectionHeadProps;
  readonly cells: readonly BentoCell[];
}

const LICENCES: readonly { key: Licence; label: string }[] = [
  { key: 'community', label: 'community' },
  { key: 'commercial', label: 'commercial' },
  { key: 'enterprise-private', label: 'enterprise-private' },
];

@Component({
  selector: 'ex-bento',
  imports: [HrefDirective, ClaimQuoteComponent, CodePaneComponent, SectionHeadComponent, TextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section ex-section--alt">
      <div class="ex-container">
        <ex-section-head [props]="props().head" />
        <div class="ex-bento">
          @for (cell of props().cells; track cell.title) {
            <article [class]="'ex-bento__cell ex-bento__cell--' + (cell.size ?? 'normal')">
              <p class="ex-eyebrow">{{ cell.eyebrow }}</p>
              <h3><ex-text [text]="cell.title" /></h3>
              <p class="ex-bento__body"><ex-text [text]="cell.body" /></p>
              @switch (cell.extra?.kind) {
                @case ('claim') {
                  <ex-claim-quote [key]="$any(cell.extra).claim" [showFence]="false" />
                }
                @case ('code') {
                  <ex-code-pane [props]="$any(cell.extra)" />
                }
                @case ('licences') {
                  <div class="ex-licbar" role="img" [attr.aria-label]="licenceSummary">
                    @for (l of licences; track l.key) {
                      <span [class]="'ex-licbar__seg ex-lic--' + l.key" [style.flex-grow]="totals[l.key]"></span>
                    }
                  </div>
                  <ul class="ex-licbar__legend">
                    @for (l of licences; track l.key) {
                      <li [class]="'ex-lic--' + l.key"><span class="ex-licbar__dot"></span>{{ totals[l.key] }} {{ l.label }}</li>
                    }
                  </ul>
                }
                @case ('skus') {
                  <ul class="ex-tags">
                    @for (s of skus; track s.id) {
                      <li class="ex-tag">{{ s.name }}</li>
                    }
                  </ul>
                }
              }
              @if (cell.href) {
                <p class="ex-bento__link"><a class="ex-arrow-link" [exHref]="cell.href">{{ cell.linkLabel ?? 'Learn more' }} →</a></p>
              }
            </article>
          }
        </div>
      </div>
    </section>
  `,
})
export class BentoComponent {
  readonly props = input.required<BentoProps>();
  protected readonly licences = LICENCES;
  protected readonly totals = CAP_TOTALS;
  protected readonly skus = SKUS;
  protected readonly licenceSummary = LICENCES.map((l) => `${CAP_TOTALS[l.key]} ${l.label}`).join(', ');
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HrefDirective } from '../shell/href.directive';
import { SectionHeadComponent, type SectionHeadProps } from './section-head.block';
import { TextComponent } from './text.component';

export interface LevelProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly points: readonly string[];
  readonly href: string;
  readonly linkLabel: string;
}

export interface TwoLevelsProps {
  readonly head?: SectionHeadProps;
  readonly left: LevelProps;
  readonly right: LevelProps;
  readonly band: string;
  readonly bandBody?: string;
}

/** The two messaging levels side by side, over the band they both compose from. */
@Component({
  selector: 'ex-two-levels',
  imports: [HrefDirective, SectionHeadComponent, TextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section">
      <div class="ex-container">
        @if (props().head) {
          <ex-section-head [props]="props().head!" />
        }
        <div class="ex-levels">
          @for (level of [props().left, props().right]; track level.title; let i = $index) {
            <article class="ex-card ex-card--edge ex-levels__level" [style.--ex-tone]="i === 0 ? 'var(--ex-flow-blue-text)' : 'var(--ex-flow-cyan)'">
              <p class="ex-eyebrow" [style.color]="i === 0 ? null : 'var(--ex-flow-cyan)'">{{ level.eyebrow }}</p>
              <h3 class="ex-levels__title">{{ level.title }}</h3>
              <p><ex-text [text]="level.body" /></p>
              <ul class="ex-points">
                @for (p of level.points; track p) {
                  <li><span><ex-text [text]="p" /></span></li>
                }
              </ul>
              <p class="ex-card__foot"><a class="ex-arrow-link" [exHref]="level.href">{{ level.linkLabel }} →</a></p>
            </article>
          }
          <div class="ex-levels__band">
            <span class="ex-levels__flow" aria-hidden="true"></span>
            <p class="ex-eyebrow">{{ props().band }}</p>
            @if (props().bandBody) {
              <p class="ex-levels__band-body"><ex-text [text]="props().bandBody!" /></p>
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class TwoLevelsComponent {
  readonly props = input.required<TwoLevelsProps>();
}

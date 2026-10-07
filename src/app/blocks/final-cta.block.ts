import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HrefDirective } from '../shell/href.directive';
import { btnClass, type Cta } from './types';

export interface FinalCtaProps {
  readonly eyebrow?: string;
  readonly title: string;
  readonly body?: string;
  readonly ctas: readonly Cta[];
}

@Component({
  selector: 'ex-final-cta',
  imports: [HrefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section ex-final-cta">
      <div class="ex-atmos" aria-hidden="true"></div>
      <div class="ex-container ex-final-cta__inner">
        @if (props().eyebrow) {
          <p class="ex-eyebrow">{{ props().eyebrow }}</p>
        }
        <h2>{{ props().title }}</h2>
        @if (props().body) {
          <p class="ex-final-cta__body">{{ props().body }}</p>
        }
        <div class="ex-actions">
          @for (cta of props().ctas; track cta.label) {
            <a [exHref]="cta.href" [class]="btnClass(cta)">{{ cta.label }}</a>
          }
        </div>
      </div>
    </section>
  `,
})
export class FinalCtaComponent {
  readonly props = input.required<FinalCtaProps>();
  protected readonly btnClass = btnClass;
}

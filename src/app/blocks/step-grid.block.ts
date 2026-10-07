import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SectionHeadComponent, type SectionHeadProps } from './section-head.block';
import { TextComponent } from './text.component';
import { stepLabel, toneVar, type Tone } from './types';

export interface StepProps {
  readonly title: string;
  readonly body: string;
  readonly code?: string;
  readonly tone?: Tone;
}

export interface StepGridProps {
  readonly id?: string;
  readonly head?: SectionHeadProps;
  readonly columns?: 3 | 4 | 6;
  readonly alt?: boolean;
  readonly steps: readonly StepProps[];
}

/** Numbered steps in a joined grid; the numbers come from the order of the steps. */
@Component({
  selector: 'ex-step-grid',
  imports: [SectionHeadComponent, TextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section" [class.ex-section--alt]="props().alt" [attr.id]="props().id ?? null">
      <div class="ex-container">
        @if (props().head) {
          <ex-section-head [props]="props().head!" />
        }
        <ol [class]="'ex-joined ex-steps ex-joined--' + (props().columns ?? 3)">
          @for (step of props().steps; track step.title; let i = $index) {
            <li class="ex-card" [style.--ex-tone]="toneVar(step.tone)">
              <span class="ex-step-num" aria-hidden="true">{{ stepLabel(i) }}</span>
              <h3>{{ step.title }}</h3>
              @if (step.code) {
                <p class="ex-card__code">{{ step.code }}</p>
              }
              <p><ex-text [text]="step.body" /></p>
            </li>
          }
        </ol>
      </div>
    </section>
  `,
})
export class StepGridComponent {
  readonly props = input.required<StepGridProps>();
  protected readonly stepLabel = stepLabel;
  protected readonly toneVar = toneVar;
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CodePaneComponent, type CodePaneProps } from './code-pane.block';
import { SectionHeadComponent, type SectionHeadProps } from './section-head.block';
import { TextComponent } from './text.component';
import { stepLabel } from './types';

export interface CodeStep {
  readonly title: string;
  readonly body: string;
  readonly code?: CodePaneProps;
}

export interface CodeStepsProps {
  readonly id?: string;
  readonly head?: SectionHeadProps;
  readonly alt?: boolean;
  readonly steps: readonly CodeStep[];
}

/** Numbered steps, each with the command or file the step runs or edits beside it. */
@Component({
  selector: 'ex-code-steps',
  imports: [CodePaneComponent, SectionHeadComponent, TextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section" [class.ex-section--alt]="props().alt" [attr.id]="props().id ?? null">
      <div class="ex-container">
        @if (props().head) {
          <ex-section-head [props]="props().head!" />
        }
        <ol class="ex-codesteps">
          @for (step of props().steps; track step.title; let i = $index) {
            <li class="ex-codesteps__step">
              <div class="ex-codesteps__text">
                <span class="ex-step-num" aria-hidden="true">{{ stepLabel(i) }}</span>
                <h3>{{ step.title }}</h3>
                <p><ex-text [text]="step.body" /></p>
              </div>
              @if (step.code) {
                <ex-code-pane [props]="step.code" />
              }
            </li>
          }
        </ol>
      </div>
    </section>
  `,
})
export class CodeStepsComponent {
  readonly props = input.required<CodeStepsProps, unknown>({ transform: (value: unknown) => value as CodeStepsProps });
  protected readonly stepLabel = stepLabel;
}

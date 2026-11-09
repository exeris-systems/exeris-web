import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TextComponent } from './text.component';

export interface SectionHeadProps {
  readonly eyebrow?: string;
  readonly title: string;
  readonly body?: string;
  readonly center?: boolean;
}

/** Eyebrow, h2 and lede. Used inside other blocks and as a CUSTOM block of its own. */
@Component({
  selector: 'ex-section-head',
  imports: [TextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ex-section-head" [class.ex-section-head--center]="props().center">
      @if (props().eyebrow) {
        <p class="ex-eyebrow">{{ props().eyebrow }}</p>
      }
      <h2><ex-text [text]="props().title" /></h2>
      @if (props().body) {
        <p><ex-text [text]="props().body!" /></p>
      }
    </div>
  `,
})
export class SectionHeadComponent {
  readonly props = input.required<SectionHeadProps>();
}

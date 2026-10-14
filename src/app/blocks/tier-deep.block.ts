import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TextComponent } from './text.component';

export interface TierDeepProps {
  readonly id: string;
  readonly label: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly alt?: boolean;
}

/** One platform tier: a sticky tier label beside its content; the content is the node's children, projected. */
@Component({
  selector: 'ex-tier-deep',
  imports: [TextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section" [class.ex-section--alt]="props().alt" [attr.id]="props().id">
      <div class="ex-container ex-tier">
        <div class="ex-tier__label">
          <p class="ex-tier__num">{{ props().label }}</p>
        </div>
        <div class="ex-tier__body">
          <p class="ex-eyebrow">{{ props().eyebrow }}</p>
          <h2 class="ex-tier__title"><ex-text [text]="props().title" /></h2>
          <p class="ex-tier__lede"><ex-text [text]="props().body" /></p>
          <ng-content />
        </div>
      </div>
    </section>
  `,
})
export class TierDeepComponent {
  readonly props = input.required<TierDeepProps, unknown>({ transform: (value: unknown) => value as TierDeepProps });
}

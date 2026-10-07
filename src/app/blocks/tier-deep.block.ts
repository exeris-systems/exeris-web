import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ViewNodesComponent } from '../view/view-nodes.component';
import type { ComponentNode } from '../view/view-types';
import { TextComponent } from './text.component';

export interface TierDeepProps {
  readonly id: string;
  readonly label: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly alt?: boolean;
}

/** One platform tier: a sticky tier label beside its content; the content is the node's children. */
@Component({
  selector: 'ex-tier-deep',
  imports: [TextComponent, ViewNodesComponent],
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
          <ex-view-nodes [nodes]="children()" />
        </div>
      </div>
    </section>
  `,
})
export class TierDeepComponent {
  readonly props = input.required<TierDeepProps>();
  readonly children = input<readonly ComponentNode[]>([]);
}

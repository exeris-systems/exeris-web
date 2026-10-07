import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { HrefDirective } from '../shell/href.directive';
import { TextComponent } from './text.component';

export interface CalloutProps {
  readonly id?: string;
  readonly variant?: 'info' | 'contract' | 'verdict' | 'warning';
  readonly eyebrow?: string;
  readonly title: string;
  readonly body: string;
  readonly href?: string;
  readonly linkLabel?: string;
  /** Rendered as a section of its own (default) or inline inside a parent block. */
  readonly inline?: boolean;
  readonly alt?: boolean;
}

@Component({
  selector: 'ex-callout',
  imports: [NgTemplateOutlet, HrefDirective, TextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (props().inline) {
      <ng-container [ngTemplateOutlet]="box" />
    } @else {
      <section class="ex-section ex-section--tight" [class.ex-section--alt]="props().alt" [attr.id]="props().id ?? null">
        <div class="ex-container">
          <ng-container [ngTemplateOutlet]="box" />
        </div>
      </section>
    }
    <ng-template #box>
      <aside [class]="'ex-callout ex-callout--' + (props().variant ?? 'info')">
        @if (props().eyebrow) {
          <p class="ex-eyebrow">{{ props().eyebrow }}</p>
        }
        <h3>{{ props().title }}</h3>
        <p><ex-text [text]="props().body" /></p>
        @if (props().href) {
          <p class="ex-callout__link"><a class="ex-arrow-link" [exHref]="props().href!">{{ props().linkLabel ?? 'Read more' }} →</a></p>
        }
      </aside>
    </ng-template>
  `,
})
export class CalloutComponent {
  readonly props = input.required<CalloutProps>();
}

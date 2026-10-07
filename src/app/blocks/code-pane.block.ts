import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { highlight } from './highlight';
import { tagClass, type Badge } from './types';

export interface CodePaneProps {
  readonly title: string;
  readonly lang: string;
  readonly code: string;
  readonly tags?: readonly Badge[];
  /** Accessible label of the scrollable sample. */
  readonly label?: string;
}

@Component({
  selector: 'ex-code-pane',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="ex-code">
      <figcaption class="ex-code__bar">
        <span>{{ props().title }}</span>
        @for (t of props().tags ?? []; track t.label) {
          <span [class]="tagClass(t.tone)">{{ t.label }}</span>
        }
        <span class="ex-code__lang">{{ props().lang }}</span>
      </figcaption>
      <pre tabindex="0" [attr.aria-label]="props().label ?? props().title"><code>@for (line of lines(); track $index) {<span class="ex-code__line">@for (t of line; track $index) {@if (t.cls) {<span [class]="'exeris-code-' + t.cls">{{ t.text }}</span>} @else {<ng-container>{{ t.text }}</ng-container>}}</span>}</code></pre>
    </figure>
  `,
})
export class CodePaneComponent {
  readonly props = input.required<CodePaneProps>();
  protected readonly tagClass = tagClass;
  protected readonly lines = computed(() => highlight(this.props().code, this.props().lang.startsWith('yaml') ? 'yaml' : 'java'));
}

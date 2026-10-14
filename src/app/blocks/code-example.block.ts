import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HrefDirective } from '../shell/href.directive';
import { CodePaneComponent, type CodePaneProps } from './code-pane.block';
import { SectionHeadComponent, type SectionHeadProps } from './section-head.block';
import { TextComponent } from './text.component';
import type { Cta } from './types';

export interface GeneratedGroup {
  readonly title: string;
  readonly items: readonly { readonly name: string; readonly what: string }[];
}

export interface CodeExampleProps {
  readonly id?: string;
  readonly head: SectionHeadProps;
  readonly alt?: boolean;
  readonly code: CodePaneProps;
  readonly generatedTitle: string;
  readonly groups: readonly GeneratedGroup[];
  readonly note?: string;
  readonly cta?: Cta;
}

/** One annotated source file beside the artefacts the build writes from it. */
@Component({
  selector: 'ex-code-example',
  imports: [HrefDirective, CodePaneComponent, SectionHeadComponent, TextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section" [class.ex-section--alt]="props().alt" [attr.id]="props().id ?? null">
      <div class="ex-container">
        <ex-section-head [props]="props().head" />
        <div class="ex-codeexample">
          <ex-code-pane [props]="props().code" />
          <div class="ex-codeexample__out">
            <h3 class="ex-eyebrow">{{ props().generatedTitle }}</h3>
            @for (g of props().groups; track g.title) {
              <section class="ex-codeexample__group">
                <h4>{{ g.title }}</h4>
                <ul class="ex-points">
                  @for (item of g.items; track item.name) {
                    <li>
                      <span><code class="ex-inline-code">{{ item.name }}</code> <ex-text [text]="item.what" /></span>
                    </li>
                  }
                </ul>
              </section>
            }
          </div>
        </div>
        @if (props().note) {
          <p class="ex-codeexample__note"><ex-text [text]="props().note!" /></p>
        }
        @if (props().cta; as cta) {
          <p class="ex-codeexample__cta"><a class="ex-arrow-link" [exHref]="cta.href">{{ cta.label }} →</a></p>
        }
      </div>
    </section>
  `,
})
export class CodeExampleComponent {
  readonly props = input.required<CodeExampleProps, unknown>({ transform: (value: unknown) => value as CodeExampleProps });
}

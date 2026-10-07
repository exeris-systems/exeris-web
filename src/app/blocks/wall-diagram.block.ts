import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CalloutComponent, type CalloutProps } from './callout.block';
import { SectionHeadComponent, type SectionHeadProps } from './section-head.block';
import { toneVar, type Tone } from './types';

export interface WallTier {
  readonly name: string;
  readonly modules: string;
  readonly rule: string;
  readonly tone?: Tone;
}

export interface WallDiagramProps {
  readonly id?: string;
  readonly head: SectionHeadProps;
  readonly tiers: readonly WallTier[];
  readonly wall: string;
  readonly callout?: CalloutProps;
  readonly alt?: boolean;
}

/** The kernel tiers stacked, each with its module and its rule, and the Wall rule beneath them. */
@Component({
  selector: 'ex-wall-diagram',
  imports: [CalloutComponent, SectionHeadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section" [class.ex-section--alt]="props().alt" [attr.id]="props().id ?? null">
      <div class="ex-container">
        <ex-section-head [props]="props().head" />
        <div class="ex-wall">
          <ol class="ex-wall__tiers">
            @for (t of props().tiers; track t.name) {
              <li class="ex-wall__tier" [style.--ex-tone]="toneVar(t.tone)">
                <span class="ex-wall__name">{{ t.name }}</span>
                <span class="ex-wall__modules ex-mono">{{ t.modules }}</span>
                <span class="ex-wall__rule">{{ t.rule }}</span>
              </li>
            }
          </ol>
          <p class="ex-wall__line"><span class="ex-eyebrow">{{ props().wall }}</span></p>
          @if (props().callout) {
            <ex-callout [props]="props().callout!" />
          }
        </div>
      </div>
    </section>
  `,
})
export class WallDiagramComponent {
  readonly props = input.required<WallDiagramProps>();
  protected readonly toneVar = toneVar;
}

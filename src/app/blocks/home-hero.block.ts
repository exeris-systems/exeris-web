import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HrefDirective } from '@exeris-web/shell';
import { fillVersions } from '../data/data';
import { CodePaneComponent, type CodePaneProps } from './code-pane.block';
import { btnClass, type Cta } from './types';

export interface HomeHeroProps {
  readonly pill?: { readonly label: string; readonly text: string; readonly href: string };
  /** The headline as its words; the word named by `accent` carries the Flow gradient. */
  readonly headline: readonly string[];
  readonly accent?: string;
  readonly sub: string;
  readonly sentence?: string;
  /** The command the visitor can run, shown under the sub line. */
  readonly command?: CodePaneProps;
  readonly ctas?: readonly Cta[];
  readonly meta?: readonly string[];
}

@Component({
  selector: 'ex-home-hero',
  imports: [HrefDirective, CodePaneComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="ex-section ex-home-hero">
      <div class="ex-atmos" aria-hidden="true"></div>
      <div class="ex-container ex-home-hero__inner">
        <img class="ex-home-hero__mark" src="/assets/brand/exeris-mark-core-full-dark.svg" alt="" width="192" height="100" />
        @if (props().pill; as pill) {
          <a class="ex-home-hero__pill" [exHref]="pill.href">
            <span class="ex-tag ex-tag--flow">{{ pill.label }}</span>
            <span>{{ pillText() }}</span>
            <span aria-hidden="true">→</span>
          </a>
        }
        <h1 class="ex-home-hero__title">
          @for (word of props().headline; track $index) {
            @if (word === props().accent) {
              <span class="ex-flow-text">{{ word }}</span>
            } @else {
              <span>{{ word }}</span>
            }
            {{ ' ' }}
          }
        </h1>
        <p class="ex-home-hero__sub">{{ props().sub }}</p>
        @if (props().sentence) {
          <p class="ex-home-hero__sentence">{{ props().sentence }}</p>
        }
        @if (props().command; as command) {
          <div class="ex-home-hero__command">
            <ex-code-pane [props]="command" />
          </div>
        }
        @if (props().ctas?.length) {
          <div class="ex-actions ex-home-hero__actions">
            @for (cta of props().ctas; track cta.label) {
              <a [exHref]="cta.href" [class]="btnClass(cta)">{{ cta.label }}</a>
            }
          </div>
        }
        @if (props().meta?.length) {
          <p class="ex-home-hero__meta">{{ props().meta!.join(' · ') }}</p>
        }
      </div>
    </header>
  `,
})
export class HomeHeroComponent {
  readonly props = input.required<HomeHeroProps, unknown>({ transform: (value: unknown) => value as HomeHeroProps });
  protected readonly btnClass = btnClass;
  protected readonly pillText = computed(() => fillVersions(this.props().pill?.text ?? ''));
}

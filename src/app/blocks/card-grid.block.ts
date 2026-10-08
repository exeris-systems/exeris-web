import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { HrefDirective } from '../shell/href.directive';
import { SectionHeadComponent, type SectionHeadProps } from './section-head.block';
import { TextComponent } from './text.component';
import { tagClass, toneVar, type Badge, type Tone } from './types';

export interface CardProps {
  readonly eyebrow?: string;
  readonly title: string;
  readonly code?: string;
  readonly body?: string;
  readonly points?: readonly string[];
  readonly tags?: readonly Badge[];
  readonly foot?: string;
  readonly href?: string;
  readonly linkLabel?: string;
  readonly tone?: Tone;
}

export interface CardGridProps {
  readonly id?: string;
  readonly head?: SectionHeadProps;
  readonly columns?: 2 | 3 | 4;
  readonly joined?: boolean;
  readonly alt?: boolean;
  /** Where the tone shows: a top edge (default) or a left edge. */
  readonly edge?: 'top' | 'side';
  readonly check?: boolean;
  readonly cards: readonly CardProps[];
}

/** A section of cards: optional section head, then a grid of cards that may link. */
@Component({
  selector: 'ex-card-grid',
  imports: [NgTemplateOutlet, HrefDirective, SectionHeadComponent, TextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section" [class.ex-section--alt]="props().alt" [attr.id]="props().id ?? null">
      <div class="ex-container">
        @if (props().head) {
          <ex-section-head [props]="props().head!" />
        }
        <div [class]="gridClass()">
          @for (card of props().cards; track card.title) {
            @if (card.href && !card.linkLabel) {
              <a [exHref]="card.href" [class]="cardClass(card)" [style.--ex-tone]="toneVar(card.tone)">
                <ng-container *ngTemplateOutlet="body; context: { $implicit: card }" />
              </a>
            } @else {
              <article [class]="cardClass(card)" [style.--ex-tone]="toneVar(card.tone)">
                <ng-container *ngTemplateOutlet="body; context: { $implicit: card }" />
              </article>
            }
          }
        </div>
      </div>
    </section>
    <ng-template #body let-card>
      @if (card.eyebrow) {
        <p class="ex-eyebrow" [style.color]="toneVar(card.tone)">{{ card.eyebrow }}</p>
      }
      <h3>{{ card.title }}</h3>
      @if (card.code) {
        <p class="ex-card__code">{{ card.code }}</p>
      }
      @if (card.tags?.length) {
        <ul class="ex-tags">
          @for (t of card.tags; track t.label) {
            <li [class]="tagClass(t.tone)">{{ t.label }}</li>
          }
        </ul>
      }
      @if (card.body) {
        <p><ex-text [text]="card.body" /></p>
      }
      @if (card.points?.length) {
        <ul class="ex-points" [class.ex-points--check]="props().check">
          @for (p of card.points; track p) {
            <li><span><ex-text [text]="p" /></span></li>
          }
        </ul>
      }
      @if (card.foot) {
        <p class="ex-card__foot">{{ card.foot }}</p>
      }
      @if (card.href && card.linkLabel) {
        <p class="ex-card__foot"><a class="ex-arrow-link" [exHref]="card.href">{{ card.linkLabel }} →</a></p>
      } @else if (card.href) {
        <p class="ex-card__foot ex-card__arrow" aria-hidden="true">→</p>
      }
    </ng-template>
  `,
})
export class CardGridComponent {
  readonly props = input.required<CardGridProps>();
  protected readonly tagClass = tagClass;
  protected readonly toneVar = toneVar;

  protected gridClass(): string {
    const n = this.props().columns ?? 3;
    return this.props().joined ? `ex-joined ex-joined--${n}` : `ex-grid ex-grid--${n}`;
  }

  protected cardClass(card: CardProps): string {
    const edge = card.tone ? (this.props().edge === 'side' ? ' ex-card--side' : ' ex-card--edge') : '';
    return `ex-card${edge}`;
  }
}

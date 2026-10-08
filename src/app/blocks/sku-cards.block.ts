import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { HrefDirective } from '../shell/href.directive';
import { sku, type Sku } from '../data/data';
import { SectionHeadComponent, type SectionHeadProps } from './section-head.block';
import { TextComponent } from './text.component';

export interface SkuCardProps {
  readonly id: string;
  readonly description: string;
  readonly href?: string;
  readonly enterprise?: string;
}

export interface SkuGroupProps {
  readonly id?: string;
  readonly title: string;
  readonly description: string;
  readonly skus?: readonly SkuCardProps[];
  /** A group entry that is not a SKU, such as a domain-primitive cap. */
  readonly notes?: readonly { readonly title: string; readonly code: string; readonly description: string; readonly href?: string }[];
}

export interface SkuCardsProps {
  readonly id?: string;
  readonly head?: SectionHeadProps;
  readonly alt?: boolean;
  readonly columns?: 2 | 3 | 4;
  readonly skus?: readonly SkuCardProps[];
  readonly groups?: readonly SkuGroupProps[];
}

interface CardView extends SkuCardProps {
  readonly sku: Sku;
}

/**
 * SKU cards from skus.json: name, repository coordinate, cap count and source visibility come
 * from the HLA tables; the description is the content's.
 */
@Component({
  selector: 'ex-sku-cards',
  imports: [NgTemplateOutlet, HrefDirective, SectionHeadComponent, TextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section" [class.ex-section--alt]="props().alt" [attr.id]="props().id ?? null">
      <div class="ex-container">
        @if (props().head) {
          <ex-section-head [props]="props().head!" />
        }
        @if (flat().length) {
          <div [class]="'ex-grid ex-grid--' + (props().columns ?? 4)">
            @for (c of flat(); track c.id) {
              <ng-container *ngTemplateOutlet="card; context: { $implicit: c, level: 3 }" />
            }
          </div>
        }
        @for (g of groups(); track g.title) {
          <div class="ex-sku-group" [attr.id]="g.id ?? null">
            <div class="ex-sku-group__head">
              <h3>{{ g.title }}</h3>
              <p>{{ g.description }}</p>
            </div>
            <div class="ex-grid ex-grid--3">
              @for (c of g.cards; track c.id) {
                <ng-container *ngTemplateOutlet="card; context: { $implicit: c, level: 4 }" />
              }
              @for (n of g.notes ?? []; track n.title) {
                <article class="ex-card ex-card--edge" style="--ex-tone: var(--ex-fg-4)">
                  <h4 class="ex-sku-card__name">{{ n.title }}</h4>
                  <p class="ex-card__code">{{ n.code }}</p>
                  <p><ex-text [text]="n.description" /></p>
                  @if (n.href) {
                    <p class="ex-card__foot"><a class="ex-arrow-link" [exHref]="n.href">Capabilities →</a></p>
                  }
                </article>
              }
            </div>
          </div>
        }
      </div>
    </section>
    <ng-template #card let-c let-level="level">
      <article class="ex-card ex-card--edge ex-sku-card" [attr.id]="'sku-' + c.id" [style.--ex-tone]="c.sku.closedSource ? 'var(--ex-fg-2)' : 'var(--ex-flow-blue-text)'">
        <div class="ex-sku-card__top">
          <span class="ex-eyebrow">{{ c.sku.family }}</span>
          <span class="ex-tag">{{ c.sku.capCount }} caps</span>
        </div>
        @if (level === 3) {
          <h3 class="ex-sku-card__name"><ng-container *ngTemplateOutlet="name; context: { $implicit: c }" /></h3>
        } @else {
          <h4 class="ex-sku-card__name"><ng-container *ngTemplateOutlet="name; context: { $implicit: c }" /></h4>
        }
        <p class="ex-card__code">{{ c.sku.repo }}</p>
        <p><ex-text [text]="c.description" /></p>
        @if (c.enterprise) {
          <p class="ex-sku-card__ent"><span class="ex-eyebrow">Enterprise</span> {{ c.enterprise }}</p>
        }
        <p class="ex-card__foot ex-sku-card__vis">
          @if (c.sku.closedSource) {
            <span class="ex-tag">Closed-source</span>
          } @else {
            <span class="ex-tag ex-tag--flow">Source-available</span>
          }
          @if (c.href) {
            <a class="ex-arrow-link" [exHref]="c.href" [attr.aria-label]="c.sku.name + ' details'">Details →</a>
          }
        </p>
      </article>
    </ng-template>
    <ng-template #name let-c>
      @if (c.href) {
        <a [exHref]="c.href">{{ c.sku.name }}</a>
      } @else {
        <ng-container>{{ c.sku.name }}</ng-container>
      }
    </ng-template>
  `,
})
export class SkuCardsComponent {
  readonly props = input.required<SkuCardsProps>();

  protected readonly flat = computed<CardView[]>(() => (this.props().skus ?? []).map((c) => ({ ...c, sku: sku(c.id) })));

  protected readonly groups = computed(() =>
    (this.props().groups ?? []).map((g) => ({ ...g, cards: (g.skus ?? []).map((c) => ({ ...c, sku: sku(c.id) })) })),
  );
}

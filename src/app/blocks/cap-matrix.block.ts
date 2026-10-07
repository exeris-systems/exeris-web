import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { HrefDirective } from '../shell/href.directive';
import { CAPS, CAP_TOTALS, LAYERS, skusUsingCap, type Licence } from '../data/data';
import { TextComponent } from './text.component';

export interface LicenceTerm {
  readonly licence: Licence;
  readonly terms: string;
  readonly production: string;
}

export interface CapMatrixProps {
  readonly legendTitle: string;
  readonly legend: readonly LicenceTerm[];
  readonly statusNote: string;
}

const LICENCE_FILTERS: readonly (Licence | 'all')[] = ['all', 'community', 'commercial', 'enterprise-private'];

/** SKUs that have a detail page; other SKUs link to their card on the index. */
const SKU_PAGES = new Set(['api-gateway', 'idp', 'bot-blocker']);

/**
 * The capability matrix, generated from cap-license-registry.md: a filter bar (layer, licence,
 * match count) over one card per cap, with the SKUs that compose it from HLA §3.3.
 */
@Component({
  selector: 'ex-cap-matrix',
  imports: [HrefDirective, TextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section ex-capmatrix" id="matrix">
      <div class="ex-container">
        <div class="ex-capmatrix__legend">
          <h2 class="ex-capmatrix__legend-title">{{ props().legendTitle }}</h2>
          <ul class="ex-joined ex-joined--3">
            @for (l of props().legend; track l.licence) {
              <li [class]="'ex-card ex-card--edge ex-lic--' + l.licence">
                <p class="ex-capmatrix__count"><span class="ex-mono">{{ totals[l.licence] }}</span> {{ l.licence }}</p>
                <p><ex-text [text]="l.terms" /></p>
                <p class="ex-card__foot">{{ l.production }}</p>
              </li>
            }
          </ul>
          <p class="ex-fence"><ex-text [text]="props().statusNote" /></p>
        </div>

        <div class="ex-capmatrix__bar" role="group" aria-label="Filter capabilities">
          <div class="ex-capmatrix__filters">
            <span class="ex-capmatrix__label" id="f-layer">Layer</span>
            <div class="ex-seg" role="group" aria-labelledby="f-layer">
              <button type="button" [attr.aria-pressed]="layer() === 0" (click)="layer.set(0)">All</button>
              @for (l of layers; track l.n) {
                <button type="button" [attr.aria-pressed]="layer() === l.n" (click)="layer.set(l.n)" [attr.title]="l.name">L{{ l.n }}</button>
              }
            </div>
          </div>
          <div class="ex-capmatrix__filters">
            <span class="ex-capmatrix__label" id="f-licence">Licence</span>
            <div class="ex-seg" role="group" aria-labelledby="f-licence">
              @for (f of licenceFilters; track f) {
                <button type="button" [attr.aria-pressed]="licence() === f" (click)="licence.set(f)">{{ f === 'all' ? 'All' : f }}</button>
              }
            </div>
          </div>
          <p class="ex-capmatrix__n ex-mono" aria-live="polite">{{ visible().length }} of {{ total }}</p>
        </div>

        <ul class="ex-grid ex-grid--3 ex-capmatrix__grid">
          @for (c of visible(); track c.name) {
            <li [class]="'ex-card ex-capcard ex-lic--' + c.licence" [attr.id]="'cap-' + c.short">
              <p class="ex-capcard__meta">
                <span class="ex-mono">L{{ c.layer }} · {{ c.layerName }}</span>
                <span class="ex-capcard__lic"><span class="ex-capchip__dot" aria-hidden="true"></span>{{ c.licence }}</span>
              </p>
              <h3 class="ex-mono ex-capcard__name">{{ c.short }}</h3>
              <p class="ex-card__code">
                @if (c.status === 'specified') {
                  {{ c.name }} · specified
                } @else {
                  <a class="ex-link" [href]="'https://github.com/exeris-systems/' + c.name">{{ c.name }}</a> · {{ c.status }}
                }
              </p>
              @if (c.usedBy.length) {
                <ul class="ex-tags" [attr.aria-label]="'Composed by'">
                  @for (s of c.usedBy; track s.id) {
                    <li><a class="ex-tag ex-tag--flow" [exHref]="skuHref(s.id)">{{ s.name }}</a></li>
                  }
                </ul>
              } @else {
                <p class="ex-card__foot">Not composed by a first-party SKU</p>
              }
            </li>
          }
        </ul>
      </div>
    </section>
  `,
})
export class CapMatrixComponent {
  readonly props = input.required<CapMatrixProps>();
  protected readonly layers = LAYERS;
  protected readonly totals = CAP_TOTALS;
  protected readonly total = CAPS.length;
  protected readonly licenceFilters = LICENCE_FILTERS;
  protected readonly layer = signal(0);
  protected readonly licence = signal<Licence | 'all'>('all');

  private readonly all = CAPS.map((c) => ({ ...c, usedBy: skusUsingCap(c.short) }));

  protected readonly visible = computed(() =>
    this.all.filter(
      (c) => (this.layer() === 0 || c.layer === this.layer()) && (this.licence() === 'all' || c.licence === this.licence()),
    ),
  );

  protected skuHref(id: string): string {
    return SKU_PAGES.has(id) ? `/skus/${id}` : `/skus#sku-${id}`;
  }
}

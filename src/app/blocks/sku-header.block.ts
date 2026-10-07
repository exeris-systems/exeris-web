import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LINKS } from '../../content/site';
import { HrefDirective } from '../shell/href.directive';
import { capByShort, sku } from '../data/data';
import { TextComponent } from './text.component';
import { btnClass, tagClass, type Badge, type Cta } from './types';

export interface SkuHeaderProps {
  readonly sku: string;
  readonly hero: string;
  readonly badges?: readonly Badge[];
  readonly ctas?: readonly Cta[];
}

/** The SKU detail hero. Family, repository, cap count and licence mix come from the registers. */
@Component({
  selector: 'ex-sku-header',
  imports: [HrefDirective, TextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="ex-section ex-section--alt ex-page-header">
      <div class="ex-atmos" aria-hidden="true"></div>
      <div class="ex-container ex-page-header__grid has-aside">
        <div>
          <nav aria-label="Breadcrumb">
            <ol class="ex-crumbs">
              <li><a exHref="/platform">Platform</a></li>
              <li><a exHref="/skus">SKUs</a></li>
              <li><a [exHref]="'/skus#' + familyAnchor()">{{ s().family }}</a></li>
              <li><span aria-current="page">{{ s().name }}</span></li>
            </ol>
          </nav>
          <ul class="ex-tags ex-page-header__badges">
            <li class="ex-tag ex-tag--flow">{{ s().family }} family</li>
            @if (s().closedSource) {
              <li class="ex-tag ex-tag--err">Closed-source</li>
            } @else {
              <li class="ex-tag ex-tag--cyan">Source-available</li>
            }
            <li class="ex-tag">{{ s().capCount }} caps</li>
            @for (b of props().badges ?? []; track b.label) {
              <li [class]="tagClass(b.tone)">{{ b.label }}</li>
            }
          </ul>
          <h1 class="ex-page-header__title">{{ s().name }}</h1>
          <p class="ex-sku-header__code ex-mono">{{ s().repo }}</p>
          <p class="ex-page-header__lede"><ex-text [text]="props().hero" /></p>
          @if (props().ctas?.length) {
            <div class="ex-actions ex-page-header__actions">
              @for (cta of props().ctas; track cta.label) {
                <a [exHref]="cta.href" [class]="btnClass(cta)">{{ cta.label }}</a>
              }
            </div>
          }
        </div>
        <dl class="ex-defs">
          <div class="exeris-def"><dt>Family</dt><dd>{{ s().family }}</dd></div>
          <div class="exeris-def"><dt>Repository</dt><dd>{{ s().repo }}</dd></div>
          <div class="exeris-def"><dt>Composition</dt><dd>commercial licence</dd></div>
          <div class="exeris-def"><dt>Source</dt><dd>{{ s().closedSource ? 'closed-source (private repository)' : 'source-available (public repository)' }}</dd></div>
          <div class="exeris-def"><dt>Caps</dt><dd>{{ mix() }}</dd></div>
          <div class="exeris-def"><dt>Defined in</dt><dd><a class="ex-link" [href]="hla">HLA §3.3</a></dd></div>
        </dl>
      </div>
    </header>
  `,
})
export class SkuHeaderComponent {
  readonly props = input.required<SkuHeaderProps>();
  protected readonly tagClass = tagClass;
  protected readonly btnClass = btnClass;
  protected readonly hla = LINKS.hla;
  protected readonly s = computed(() => sku(this.props().sku));
  protected readonly familyAnchor = computed(() => this.s().family.toLowerCase().replace(/\s+/g, '-'));

  /** The composition's caps counted by licence, from the cap registry. */
  protected readonly mix = computed(() => {
    const counts = new Map<string, number>();
    for (const short of this.s().caps) {
      const licence = capByShort(short)?.licence ?? 'unknown';
      counts.set(licence, (counts.get(licence) ?? 0) + 1);
    }
    const parts = [...counts.entries()].map(([l, n]) => `${n} ${l}`);
    if (this.s().skuSpecificCaps.length) parts.push(`${this.s().skuSpecificCaps.length} SKU-specific`);
    return parts.join(' · ');
  });
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LAYERS, capByShort, sku } from '../data/data';
import { CodePaneComponent } from './code-pane.block';
import { SectionHeadComponent, type SectionHeadProps } from './section-head.block';

export interface SkuCompositionProps {
  readonly sku: string;
  readonly head: SectionHeadProps;
  readonly alt?: boolean;
}

/**
 * The SKU's composition from HLA §3.3, grouped by the cap registry's layers, beside the same list
 * written as a manifest. Nothing in the manifest is invented: no version pins or signature are
 * shown because no SKU manifest has been published.
 */
@Component({
  selector: 'ex-sku-composition',
  imports: [CodePaneComponent, SectionHeadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section" [class.ex-section--alt]="props().alt">
      <div class="ex-container">
        <ex-section-head [props]="props().head" />
        <div class="ex-composition">
          <div class="ex-composition__graph">
            <p class="ex-eyebrow">Composition · {{ s().name }}</p>
            <ol class="ex-composition__layers">
              @for (layer of layers(); track layer.n) {
                <li>
                  <span class="ex-composition__layer">L{{ layer.n }} · {{ layer.name }}</span>
                  <ul class="ex-composition__caps">
                    @for (c of layer.caps; track c.short) {
                      <li [class]="'ex-capchip ex-lic--' + c.licence" [title]="c.licence">
                        <span class="ex-capchip__dot" aria-hidden="true"></span>{{ c.short }}<span class="ex-sr"> ({{ c.licence }})</span>
                      </li>
                    }
                  </ul>
                </li>
              }
              @for (extra of s().skuSpecificCaps; track extra) {
                <li>
                  <span class="ex-composition__layer">SKU-specific</span>
                  <ul class="ex-composition__caps"><li class="ex-capchip">{{ extra }}</li></ul>
                </li>
              }
            </ol>
            <ul class="ex-composition__legend" aria-label="Licence key">
              <li class="ex-lic--community"><span class="ex-capchip__dot"></span>community</li>
              <li class="ex-lic--commercial"><span class="ex-capchip__dot"></span>commercial</li>
              <li class="ex-lic--enterprise-private"><span class="ex-capchip__dot"></span>enterprise-private</li>
            </ul>
          </div>
          <ex-code-pane [props]="{ title: s().repo + ' · composition', lang: 'yaml', code: manifest(), label: s().name + ' composition as a manifest' }" />
        </div>
      </div>
    </section>
  `,
})
export class SkuCompositionComponent {
  readonly props = input.required<SkuCompositionProps>();
  protected readonly s = computed(() => sku(this.props().sku));

  protected readonly layers = computed(() => {
    const caps = this.s().caps.map((short) => {
      const cap = capByShort(short);
      if (!cap) throw new Error(`SKU ${this.s().id}: cap ${short} is not in the registry`);
      return cap;
    });
    return LAYERS.map((l) => ({ ...l, caps: caps.filter((c) => c.layer === l.n) })).filter((l) => l.caps.length);
  });

  protected readonly manifest = computed(() => {
    const s = this.s();
    const lines = [
      `sku: ${s.id}`,
      `family: ${s.family.toLowerCase().replace(/\s+/g, '-')}`,
      'licence: commercial',
      `source: ${s.closedSource ? 'closed' : 'source-available'}`,
      '',
      'caps:',
    ];
    for (const layer of this.layers()) {
      lines.push(`  # Layer ${layer.n} — ${layer.name}`);
      for (const c of layer.caps) lines.push(`  - ${c.short}${c.licence === 'commercial' ? '' : `  # ${c.licence}`}`);
    }
    for (const extra of s.skuSpecificCaps) lines.push(`  - ${extra.replace(/\s*\(SKU-specific\)/, '')}  # SKU-specific`);
    lines.push('', 'substrate:', '  kernel: community or enterprise driver', '  jdk: Java 25 LTS or newer');
    if (s.note) lines.push(`  # ${s.note}`);
    return lines.join('\n');
  });
}

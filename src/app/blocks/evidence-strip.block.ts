import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HrefDirective } from '../shell/href.directive';
import { claim } from '../data/data';
import { claimUrl } from './claim-quote.component';
import { SectionHeadComponent, type SectionHeadProps } from './section-head.block';
import { btnClass, type Cta } from './types';

export interface EvidenceCell {
  readonly label: string;
  /** Claim key in claims.json. */
  readonly claim: string;
  /** The figure shown large: a verbatim substring of the claim's copy. */
  readonly excerpt: string;
}

export interface EvidenceStripProps {
  readonly head: SectionHeadProps;
  readonly cells: readonly EvidenceCell[];
  readonly cta?: Cta;
}

/**
 * Registered absolute figures. Each cell shows an excerpt of a claim's copy in Evidence Orange,
 * the whole copy beneath it, and links to the claim and its report. An excerpt that is not part
 * of the registered copy stops the build.
 */
@Component({
  selector: 'ex-evidence-strip',
  imports: [HrefDirective, SectionHeadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section">
      <div class="ex-container">
        <ex-section-head [props]="props().head" />
        <ul class="ex-joined ex-joined--4 ex-evidence">
          @for (cell of cells(); track cell.claim + cell.excerpt) {
            <li class="ex-kpi">
              <span class="ex-kpi__label">{{ cell.label }}</span>
              <span class="ex-kpi__value ex-kpi__value--evidence">{{ cell.excerpt }}</span>
              <span class="ex-kpi__sub">{{ cell.copy }}</span>
              <span class="ex-kpi__src">
                <a class="ex-claim-id" [href]="cell.url">{{ cell.id }}</a>
                @if (cell.source) {
                  <a class="ex-arrow-link" [href]="cell.source.url">source →</a>
                }
              </span>
            </li>
          }
        </ul>
        @if (props().cta; as cta) {
          <div class="ex-actions ex-evidence__cta">
            <a [exHref]="cta.href" [class]="btnClass(cta)">{{ cta.label }}</a>
          </div>
        }
      </div>
    </section>
  `,
})
export class EvidenceStripComponent {
  readonly props = input.required<EvidenceStripProps>();
  protected readonly btnClass = btnClass;

  protected readonly cells = computed(() =>
    this.props().cells.map((cell) => {
      const c = claim(cell.claim);
      if (!c.copy.includes(cell.excerpt)) {
        throw new Error(`excerpt "${cell.excerpt}" is not part of the registered copy of ${cell.claim}`);
      }
      return {
        ...cell,
        id: `${c.id} · ${c.variant}`,
        copy: c.copy,
        url: claimUrl(cell.claim),
        source: c.sources[0] ?? null,
      };
    }),
  );
}

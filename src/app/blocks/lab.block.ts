import { ChangeDetectionStrategy, Component, ElementRef, PLATFORM_ID, afterNextRender, computed, inject, input, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LINKS } from '../../content/site';
import {
  BUILD_META,
  CLAIMS,
  CLAIMS_SOURCE,
  COLD_START,
  NEVER_QUOTE_ALONE,
  SAGA_V2,
  WITHDRAWN,
  claim,
  upstreamUrl,
} from '../data/data';
import { BarChartComponent, type BarRow } from './bar-chart.component';
import { megabytes, micros, pairsIn, seconds } from './claim-numbers';
import { ClaimQuoteComponent } from './claim-quote.component';
import { TextComponent } from './text.component';

export interface LabTab {
  readonly id: 'cold-start' | 'cpu' | 'memory' | 'spring' | 'sagas' | 'method';
  readonly label: string;
  readonly title: string;
  readonly intro: string;
  /** Claim keys quoted in the tab, in order. */
  readonly claims?: readonly string[];
  /** Notes printed under the tab's charts, verbatim. */
  readonly notes?: readonly string[];
  /** Labels of the arms or rows a chart or table names. */
  readonly labels?: Readonly<Record<string, string>>;
  readonly points?: readonly string[];
}

export interface LabProps {
  readonly tabs: readonly LabTab[];
}

/**
 * The benchmark laboratory: one tab per evidence category, every figure either a registered
 * claim string, a chart drawn from the numbers inside such a string, a median read from the
 * campaign's result.json, or a CITABLE row of the evidence bundle. Tabs follow the WAI-ARIA tabs
 * pattern; all panels are in the prerendered HTML and the URL fragment selects one.
 */
@Component({
  selector: 'ex-lab',
  imports: [BarChartComponent, ClaimQuoteComponent, TextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-lab">
      <div class="ex-lab__meta">
        <div class="ex-container ex-lab__meta-row ex-mono">
          <span><span class="ex-led ex-led--flow" aria-hidden="true"></span> claims register · exeris-benchmarks&#64;<a [href]="registerUrl">{{ registerSha }}</a></span>
          <span>{{ quotable }} registered strings</span>
          <span>{{ withdrawn }} withdrawn</span>
          <span>kernel <a [href]="kernel.url">{{ kernel.tag }}</a></span>
        </div>
      </div>
      <div class="ex-container">
        <div class="ex-lab__tabs" role="tablist" aria-label="Evidence categories">
          @for (t of props().tabs; track t.id; let i = $index) {
            <button
              type="button"
              role="tab"
              [id]="'tab-' + t.id"
              [attr.aria-controls]="'panel-' + t.id"
              [attr.aria-selected]="active() === t.id"
              [attr.tabindex]="active() === t.id ? 0 : -1"
              (click)="select(t.id)"
              (keydown)="onTabKey($event)"
            >{{ t.label }}</button>
          }
        </div>

        @for (t of props().tabs; track t.id) {
          <div class="ex-lab__panel" role="tabpanel" [id]="'panel-' + t.id" [attr.aria-labelledby]="'tab-' + t.id" [hidden]="active() !== t.id" tabindex="0">
            <h2 class="ex-lab__title">{{ t.title }}</h2>
            <p class="ex-lab__intro"><ex-text [text]="t.intro" /></p>

            @switch (t.id) {
              @case ('cold-start') {
                <div class="ex-lab__charts">
                  <ex-bar-chart [rows]="coldSpawn()" unit="Spawn to first response" caption="Process spawn to first served request · median of each arm's cold launches" />
                  <ex-bar-chart [rows]="coldRss()" unit="Peak RSS" caption="Peak RSS up to the first request · median of each arm's cold launches" />
                </div>
                <p class="ex-fence"><strong>Run</strong>{{ coldMeta() }} · <a class="ex-link" [href]="coldSourceUrl">result.json</a></p>
              }
              @case ('cpu') {
                <ex-bar-chart [rows]="cpuRows(t)" unit="CPU per request" caption="CPU per request on a single-row read · from the registered L12 comparison" />
              }
              @case ('memory') {
                <ex-bar-chart [rows]="tlsRows(t)" unit="CPU per request" caption="CPU per request, TLS off and on · from the registered L13 TLS-tax string" />
              }
              @case ('spring') {
                <ex-bar-chart [rows]="springRows(t)" unit="CPU per request" caption="CPU per request, same contract, same box · from the registered L1 string" />
              }
              @case ('sagas') {
                <div class="ex-table-wrap">
                  <table class="ex-table">
                    <caption class="ex-sr">Contract-v2 saga rows marked CITABLE in the evidence bundle</caption>
                    <thead><tr><th scope="col">Figure</th><th scope="col">Value</th><th scope="col">Artifact</th><th scope="col">State</th></tr></thead>
                    <tbody>
                      @for (r of sagaRows; track r.figure) {
                        <tr>
                          <th scope="row">{{ t.labels?.[r.figure] ?? r.figure }}</th>
                          <td class="ex-num">{{ r.value }}</td>
                          <td class="ex-mono ex-lab__artifact">{{ r.artifact }}</td>
                          <td><span class="ex-tag">{{ r.state }}</span></td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
                <p class="ex-fence"><strong>Fence</strong>{{ sagaFence }} · <a class="ex-link" [href]="sagaSourceUrl">evidence bundle</a></p>
                @if (sagaScope) {
                  <p class="ex-fence"><strong>Scope</strong>{{ sagaScope }}</p>
                }
              }
              @case ('method') {
                <div class="ex-lab__method">
                  <ul class="ex-points">
                    @for (p of t.points ?? []; track p) {
                      <li><span><ex-text [text]="p" /></span></li>
                    }
                  </ul>
                  <div class="ex-lab__rules">
                    <h3>Never quote alone</h3>
                    <p class="ex-fence">The register's own rules, copied from CLAIMS.md:</p>
                    <ul class="ex-lab__rule-list">
                      @for (rule of neverQuoteAlone; track rule) {
                        <li>{{ rule }}</li>
                      }
                    </ul>
                    <p class="ex-actions">
                      <a class="ex-btn" [href]="links.claims">Claims register</a>
                      <a class="ex-btn" [href]="links.methodology">Methodology</a>
                      <a class="ex-btn" [href]="links.hardwareProfiles">Hardware profiles</a>
                    </p>
                  </div>
                </div>
              }
            }

            @for (note of t.notes ?? []; track note) {
              <p class="ex-lab__note">{{ note }}</p>
            }
            @if (t.claims?.length) {
              <div class="ex-lab__claims">
                @for (key of t.claims; track key) {
                  <ex-claim-quote [key]="key" />
                }
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class LabComponent {
  readonly props = input.required<LabProps>();

  protected readonly active = signal<LabTab['id']>('cold-start');
  protected readonly links = LINKS;
  protected readonly kernel = BUILD_META.kernel;
  protected readonly registerSha = CLAIMS_SOURCE.commit.slice(0, 7);
  protected readonly registerUrl = upstreamUrl(CLAIMS_SOURCE);
  protected readonly quotable = Object.values(CLAIMS).filter((c) => c.quotable).length;
  protected readonly withdrawn = WITHDRAWN.length;
  protected readonly neverQuoteAlone = NEVER_QUOTE_ALONE;
  protected readonly sagaRows = SAGA_V2.rows;
  protected readonly sagaScope = SAGA_V2.scopeSentence;
  protected readonly sagaFence = [SAGA_V2.front['claim_scope'], SAGA_V2.front['hardware_profile'], SAGA_V2.front['comparison_axis']]
    .filter(Boolean)
    .join(' · ');
  protected readonly sagaSourceUrl = upstreamUrl(SAGA_V2.source);
  protected readonly coldSourceUrl = upstreamUrl(COLD_START.source, COLD_START.arms[0].path);

  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    afterNextRender(() => {
      const id = window.location.hash.slice(1);
      if (this.props().tabs.some((t) => t.id === id)) this.active.set(id as LabTab['id']);
    });
  }

  /** The cold-start arms in the L14 comparison string's order; the Exeris arm is the measured one. */
  protected readonly coldSpawn = computed<BarRow[]>(() =>
    COLD_START.arms.map((a) => ({
      label: a.label,
      sub: a.qualifier,
      value: a.spawnToFirstRequestMs,
      display: seconds(a.spawnToFirstRequestMs),
      evidence: a.exeris,
    })),
  );

  protected readonly coldRss = computed<BarRow[]>(() =>
    COLD_START.arms.map((a) => ({ label: a.label, sub: a.qualifier, value: a.peakRssMb, display: megabytes(a.peakRssMb), evidence: a.exeris })),
  );

  protected readonly coldMeta = computed(() => {
    const a = COLD_START.arms[0];
    const env = a.env;
    return [
      COLD_START.run,
      `n=${a.n} per arm`,
      a.claimScope,
      a.transport,
      env?.hardwareProfile,
      env?.cpu,
      env?.jdkMajor ? `JDK ${env.jdkMajor}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
  });

  protected cpuRows(t: LabTab): BarRow[] {
    const [[exeris, tuned], [, hibernate]] = pairsIn(claim('L12.comparison').copy, 'vs');
    const l = t.labels ?? {};
    return [
      { label: l['exeris'] ?? 'Exeris Community', value: exeris, display: micros(exeris), evidence: true },
      { label: l['tuned'] ?? 'Quarkus, hand-tuned JDBC', sub: l['mode'], value: tuned, display: micros(tuned) },
      { label: l['hibernate'] ?? 'Quarkus + Hibernate', sub: l['mode'], value: hibernate, display: micros(hibernate) },
    ];
  }

  protected tlsRows(t: LabTab): BarRow[] {
    const [[exOff, exOn], [qOff, qOn]] = pairsIn(claim('L13.tls-tax').copy, '→');
    const l = t.labels ?? {};
    return [
      { label: l['exeris'] ?? 'Exeris Community', sub: l['off'], value: exOff, display: micros(exOff), evidence: true },
      { label: l['exeris'] ?? 'Exeris Community', sub: l['on'], value: exOn, display: micros(exOn), evidence: true },
      { label: l['quarkus'] ?? 'Quarkus', sub: l['off'], value: qOff, display: micros(qOff) },
      { label: l['quarkus'] ?? 'Quarkus', sub: l['on'], value: qOn, display: micros(qOn) },
    ];
  }

  protected springRows(t: LabTab): BarRow[] {
    const [[exeris, spring]] = pairsIn(claim('L1.copy').copy, 'vs');
    const l = t.labels ?? {};
    return [
      { label: l['exeris'] ?? 'Exeris Community', value: exeris, display: micros(exeris), evidence: true },
      { label: l['spring'] ?? 'Spring Boot on Tomcat', value: spring, display: micros(spring) },
    ];
  }

  protected select(id: LabTab['id']): void {
    this.active.set(id);
    if (this.browser) history.replaceState(history.state, '', `${location.pathname}#${id}`);
  }

  protected onTabKey(event: KeyboardEvent): void {
    const ids = this.props().tabs.map((t) => t.id);
    const i = ids.indexOf(this.active());
    const next =
      event.key === 'ArrowRight' ? (i + 1) % ids.length
      : event.key === 'ArrowLeft' ? (i - 1 + ids.length) % ids.length
      : event.key === 'Home' ? 0
      : event.key === 'End' ? ids.length - 1
      : -1;
    if (next < 0) return;
    event.preventDefault();
    this.select(ids[next]);
    this.host.nativeElement.querySelector<HTMLElement>(`#tab-${ids[next]}`)?.focus();
  }
}

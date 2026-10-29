import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface BarRow {
  readonly label: string;
  readonly sub?: string;
  readonly value: number;
  readonly display: string;
  /** A measured figure bound to a registered claim: drawn in Evidence Orange. */
  readonly evidence?: boolean;
}

/**
 * Horizontal bar chart: each bar is an inline SVG mark scaled to the largest value, with the
 * labels and values as HTML text so they stay legible at any width. The same figures are in a
 * table for readers who want the numbers. No chart library.
 */
@Component({
  selector: 'ex-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="ex-barchart">
      <div class="ex-barchart__rows" role="img" [attr.aria-label]="summary()">
        @for (r of bars(); track r.label) {
          <div class="ex-barchart__row" aria-hidden="true">
            <span class="ex-barchart__label">{{ r.label }}@if (r.sub) {<span class="ex-barchart__sub">{{ r.sub }}</span>}</span>
            <svg class="ex-barchart__bar" viewBox="0 0 100 20" preserveAspectRatio="none" focusable="false">
              <rect x="0" y="0" [attr.width]="r.pct" height="20" [class]="r.evidence ? 'ex-chart__bar ex-chart__bar--evidence' : 'ex-chart__bar'" />
            </svg>
            <span class="ex-barchart__value" [class.is-evidence]="r.evidence">{{ r.display }}</span>
          </div>
        }
      </div>
      <figcaption>
        <span class="ex-barchart__caption">{{ caption() }}</span>
        <details class="ex-barchart__data">
          <summary>Data</summary>
          <table class="ex-table">
            <thead><tr><th scope="col">Arm</th><th scope="col">{{ unit() }}</th></tr></thead>
            <tbody>
              @for (r of rows(); track r.label) {
                <tr><th scope="row">{{ r.label }}@if (r.sub) {<span class="ex-chart-sub"> · {{ r.sub }}</span>}</th><td class="ex-num">{{ r.display }}</td></tr>
              }
            </tbody>
          </table>
        </details>
      </figcaption>
    </figure>
  `,
})
export class BarChartComponent {
  readonly rows = input.required<readonly BarRow[]>();
  readonly caption = input.required<string>();
  readonly unit = input.required<string>();

  protected readonly bars = computed(() => {
    const max = Math.max(...this.rows().map((r) => r.value));
    return this.rows().map((r) => ({ ...r, pct: Math.max(0.5, (r.value / max) * 100) }));
  });

  protected readonly summary = computed(
    () => `${this.caption()}: ${this.rows().map((r) => `${r.label} ${r.display}`).join(', ')}`,
  );
}

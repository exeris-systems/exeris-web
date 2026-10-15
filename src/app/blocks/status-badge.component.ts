import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { READINESS, readinessLabel, type Readiness } from '../data/data';

/** The readiness of a cap or SKU as a badge: PoC, Snapshot or Released. */
@Component({
  selector: 'ex-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="cls()" [attr.title]="hint()">{{ label() }}</span>`,
})
export class StatusBadgeComponent {
  readonly status = input.required<Readiness>();
  protected readonly label = computed(() => readinessLabel(this.status()));
  protected readonly hint = computed(() => READINESS.find((r) => r.key === this.status())?.hint ?? null);
  protected readonly cls = computed(() => {
    switch (this.status()) {
      case 'released':
        return 'ex-tag ex-tag--ok';
      case 'snapshot':
        return 'ex-tag ex-tag--cyan';
      default:
        return 'ex-tag ex-tag--muted';
    }
  });
}

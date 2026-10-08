import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CAPS, LAYERS } from '../data/data';

/** The registry's seven layers with their caps, generated from cap-license-registry.md. */
@Component({
  selector: 'ex-layer-breakdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="ex-layers">
      @for (layer of layers; track layer.n) {
        <li class="ex-layers__row">
          <div class="ex-layers__head">
            <span class="ex-layers__n ex-mono">L{{ layer.n }}</span>
            <h3>{{ layer.name }}</h3>
            <span class="ex-tag">{{ layer.count }} caps</span>
          </div>
          <ul class="ex-composition__caps">
            @for (c of capsOf(layer.n); track c.name) {
              <li [class]="'ex-capchip ex-lic--' + c.licence" [title]="c.licence">
                <span class="ex-capchip__dot" aria-hidden="true"></span>{{ c.short }}<span class="ex-sr"> ({{ c.licence }})</span>
              </li>
            }
          </ul>
        </li>
      }
    </ol>
  `,
})
export class LayerBreakdownComponent {
  readonly props = input<Record<string, never>>({});
  protected readonly layers = LAYERS;
  protected capsOf(n: number) {
    return CAPS.filter((c) => c.layer === n);
  }
}

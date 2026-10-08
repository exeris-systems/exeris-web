import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ViewNodesComponent } from './view-nodes.component';
import type { ViewJson } from './view-types';

/**
 * A routed page rendered from its presentation-IR document. The route passes the view as the
 * `view` route-data input. The page title is not repeated as an h1: on this site the first
 * block of every page carries the page heading.
 */
@Component({
  selector: 'ex-view-host',
  imports: [ViewNodesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="exeris-page" [attr.data-view]="view().view.name">
      @for (region of view().view.regions ?? []; track $index) {
        <section [attr.data-region]="region.slot ?? 'region'">
          <ex-view-nodes [nodes]="region.components ?? []" />
        </section>
      }
    </main>
  `,
})
export class ViewHostComponent {
  readonly view = input.required<ViewJson>();
}

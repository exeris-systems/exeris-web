import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SectionHeadComponent, type SectionHeadProps } from './section-head.block';
import { TextComponent } from './text.component';

export interface ConsumerRow {
  readonly consumer: string;
  readonly runs: boolean;
  readonly note: string;
}

export interface ConsumerTableProps {
  readonly id?: string;
  readonly head: SectionHeadProps;
  readonly caption: string;
  readonly rows: readonly ConsumerRow[];
  readonly alt?: boolean;
}

@Component({
  selector: 'ex-consumer-table',
  imports: [SectionHeadComponent, TextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section" [class.ex-section--alt]="props().alt" [attr.id]="props().id ?? null">
      <div class="ex-container">
        <ex-section-head [props]="props().head" />
        <div class="ex-table-wrap">
          <table class="ex-table">
            <caption class="ex-sr">{{ props().caption }}</caption>
            <thead>
              <tr><th scope="col">Consumer</th><th scope="col">Runs on Spring Runtime</th><th scope="col">Why</th></tr>
            </thead>
            <tbody>
              @for (r of props().rows; track r.consumer) {
                <tr>
                  <th scope="row">{{ r.consumer }}</th>
                  <td>
                    @if (r.runs) {
                      <span class="ex-tag ex-tag--ok">Yes</span>
                    } @else {
                      <span class="ex-tag ex-tag--muted">No</span>
                    }
                  </td>
                  <td><ex-text [text]="r.note" /></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
})
export class ConsumerTableComponent {
  readonly props = input.required<ConsumerTableProps>();
}

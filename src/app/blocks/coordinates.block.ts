import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TOOLING } from '../data/data';
import { SectionHeadComponent, type SectionHeadProps } from './section-head.block';
import { TextComponent } from './text.component';

export interface CoordinatesProps {
  readonly id?: string;
  readonly head?: SectionHeadProps;
  readonly alt?: boolean;
  /** What each published artefact is for, by artefactId. */
  readonly what: Readonly<Record<string, string>>;
  readonly caption: string;
}

/**
 * The Maven Central coordinates of the tooling release. Group, artefacts and version come from
 * build-meta.json, which fetch-data.mjs fills from Maven Central's own metadata.
 */
@Component({
  selector: 'ex-coordinates',
  imports: [SectionHeadComponent, TextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section" [class.ex-section--alt]="props().alt" [attr.id]="props().id ?? null">
      <div class="ex-container">
        @if (props().head) {
          <ex-section-head [props]="props().head!" />
        }
        <div class="ex-table-wrap" tabindex="0" role="region" [attr.aria-label]="props().caption">
          <table class="ex-table">
            <caption class="ex-sr">{{ props().caption }}</caption>
            <thead>
              <tr>
                <th scope="col">groupId</th>
                <th scope="col">artifactId</th>
                <th scope="col">version</th>
                <th scope="col">What it is</th>
              </tr>
            </thead>
            <tbody>
              @for (a of tooling.artifacts; track a) {
                <tr>
                  <td class="ex-mono">{{ tooling.group }}</td>
                  <th scope="row" class="ex-mono">{{ a }}</th>
                  <td class="ex-mono">
                    <a class="ex-link" [href]="central(a)">{{ tooling.version }}</a>
                  </td>
                  <td><ex-text [text]="props().what[a] ?? ''" /></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
})
export class CoordinatesComponent {
  readonly props = input.required<CoordinatesProps, unknown>({ transform: (value: unknown) => value as CoordinatesProps });
  protected readonly tooling = TOOLING;
  protected central(artifact: string): string {
    return `https://central.sonatype.com/artifact/${this.tooling.group}/${artifact}/${this.tooling.version}`;
  }
}

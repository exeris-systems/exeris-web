import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TextComponent } from './text.component';

export interface RepoProps {
  readonly name: string;
  readonly description: string;
  /** Licence or product label shown as the card's tag. */
  readonly label: string;
  /** Set for a public repository; a card without it names a repository that is not public. */
  readonly href?: string;
  readonly note?: string;
}

/** Repository cards. A public repository links to GitHub; any other carries its note instead. */
@Component({
  selector: 'ex-repo-grid',
  imports: [TextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="ex-grid ex-grid--3 ex-repos">
      @for (r of props().repos; track r.name) {
        <li class="ex-card">
          <h3 class="ex-repo__name ex-mono">
            @if (r.href) {
              <a [href]="r.href">{{ r.name }}</a>
            } @else {
              <ng-container>{{ r.name }}</ng-container>
            }
          </h3>
          <p><ex-text [text]="r.description" /></p>
          <p class="ex-card__foot ex-repo__foot">
            <span [class]="r.href ? 'ex-tag ex-tag--cyan' : 'ex-tag'">{{ r.label }}</span>
            @if (r.note) {
              <span class="ex-tag ex-tag--muted">{{ r.note }}</span>
            }
          </p>
        </li>
      }
    </ul>
  `,
})
export class RepoGridComponent {
  readonly props = input.required<{ readonly repos: readonly RepoProps[] }>();
}

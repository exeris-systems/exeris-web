import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HrefDirective } from '../shell/href.directive';
import { CodePaneComponent, type CodePaneProps } from './code-pane.block';
import { TextComponent } from './text.component';
import { btnClass, tagClass, type Badge, type Crumb, type Cta } from './types';

export interface PageHeaderProps {
  readonly crumbs?: readonly Crumb[];
  readonly eyebrow?: string;
  readonly title: string;
  /** A word of the title set in the Flow gradient. */
  readonly accent?: string;
  readonly lede?: string;
  readonly badges?: readonly Badge[];
  readonly ctas?: readonly Cta[];
  readonly code?: CodePaneProps;
  readonly center?: boolean;
}

/** The first block of an inner page: breadcrumbs, badges, the page h1, lede and actions. */
@Component({
  selector: 'ex-page-header',
  imports: [HrefDirective, TextComponent, CodePaneComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="ex-section ex-section--alt ex-page-header" [class.ex-page-header--center]="props().center">
      <div class="ex-atmos" aria-hidden="true"></div>
      <div class="ex-container ex-page-header__grid" [class.has-aside]="props().code">
        <div>
          @if (props().crumbs?.length) {
            <nav aria-label="Breadcrumb">
              <ol class="ex-crumbs">
                @for (c of props().crumbs; track c.label; let last = $last) {
                  <li>
                    @if (c.href && !last) {
                      <a [exHref]="c.href">{{ c.label }}</a>
                    } @else {
                      <span [attr.aria-current]="last ? 'page' : null">{{ c.label }}</span>
                    }
                  </li>
                }
              </ol>
            </nav>
          }
          @if (props().badges?.length) {
            <ul class="ex-tags ex-page-header__badges">
              @for (b of props().badges; track b.label) {
                <li [class]="tagClass(b.tone)">{{ b.label }}</li>
              }
            </ul>
          }
          @if (props().eyebrow) {
            <p class="ex-eyebrow">{{ props().eyebrow }}</p>
          }
          <h1 class="ex-page-header__title">
            @for (part of titleParts(); track $index) {
              @if (part.accent) {
                <span class="ex-flow-text">{{ part.text }}</span>
              } @else {
                <ng-container>{{ part.text }}</ng-container>
              }
            }
          </h1>
          @if (props().lede) {
            <p class="ex-page-header__lede"><ex-text [text]="props().lede!" /></p>
          }
          @if (props().ctas?.length) {
            <div class="ex-actions ex-page-header__actions">
              @for (cta of props().ctas; track cta.label) {
                <a [exHref]="cta.href" [class]="btnClass(cta)">{{ cta.label }}</a>
              }
            </div>
          }
        </div>
        @if (props().code) {
          <ex-code-pane [props]="props().code!" />
        }
      </div>
    </header>
  `,
})
export class PageHeaderComponent {
  readonly props = input.required<PageHeaderProps>();
  protected readonly tagClass = tagClass;
  protected readonly btnClass = btnClass;

  protected titleParts(): { text: string; accent: boolean }[] {
    const { title, accent } = this.props();
    if (!accent || !title.includes(accent)) return [{ text: title, accent: false }];
    const i = title.indexOf(accent);
    return [
      { text: title.slice(0, i), accent: false },
      { text: accent, accent: true },
      { text: title.slice(i + accent.length), accent: false },
    ].filter((p) => p.text);
  }
}

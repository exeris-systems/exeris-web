import { RenderMode, type ServerRoute } from '@angular/ssr';
import { RENDERED_VIEWS, routePath } from './view/views';

/**
 * The prerender list: every view's route and the generated not-found page. The site has no
 * server, so nothing renders on request; an unknown path is answered by 404.html.
 */
export const serverRoutes: ServerRoute[] = [
  ...RENDERED_VIEWS.map((view): ServerRoute => ({ path: routePath(view), renderMode: RenderMode.Prerender })),
  { path: '404', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];

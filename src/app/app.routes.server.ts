import { RenderMode, type ServerRoute } from '@angular/ssr';
import { viewRoutes } from './generated/view.routes';

/**
 * The prerender list: every generated view route. The site has no server, so nothing renders on
 * request; an unknown path is answered by 404.html.
 */
export const serverRoutes: ServerRoute[] = [
  ...viewRoutes.map((route): ServerRoute => ({ path: route.path ?? '', renderMode: RenderMode.Prerender })),
  { path: '**', renderMode: RenderMode.Client },
];

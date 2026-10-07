import { RenderMode, type ServerRoute } from '@angular/ssr';

/**
 * The prerender list. The site has no server, so nothing renders on request; an unknown path is
 * answered by 404.html.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '404', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];

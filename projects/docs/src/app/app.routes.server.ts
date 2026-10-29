import { RenderMode, type ServerRoute } from '@angular/ssr';
import { PAGES } from './docs';

/**
 * The home route, every document and the not-found page are prerendered; any other path is
 * rendered in the browser from the client shell. There is no server: the Worker answers an
 * unknown path with 404.html.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  ...PAGES.map((p): ServerRoute => ({ path: p.route, renderMode: RenderMode.Prerender })),
  { path: '404', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];

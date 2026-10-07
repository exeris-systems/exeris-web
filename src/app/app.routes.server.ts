import { RenderMode, type ServerRoute } from '@angular/ssr';

/** Every route is prerendered to a static file; the site has no server. */
export const serverRoutes: ServerRoute[] = [{ path: '**', renderMode: RenderMode.Prerender }];

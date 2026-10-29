import { RenderMode, type ServerRoute } from '@angular/ssr';

/** Every route is prerendered; there is no server. */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];

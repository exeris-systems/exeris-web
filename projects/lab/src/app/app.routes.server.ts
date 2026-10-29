import { RenderMode, type ServerRoute } from '@angular/ssr';

/**
 * The home route is prerendered; any other path is rendered in the browser from the client
 * shell. There is no server.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];

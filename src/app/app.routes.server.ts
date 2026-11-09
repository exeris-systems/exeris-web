import { RenderMode, type ServerRoute } from '@angular/ssr';
import { viewServerRoutes } from './generated/view.routes.server';

/**
 * The prerender list: every view route, as the generator lists them under `render: 'ssg'`. The
 * site has no server, so nothing renders on request; an unknown path is answered by 404.html.
 */
export const serverRoutes: ServerRoute[] = [...viewServerRoutes, { path: '**', renderMode: RenderMode.Client }];

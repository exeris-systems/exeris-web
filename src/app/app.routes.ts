import type { Routes } from '@angular/router';
import { viewRoutes } from './generated/view.routes';
import { NotFoundPageComponent } from './generated/pages/not-found.component';

/** One route per authored view, as the generator emits them, and the not-found fallback. */
export const routes: Routes = [...viewRoutes, { path: '**', component: NotFoundPageComponent }];

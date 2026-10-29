/**
 * Angular application entry point. Kept by hand: exeris-codegen.json sets `scaffold: false`, so
 * the generator writes only the pages.
 */

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

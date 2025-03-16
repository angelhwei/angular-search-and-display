import { bootstrapApplication } from '@angular/platform-browser'
import { provideHttpClient } from '@angular/common/http'
import { provideAnimations } from '@angular/platform-browser/animations'
import { AppComponent } from './app/app.component'
import { provideRouter, withComponentInputBinding } from '@angular/router'
import { SearchService, SEARCH_CONFIG } from './app/services/search.service'

bootstrapApplication(AppComponent, {
    providers: [
        provideHttpClient(),
        provideRouter([], withComponentInputBinding()),
        provideAnimations(), // Add this line to provide animations
        SearchService,
        // Optional: Provide configuration for search service
        { provide: SEARCH_CONFIG, useValue: { defaultPageSize: 10 } },
    ],
}).catch(err => console.error(err))

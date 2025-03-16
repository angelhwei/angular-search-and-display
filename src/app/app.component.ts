import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Component, inject, OnInit } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatListModule } from '@angular/material/list'
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import {
    Observable,
    of,
    catchError,
    debounceTime,
    distinctUntilChanged,
    map,
    switchMap,
    tap,
    BehaviorSubject,
} from 'rxjs'
import { CurrentSearch, SearchService } from './services/search.service'

interface SearchResult {
    num_found: number
    docs: {
        title: string
        author_name: string[]
        cover_edition_key: string
    }[]
}

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatListModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
    ],
})
export class AppComponent implements OnInit {
    private http = inject(HttpClient)

    // Make searchService public so it can be accessed from the template
    public searchService = inject(SearchService)

    // Form control
    searchForm = new FormGroup({
        searchText: new FormControl(''),
    })

    // Loading state
    loading$ = new BehaviorSubject<boolean>(false)

    // Error state
    error$ = new BehaviorSubject<string | null>(null)

    // Current page and page size
    currentPage = 1
    currentPageSize = 10

    // Search results
    searchResults$: Observable<SearchResult | null> = this.searchService.currentSearch$.pipe(
        tap(() => {
            this.loading$.next(true)
            this.error$.next(null)
        }),
        switchMap(currentSearch => {
            // Update local variables for use in template
            this.currentPage = currentSearch.page
            this.currentPageSize = currentSearch.pageSize
            return this.searchBooks(currentSearch)
        }),
        tap(() => this.loading$.next(false)),
        catchError(error => {
            this.loading$.next(false)
            this.error$.next('An error occurred while searching. Please try again.')
            console.error('Search error:', error)
            return of(null)
        })
    )

    ngOnInit() {
        // Subscribe to search text changes and update form value without emitting event
        this.searchService.searchText$.subscribe(text => {
            this.searchForm.get('searchText')?.setValue(text, { emitEvent: false })
        })

        // Listen for form changes with debounce
        this.searchForm
            .get('searchText')
            ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
            .subscribe(value => {
                this.searchService.updateSearchText(value || '')
            })
    }

    // Submit search
    submitSearch() {
        this.searchService.submitSearch()
    }

    // Handle pagination event
    handlePageEvent(event: PageEvent) {
        const newSize = event.pageSize
        const newPage = event.pageIndex + 1

        if (newSize !== this.currentPageSize) {
            this.searchService.updatePageSize(newSize)
        } else if (newPage !== this.currentPage) {
            this.searchService.updatePage(newPage)
        }
        this.searchService.submitSearch()
    }

    // Search books method
    private searchBooks(currentSearch: CurrentSearch): Observable<SearchResult> {
        const { searchText, pageSize, page } = currentSearch
        const searchQuery = searchText.split(' ').join('+').toLowerCase()

        return this.http.get<SearchResult>(
            `https://openlibrary.org/search.json?q=${searchQuery}&page=${page}&limit=${pageSize}`
        )
    }

    // Safe method to handle author names
    safeAuthorJoin(authors: string[] | null | undefined): string {
        return authors && authors.length ? authors.join(', ') : 'Unknown author'
    }

    // Track function for ngFor
    trackByTitle(index: number, item: any): string {
        return item.title
    }
}

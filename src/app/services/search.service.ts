import { Injectable, InjectionToken, Optional, Inject } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { BehaviorSubject, Observable, combineLatest } from 'rxjs'
import { map, tap, distinctUntilChanged, filter, shareReplay } from 'rxjs/operators'

export interface SearchConfig {
    defaultPageSize?: number
}

export interface CurrentSearch {
    searchText: string
    pageSize: number
    page: number
}

export interface ISearchService {
    searchText$: Observable<string>
    pageSize$: Observable<number>
    page$: Observable<number>
    currentSearch$: Observable<CurrentSearch>
    updateSearchText(text: string): void
    updatePageSize(size: number): void
    updatePage(page: number): void
    submitSearch(): void
}

// Injection token for configuration
export const SEARCH_CONFIG = new InjectionToken<SearchConfig>('search.config')

@Injectable({
    providedIn: 'root',
})
export class SearchService implements ISearchService {
    // BehaviorSubjects for state storage
    private searchTextSubject = new BehaviorSubject<string>('')
    private pageSizeSubject = new BehaviorSubject<number>(10)
    private pageSubject = new BehaviorSubject<number>(1)
    private submitSubject = new BehaviorSubject<boolean>(false)

    // Public Observables
    searchText$ = this.searchTextSubject.asObservable().pipe(distinctUntilChanged())
    pageSize$ = this.pageSizeSubject.asObservable().pipe(distinctUntilChanged())
    page$ = this.pageSubject.asObservable().pipe(distinctUntilChanged())

    // Combined Observable for current search
    currentSearch$ = combineLatest([
        this.searchText$,
        this.pageSize$,
        this.page$,
        this.submitSubject,
    ]).pipe(
        filter(([searchText, _, __, submitted]) => submitted && searchText.trim().length > 0),
        map(([searchText, pageSize, page]) => ({ searchText, pageSize, page })),
        tap(search => this.updateUrlParams(search)),
        shareReplay(1)
    )

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        @Optional() @Inject(SEARCH_CONFIG) config?: SearchConfig
    ) {
        // Use config page size if provided
        if (config?.defaultPageSize) {
            this.updatePageSize(config.defaultPageSize)
        }

        // Initialize from URL params
        this.initFromUrl()
    }

    // Initialize from URL parameters
    private initFromUrl(): void {
        this.route.queryParamMap.subscribe(params => {
            const q = params.get('q')
            if (q) {
                this.searchTextSubject.next(q)

                const page = params.get('page')
                if (page) {
                    this.pageSubject.next(parseInt(page, 10))
                }

                const limit = params.get('limit')
                if (limit) {
                    this.pageSizeSubject.next(parseInt(limit, 10))
                }

                // Trigger search if there's search text
                this.submitSubject.next(true)
            }
        })
    }

    // Update URL parameters
    private updateUrlParams(search: CurrentSearch): void {
        this.router.navigate([], {
            queryParams: {
                q: search.searchText,
                page: search.page,
                limit: search.pageSize,
            },
            queryParamsHandling: 'merge',
            replaceUrl: true,
        })
    }

    // Public method to update search text
    updateSearchText(text: string): void {
        this.searchTextSubject.next(text)
    }

    // Public method to update page size
    updatePageSize(size: number): void {
        this.pageSizeSubject.next(size)
        // Reset to first page when changing page size
        this.pageSubject.next(1)
    }

    // Public method to update current page
    updatePage(page: number): void {
        this.pageSubject.next(page)
    }

    // Submit search
    submitSearch(): void {
        // Reset to first page when submitting new search
        this.submitSubject.next(true)
    }
}

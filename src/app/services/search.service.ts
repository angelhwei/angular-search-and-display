import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

interface SearchConfig {
  defaultPageSize?: number;
}

export interface CurrentSearch {
  searchText: string;
  pageSize: number;
  page: number;
}

export interface ISearchService {
  searchText: string;
  pageSize: number;
  page: number;
  currentSearch$: BehaviorSubject<CurrentSearch | null>;
  submit(): void;
}

// BONUS: Use DI to update the config of SearchService to update page size
export const SEARCH_CONFIG = undefined;

@Injectable()
export class SearchService implements ISearchService {
  searchText = '';
  pageSize = 10;
  page = 1;
  currentSearch$ = new BehaviorSubject<CurrentSearch | null>(null);

  constructor(private router: Router) {
    this._initFromUrl();
  }

  // BONUS: Keep the current search params in the URL that allow users to refresh the page and search again
  private _initFromUrl() {}

  submit() {}
}

export interface Paginate<T> {
    data: T;
    limit: number;
    total: number;
    page: number;
    last_page: number;
}

export interface SavedImage {
    large: string;
    medium: string;
}

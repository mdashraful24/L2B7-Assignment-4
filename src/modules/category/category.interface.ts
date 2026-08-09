export interface ICategory {
    name: string;
    description?: string;
    icon?: string;
    isActive?: boolean;
}

export interface IAllCategories {
    isActive?: string;

    searchTerm?: string;

    page?: string;
    limit?: string;

    sortBy?: string;
    sortOrder?: "asc" | "desc";
}
export interface ICreateService {
    categoryId: string;
    title: string;
    description: string;
    price: number;
    duration: number;
    isAvailable?: boolean;
}

export interface IUpdateService {
    categoryId?: string;
    title?: string;
    description?: string;
    price?: number;
    duration?: number;
    isAvailable?: boolean;

    // Technician profile fields
    skills?: string[];
    experience?: string;
    hourlyRate?: number;
}

export interface IServices {
    searchTerm?: string;
    category?: string;

    location?: string;
    rating?: string;

    minPrice?: string;
    maxPrice?: string;

    page?: string;
    limit?: string;

    sortBy?: string;
    sortOrder?: "asc" | "desc";
}
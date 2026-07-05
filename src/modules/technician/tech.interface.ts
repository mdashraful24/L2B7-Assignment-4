export interface ITechnician {
    // Pagination
    page?: string;
    limit?: string;
    sortOrder?: string;
    sortBy?: string;

    // Filter fields
    minHourlyRate?: string;
    maxHourlyRate?: string;
    location?: string;
    minRating?: string;
    maxRating?: string;
    skills?: string;
    experience?: string;
}
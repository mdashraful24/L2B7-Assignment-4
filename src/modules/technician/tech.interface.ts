export interface IUpdateTechnicianProfile {
    name?: string;
    email?: string;
    password?: string;

    phone?: string;
    address?: string;

    bio?: string;
    skills?: string[];
    experience?: string;
    hourlyRate?: number;
    description?: string;
    location?: string;
}

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
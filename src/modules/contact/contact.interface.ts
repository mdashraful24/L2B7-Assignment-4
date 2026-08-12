export interface ICreateContact {
    name: string;
    email: string;
    subject: string;
    message: string;
};

export interface IGetAllContactInfo {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;

    searchTerm?: string;

    page?: string;
    limit?: string;

    sortOrder?: "asc" | "desc";
    sortBy?: string;
}

export interface ICreateContact {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export interface IGetAllContactInfo {
    searchTerm?: string;

    page?: string;
    limit?: string;

    sortOrder?: "asc" | "desc";
    sortBy?: string;
}

export interface IContactUser {
    userId: string;
}

export interface IReplyContact {
    reply: string;
}

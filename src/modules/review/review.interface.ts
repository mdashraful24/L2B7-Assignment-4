export interface ICreateReview {
    bookingId: string;
    rating: number;
    comment?: string;
}

export interface IGetReview {
    rating?: number;
    comment?: string;
    createdAt?: string;
}

export interface IUpdateReview {
    comment?: string,
    rating?: number,
}
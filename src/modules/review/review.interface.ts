export interface ICreateReview {
    bookingId: string;
    rating: number;
    comment?: string;
}

export interface IUpdateReview {
    comment?: string,
    rating?: number,
}
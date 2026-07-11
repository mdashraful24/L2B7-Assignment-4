import httpStatus from 'http-status';
import Stripe from "stripe";
import { prisma } from "../lib/prisma";
import { BookingStatus, PaymentProvider, PaymentStatus } from "../../generated/prisma/enums";
import { SelfError } from "./errorResponse";

export const handleCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
    const bookingId = session.metadata?.bookingId;
    const userId = session.metadata?.userId;
    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

    if (!bookingId) {
        throw new SelfError("Missing bookingId in Stripe Checkout Session metadata", httpStatus.BAD_REQUEST);
    }

    const payment = await prisma.payment.findFirst({
        where: {
            OR: [
                { bookingId },
                {
                    sessionId: session.id
                }
            ]
        }
    });

    if (!payment) {
        await prisma.payment.create({
            data: {
                bookingId,
                userId: userId || '',
                transactionId: `TXN-${Date.now()}`,
                amount: (session.amount_total ?? 0) / 100,
                provider: PaymentProvider.STRIPE,
                status: PaymentStatus.COMPLETED,
                sessionId: session.id,
                paymentIntentId,
                metadata: {
                    bookingId,
                    userId
                },
                paidAt: new Date()
            }
        });
    } else {
        await prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: {
                    id: payment.id
                },
                data: {
                    status: PaymentStatus.COMPLETED,
                    sessionId: session.id,
                    paymentIntentId,
                    metadata: {
                        bookingId,
                        userId
                    },
                    paidAt: new Date()
                }
            });

            await tx.booking.update({
                where: {
                    id: bookingId
                },
                data: {
                    status: BookingStatus.PAID
                }
            });
        });
    }

    return {
        received: true,
        message: "Payment completed"
    };
};

export const handlePaymentIntentSucceeded = async (paymentIntent: Stripe.PaymentIntent) => {
    const payment = await prisma.payment.findFirst({
        where: {
            paymentIntentId: paymentIntent.id
        }
    });

    if (!payment) {
        console.warn(`Unknown payment record for succeeded payment intent ${paymentIntent.id}`);
        return {
            received: true
        };
    }

    await prisma.$transaction(async (tx) => {
        await tx.payment.update({
            where: {
                id: payment.id
            },
            data: {
                status: PaymentStatus.COMPLETED,
                paidAt: new Date()
            }
        });

        await tx.booking.update({
            where: {
                id: payment.bookingId
            },
            data: {
                status: BookingStatus.PAID
            }
        });
    });

    return {
        received: true,
        message: "Payment completed"
    };
};

export const handlePaymentFailed = async (paymentIntent: Stripe.PaymentIntent) => {
    const payment = await prisma.payment.findFirst({
        where: {
            paymentIntentId: paymentIntent.id
        }
    });

    if (!payment) {
        console.warn(`Unknown payment record for failed payment intent ${paymentIntent.id}`);
        return { 
            received: true 
        };
    }

    await prisma.payment.update({
        where: {
            id: payment.id
        },
        data: {
            status: PaymentStatus.FAILED,
            paidAt: null
        }
    });

    return {
        received: true,
        message: "Payment failed"
    };
};

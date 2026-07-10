import httpStatus from 'http-status';
import Stripe from 'stripe';
import { prisma } from "../../lib/prisma";
import { SelfError } from "../../utils/errorResponse";
import { stripe } from '../../lib/stripe';
import config from '../../config';
import { BookingStatus, PaymentProvider, PaymentStatus } from '../../../generated/prisma/enums';
import { ICreatePaymentConfirm } from './payment.interface';
import { handleCheckoutCompleted, handlePaymentFailed, handlePaymentIntentSucceeded } from '../../utils/payment.utils';

const createIntentIntoStripe = async (userId: string, bookingId: string) => {
    if (!userId || !bookingId) {
        throw new SelfError("Booking or user id is required", httpStatus.BAD_REQUEST);
    }

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            customer: {
                select: {
                    email: true
                }
            }
        }
    });

    if (!booking) {
        throw new SelfError("Booking not found", httpStatus.NOT_FOUND);
    }

    if (booking.customerId !== userId) {
        throw new SelfError("You are not authorized to pay for this booking", httpStatus.FORBIDDEN);
    }

    if (booking.status !== BookingStatus.ACCEPTED) {
        throw new SelfError("Booking must be accepted before payment can be started", httpStatus.BAD_REQUEST);
    }

    const existingPayment = await prisma.payment.findFirst({
        where: {
            bookingId: booking.id
        }
    });

    if (existingPayment?.sessionId) {
        const existingSession = await stripe.checkout.sessions.retrieve(existingPayment.sessionId);

        if (existingSession.url) {
            return {
                payment: existingPayment,
                checkoutUrl: existingSession.url,
                sessionId: existingPayment.sessionId
            };
        }
    }

    const amountInCents = Math.round(booking.totalAmount * 100);
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: booking.customer?.email ?? undefined,
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    unit_amount: amountInCents,
                    product_data: {
                        name: `FixItNow booking - ${booking.id}`
                    }
                },
                quantity: 1
            }
        ],
        success_url: `${config.appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.appUrl}/payment/cancel?bookingId=${booking.id}`,
        metadata: {
            bookingId: booking.id,
            userId
        }
    });

    const payment = await prisma.payment.upsert({
        where: {
            bookingId: booking.id
        },
        create: {
            bookingId: booking.id,
            userId,
            transactionId: `TXN-${Date.now()}`,
            amount: booking.totalAmount,
            provider: PaymentProvider.STRIPE,
            status: PaymentStatus.PENDING,
            sessionId: session.id,
            paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
            metadata: {
                bookingId: booking.id,
                userId
            }
        },
        update: {
            sessionId: session.id,
            paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
            status: PaymentStatus.PENDING,
            metadata: {
                bookingId: booking.id,
                userId
            }
        }
    });

    return {
        payment,
        checkoutUrl: session.url,
        sessionId: session.id
    };
};

const createPaymentConfirmation = async (payload: ICreatePaymentConfirm) => {
    const { sessionId, paymentIntentId } = payload;

    if (!sessionId && !paymentIntentId) {
        throw new SelfError("SessionId or paymentIntentId is required", httpStatus.BAD_REQUEST);
    }

    let resolvedPaymentIntentId = paymentIntentId;

    if (sessionId) {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['payment_intent']
        });

        if (typeof session.payment_intent === 'string') {
            resolvedPaymentIntentId = session.payment_intent;
        } else if (session.payment_intent?.id) {
            resolvedPaymentIntentId = session.payment_intent.id;
        }

        if (session.payment_status !== 'paid') {
            throw new SelfError("Payment is not completed yet", httpStatus.BAD_REQUEST);
        }
    }

    if (resolvedPaymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(resolvedPaymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            throw new SelfError("Payment is not completed yet", httpStatus.BAD_REQUEST);
        }
    }

    const payment = await prisma.payment.findFirst({
        where: {
            OR: [
                {
                    sessionId
                },
                {
                    paymentIntentId: resolvedPaymentIntentId
                }
            ].filter(
                Boolean as unknown as (
                    value: { sessionId?: string; paymentIntentId?: string } | null
                ) => boolean
            )
        }
    });

    if (!payment) {
        throw new SelfError("Payment not found", httpStatus.NOT_FOUND);
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
        message: "Payment confirmed"
    };
};

const handleWebhook = async (payload: Buffer, signature: string) => {
    const endpointSecret = config.stripe.webhookSecret;

    if (!endpointSecret) {
        throw new SelfError("Stripe webhook secret is not configured", httpStatus.INTERNAL_SERVER_ERROR);
    }

    const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret
    );

    switch (event.type) {
        case 'checkout.session.completed':
            return handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        case 'payment_intent.succeeded':
            return handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        case 'payment_intent.payment_failed':
            return handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        default:
            return {
                received: true,
                eventType: event.type
            };
    }
};

const getPaymentHistory = async (userId: string) => {
    if (!userId) {
        throw new SelfError("User ID is required", httpStatus.BAD_REQUEST);
    }

    const paymentHistory = await prisma.payment.findMany({
        where: { userId },
        orderBy: {
            createdAt: "desc"
        },
        include: {
            booking: true
        }
    });

    return paymentHistory;
};

const getPaymentDetails = async (userId: string, paymentId: string) => {
    const existingPayment = await prisma.payment.findUnique({
        where: {
            id: paymentId,
        },
        select: {
            userId: true,
        },
    });

    if (!existingPayment) {
        throw new SelfError("Payment not found", httpStatus.NOT_FOUND);
    }

    if (existingPayment.userId !== userId) {
        throw new SelfError("Unauthorized access", httpStatus.FORBIDDEN);
    }

    const payment = await prisma.payment.findUnique({
        where: {
            id: paymentId,
        },
        include: {
            booking: true,
        },
    });

    return payment;
};


export const paymentServices = {
    createIntentIntoStripe,
    createPaymentConfirmation,
    handleWebhook,
    getPaymentHistory,
    getPaymentDetails
};
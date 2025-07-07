import { TService } from "./models/Services";

// user filterable for finding barbers
export type TUserQueryProps = {
    location?: string;
    startingPrice?: number;
    hours?: string;
    rating?: number;
}

export enum DAYS_OF_WEEK {
    MONDAY = 0,
    TUESDAY = 1,
    WEDNESDAY = 2,
    THURSDAY = 3,
    FRIDAY = 4,
    SATURDAY = 5,
    SUNDAY = 6,
}

export const reverseDayOfWeekMap = {
    [DAYS_OF_WEEK.MONDAY]: "Monday",
    [DAYS_OF_WEEK.TUESDAY]: "Tuesday",
    [DAYS_OF_WEEK.WEDNESDAY]: "Wednesday",
    [DAYS_OF_WEEK.THURSDAY]: "Thursday",
    [DAYS_OF_WEEK.FRIDAY]: "Friday",
    [DAYS_OF_WEEK.SATURDAY]: "Saturday",
    [DAYS_OF_WEEK.SUNDAY]: "Sunday"
}

export enum MINUTES {
    ZERO = 0,
    FIFTEEN = 15,
    THIRTY = 30,
    FORTY_FIVE = 45,
}

/** Appointment notifications */
export type AppointmentNotification = {
    barberId: string;
    message: string;
    appointment: {
      _id: string;
      time: string;
      date: string;
      price: number;
      customerName: string;
      customerId: string;
      customerImg?: string;
      location?: string;
      tip?: number;
      discount?: number;
      addOns?: TService[];
      status?: string;
    };
  };
  

  export enum Notifications {
    // 📅 Booking Events

    /* CREATE BOOKING REQUEST */

    // client emits =>  to server
    USER_APPOINTMENT_REQUEST = 'userAppointmentRequest',
    // server emits => to barber
    USER_APPOINTMENT_NOTIFICATION = 'userAppointmentNotification', // when user sends a request

     
    /* BOOKING REQUEST RESPONSE */
    
    // client emits => to server
    BARBER_APPOINTMENT_RESPONSE = 'barberAppointmentResponse',     // when barber accepts/declines
    // server emits => to user
    BARBER_APPOINTMENT_RESPONSE_NOTIFICATION = 'barberAppointmentResponseNotification',

    BARBER_STARTED_APPOINTMENT = 'barberStartedAppointmentNotification',
    BARBER_COMPLETED_APPOINTMENT = 'barberCompletedAppointmentNotification',


    BOOKING_CONFIRMED = 'bookingConfirmed',
    BOOKING_DECLINED = 'bookingDeclined',
    BOOKING_CANCELLED_BY_USER = 'bookingCancelledByUser',
    BOOKING_CANCELLED_BY_BARBER = 'bookingCancelledByBarber',
    BOOKING_RESCHEDULE_REQUESTED = 'bookingRescheduleRequested',
    BOOKING_RESCHEDULE_APPROVED = 'bookingRescheduleApproved',
    BOOKING_RESCHEDULE_DECLINED = 'bookingRescheduleDeclined',
  
    // 💰 Payment Events
    PAYMENT_SUCCESS = 'paymentSuccess',
    PAYMENT_FAILED = 'paymentFailed',
    PAYMENT_REFUNDED = 'paymentRefunded',
  
    // 💬 Messaging Events
    NEW_MESSAGE = 'newMessage',
    NEW_MESSAGE_FROM_BARBER = 'newMessageFromBarber',
    NEW_MESSAGE_FROM_USER = 'newMessageFromUser',
  
    // ⭐ Review Events
    USER_REVIEW_SUBMITTED = 'userReviewSubmitted',
    BARBER_REPLIED_TO_REVIEW = 'barberRepliedToReview',
  
    // 🔔 General Notifications
    PROMOTION_AVAILABLE = 'promotionAvailable',
    COUPON_APPLIED = 'couponApplied',
    COUPON_EXPIRED = 'couponExpired',
    REMINDER_APPOINTMENT_TODAY = 'reminderAppointmentToday',
    REMINDER_APPOINTMENT_IN_1_HOUR = 'reminderAppointmentIn1Hour',
  
    // 🔐 Account / Auth Notifications
    ACCOUNT_VERIFIED = 'accountVerified',
    ACCOUNT_SUSPENDED = 'accountSuspended',
    PASSWORD_CHANGED = 'passwordChanged',
  }
  
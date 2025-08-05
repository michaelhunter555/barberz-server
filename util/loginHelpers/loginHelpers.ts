import { IBarber } from "../../models/Barber";
import { AccountStatus } from "../../types";

function checkIsBarber(user: IBarber): boolean {
return user.accountType === "barber";
}

export const getAccountDetails = (user: IBarber) => {
if(checkIsBarber(user)) {
    return {
            id: user._id,
            accountType: user.accountType,
            name: user.name,
            email: user.email,
            bio: user.bio,
            primaryLocation: user.primaryLocation,
            isVisible: user.isVisible,
            isVerified: user.isVerified,
            userLicense: user.userLicense,
            image: user.image,
            imageOne: user.imageOne ?? "",
            imageTwo: user.imageTwo ?? "",
            imageThree: user.imageThree ?? "",
            imageFour: user.imageFour ?? "",
            imageFive: user.imageFive ?? "",
            geoLocation: user.geoLocation,
            userIsLive: true,
            status: user.status,
            isAvailable: user.isAvailable,
            startingPrice: user.startingPrice,
            houseCallPrice: user.houseCallPrice,
            hours: user.hours,
            avgReviewScore: user.avgReviewScore,
            totalReviews: user.totalReviews,
            reviews: user.reviews ?? [],
            transactions: user.transactions ?? [],
            requestedBooking: user.requestedBooking ?? [],
            customerBookings: user.customerBookings ?? [],
            hasActiveDeal: user.hasActiveDeal,
            coupons: user.coupons ?? [],
            services: user.services ?? [],
            stripeAccountId: user.stripeAccountId ?? "",
            stripeCustomerId: user.stripeCustomerId ?? "",
            stripeDefaultPaymentMethodId: user.stripeDefaultPaymentMethodId,
            myFavorites: user.myFavorites ?? [],
            rewardPoints: user.rewardPoints,
            accountStrikes: user?.accountStrikes ?? 0,
            accountStatus: user?.accountStatus,
            barberDebt: user?.barberDebt ?? 0,
        }
}
return {
    id: user._id,
    accountType: user.accountType,
    userhasActiveBooking: user.userHasActiveBooking,
    name: user.name,
    email: user.email,
    image: user.image,
    geoLocation: user.geoLocation,
    location: user.location,
    userIsLive: user.userIsLive,
    myCoupons: user.myCoupons ?? [],
    transactions: user.transactions ?? [],
    myBookings: user.myBookings ?? [],
    stripeCustomerId: user.stripeCustomerId ?? "",
    stripeDefaultPaymentMethodId: user.stripeDefaultPaymentMethodId,
    myFavorites: user.myFavorites ?? [],
    rewardPoints: user.rewardPoints,
    clientLocation: user.clientLocation,
    accountStrikes: user?.accountStrikes ?? 0,
    accountStatus: user?.accountStatus,
}
}
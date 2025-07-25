import { IBarber } from "../../models/Barber";

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
            rewardPoints: user.rewardPoints
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
}
}
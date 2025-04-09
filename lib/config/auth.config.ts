import Google from "@auth/express/providers/google";
import { type ExpressAuthConfig, } from "@auth/express";
import User, { IBarber, type Status } from "../../models/Barber";

declare module "@auth/express" {
    interface Session {
        user: { id: string } & Partial<IBarber>;
    }
}

export const authConfig: ExpressAuthConfig = {
    trustHost: true,
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            authorization: {
                params: {
                    scope:
                    "openid email profile",
                    access_type: "offline",
                }
            }
        })
    ],
    secret: process.env.AUTH_SECRET,
    session: {
        maxAge: 30 * 60 * 60 * 24,
        updateAge: 24 * 60 * 60,
    },
    callbacks: {
        jwt: async ({token, user, account, trigger, session,}) => {     
            // handle updates to the session (i.e. user changes to different plan, or theme)
            if(trigger === 'update' && session) {
                return { ...token, ...session?.user };
            }
            // everyone signs up as a normal user 
            let isUser: any;
            try {
                isUser = await User.find({ email: user?.email });
                if(isUser && isUser.accountType === 'barber'){
                        token = {...token, accountType: 'barber', ...isUser};
                } else if(isUser && isUser.accountType === 'user') {
                    token = {...token, accountType: 'user', ...isUser}
                } else {
                    // create new user if they do not exist
                    const newUserData = {
                        name: user?.name,
                        email: user?.email,
                        Geolocation: "",
                        location: "",
                        accountType: "user",
                        userIsLive: true,
                    }
                    const newUser = new User(newUserData);
                    await newUser.save()
                    token = {...token, accountType: 'user', ...newUser.toObject() }
                }
            } catch(err) {
                console.error(err);
            }
            return token;
        },
        session: async ({session, token }) => {
          
            if(token._id && typeof token._id === "string") {
                session.user.id = token._id;
            }
            // handle user login
            if(token.accountType === 'user'){
                if(token.name && typeof token.name === "string") {
                    session.user.name = token.name;
                }

                if(token.email && typeof token.email === 'string') {
                    session.user.email = token.email
                }

                if(token.location && typeof token.location === 'string') {
                    session.user.location = token.location;
                }

                if(token.image && typeof token.image === 'string') {
                    session.user.image = token.image;
                }

                // if(token.reviews && Array.isArray(token.reviews)){
                //     session.user.reviews = token.reviews;
                // }

                if(token.totalReviews && typeof token.totalReviews === 'number'){
                    session.user.totalReviews = token.totalReviews;
                }

                if(token.avgReviewScore && typeof token.avgReviewScore === "number") {
                    session.user.avgReviewScore = token.avgReviewScore
                }

            }

            // handle barber login
            if (token.accountType === 'barber') {
                if (token.name && typeof token.name === "string") {
                    session.user.name = token.name;
                }
    
                if (token.email && typeof token.email === 'string') {
                    session.user.email = token.email;
                }
    
                if (token.location && typeof token.location === 'string') {
                    session.user.location = token.location;
                }
    
                if (token.image && typeof token.image === 'string') {
                    session.user.image = token.image;
                }
    
                if (token.imageOne && typeof token.imageOne === 'string') {
                    session.user.imageOne = token.imageOne;
                }
    
                if (token.imageTwo && typeof token.imageTwo === 'string') {
                    session.user.imageTwo = token.imageTwo;
                }
    
                if (token.imageThree && typeof token.imageThree === 'string') {
                    session.user.imageThree = token.imageThree;
                }
    
                if (token.imageFour && typeof token.imageFour === 'string') {
                    session.user.imageFour = token.imageFour;
                }
    
                if (token.imageFive && typeof token.imageFive === 'string') {
                    session.user.imageFive = token.imageFive;
                }
    
                if (token.shopName && typeof token.shopName === 'string') {
                    session.user.shopName = token.shopName;
                }
    
                if (token.services && Array.isArray(token.services)) {
                    session.user.services = token.services;
                }
    
                if (token.isAvailable && typeof token.isAvailable === 'boolean') {
                    session.user.isAvailable = token.isAvailable;
                }
    
                if (token.status && typeof token.status === 'string') {
                    session.user.status = token.status as Status;
                }
    
                if (token.startingPrice && typeof token.startingPrice === 'number') {
                    session.user.startingPrice = token.startingPrice;
                }
    
                if (token.hours && typeof token.hours === 'string') {
                    session.user.hours = token.hours;
                }
    
                if (token.avgReviewScore && typeof token.avgReviewScore === "number") {
                    session.user.avgReviewScore = token.avgReviewScore;
                }
    
                if (token.totalReviews && typeof token.totalReviews === 'number') {
                    session.user.totalReviews = token.totalReviews;
                }
    
                if (token.reviews && Array.isArray(token.reviews)) {
                    session.user.reviews = token.reviews;
                }
    
                if (token.transactions && Array.isArray(token.transactions)) {
                    session.user.transactions = token.transactions;
                }
    
                if (token.requestedBooking && typeof token.requestedBooking === 'number') {
                    session.user.requestedBooking = token.requestedBooking;
                }
    
                if (token.customerBookings && Array.isArray(token.customerBookings)) {
                    session.user.customerBookings = token.customerBookings;
                }
    
                if (token.hasActiveDeal && typeof token.hasActiveDeal === 'boolean') {
                    session.user.hasActiveDeal = token.hasActiveDeal;
                }
    
                if (token.shops && Array.isArray(token.shops)) {
                    session.user.shops = token.shops;
                }
            }

            return session;
        },
    }
}
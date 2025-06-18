// user filterable for finding barbers
export type TUserQueryProps = {
    location?: string;
    startingPrice?: number;
    hours?: string;
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
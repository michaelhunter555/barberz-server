import nodeCron from 'node-cron';
import checkBookingExpiration from './checkBookingExpiration';
import appointmentNearNotification from './appointmentNearStart';
import cleanUpOldChats from './clearChats';
import initiatePayout from './payouts';

const handleCronJobs = () => {
    // clean ups
    nodeCron.schedule("0 0 * * *", () => {
     checkBookingExpiration();
     cleanUpOldChats();
     initiatePayout();
    });

    // notify appointments starting soon
    nodeCron.schedule("*/5 * * * *", () => {
     appointmentNearNotification();
    });
};

export default handleCronJobs;
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
     
     const today = new Date();
     if(today.getDate() % 2 === 0) {
         initiatePayout();

     }
    }, {
        timezone: "America/New_York"
      });


    // notify appointments starting soon
    nodeCron.schedule("*/5 * * * *", () => {
     appointmentNearNotification();
    }, {
        timezone: "America/New_York"
      });
};

export default handleCronJobs;
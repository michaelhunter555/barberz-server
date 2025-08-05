import { Request, Response } from 'express';
import Bookings from '../../models/Booking';
import Stripe from 'stripe';
import Transaction from '../../models/Transaction';
import Chat from '../../models/Chat';
import Message from '../../models/Message';

export default async function cleanUpOldChats() {
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - THREE_DAYS_MS);
  
    try {
      // Find bookings that were completed more than 3 days ago
      const oldBookingIds = await Bookings.distinct('_id', {
        createdAt: { $lte: cutoffDate },
        bookingStatus: { $in: ['completed', 'expired'] },
      })
      
      if(oldBookingIds.length === 0) {
        console.log("Cron completed: no old chats to remove");
        return;
      }
      
      const validTransactionBookingIds = await Transaction.distinct('bookingId', {
        bookingId: { $in: oldBookingIds },
        createdAt: { $lte: cutoffDate },
        hasDispute: false,
        paymentType: { $in: ['full', 'final'] },
      });

      if(validTransactionBookingIds.length === 0) {
        console.log("Cron Complete: No valid transactions found.");
        return;
      }

      const chatIds = await Chat.distinct('_id', {
        bookingId: { $in: validTransactionBookingIds }
      });

      if(chatIds.length === 0) {
        console.log('Cron Complete: No chats to delete');
        return;
      }
  
      // Delete related messages and chats
      await Message.deleteMany({ chatId: { $in: chatIds } });
      await Chat.deleteMany({ _id: { $in: chatIds } });
  
      console.log(`Cron Complete: Deleted ${chatIds.length} chats and related messages.`);
    } catch (err) {
      console.error("Cron Error:", err);
    }
  }
  
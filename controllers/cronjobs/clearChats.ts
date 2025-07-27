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
      const oldBookings = await Bookings.find({
        createdAt: { $lte: cutoffDate },
        bookingStatus: { $in: ['completed', 'expired'] },
      });
  
      const oldBookingIds = oldBookings.map((b) => b._id);
  
      if (oldBookingIds.length === 0) {
        console.log("Cron Complete: No old bookings found.");
        return;
      }
  
      // Find associated transactions with full or final payments and no dispute
      const transactions = await Transaction.find({
        bookingId: { $in: oldBookingIds },
        createdAt: { $lte: cutoffDate },
        hasDispute: false,
        paymentType: { $in: ['full', 'final'] },
      });
  
      const transactionBookingIds = transactions.map((t) => t.bookingId);
  
      if (transactionBookingIds.length === 0) {
        console.log("Cron Complete: No valid transactions found.");
        return;
      }
  
      // Find chats linked to those transactions
      const chats = await Chat.find({
        bookingId: { $in: transactionBookingIds },
      });
  
      if (chats.length === 0) {
        console.log("Cron Complete: No chats to delete.");
        return;
      }
  
      const chatIds = chats.map((chat) => chat._id);
  
      // Delete related messages and chats
      await Message.deleteMany({ chatId: { $in: chatIds } });
      await Chat.deleteMany({ _id: { $in: chatIds } });
  
      console.log(`Cron Complete: Deleted ${chats.length} chats and related messages.`);
    } catch (err) {
      console.error("Cron Error:", err);
    }
  }
  
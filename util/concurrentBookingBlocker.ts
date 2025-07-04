// const overlappingBooking = await Booking.findOne({
//     barberId,
//     bookingDateAndTime,
//     bookingStatus: { $in: ['pending', 'confirmed'] }
//   }).session(session);
  
//   if (overlappingBooking) {
//     throw new Error('Time slot already taken');
//   }
  
export function getBookingDateTime(dateStr: string, timeStr: string): Date | null {
    try {
      // Clean the date: "on July 1st, 2025" → "July 1 2025"
      const cleanDate = dateStr
        .replace(/^on\s+/, '') // remove "on "
        .replace(/(\d+)(st|nd|rd|th)/, '$1') // remove ordinal suffixes
        .replace(',', ''); // remove comma
  
      // Clean the time: "5:00 PM-6:00 PM" → "5:00 PM"
      const startTime = timeStr
        .split('-')[0]
        .replace(/\u202F/g, ' ') // replace narrow no-break space with normal space
        .replace(/\s+/g, ' ') // collapse multiple spaces
        .trim();
  
      const dateTimeStr = `${cleanDate} ${startTime}`;
      const date = new Date(dateTimeStr);
  
      console.log('Parsed date string:', dateTimeStr);
      if (isNaN(date.getTime())) {
        return null;
      }
  
      return date;
    } catch (err) {
      return null;
    }
  }
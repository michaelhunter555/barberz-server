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

  export const formatDateString = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
  
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
  
    const getOrdinal = (n: number) => {
      if (n > 3 && n < 21) return `${n}th`;
      switch (n % 10) {
        case 1: return `${n}st`;
        case 2: return `${n}nd`;
        case 3: return `${n}rd`;
        default: return `${n}th`;
      }
    };
  
    return `on ${months[month - 1]} ${getOrdinal(day)}, ${year}`;
  };

  export const formatToAMPM = (hour: number, minute: number): string => {
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };
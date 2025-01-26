// utils/formatDate.js
import { format } from 'date-fns';

export const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  
  const date = new Date(timestamp.seconds * 1000); // Convert seconds to milliseconds
  return format(date, 'd MMM, yyyy, hh:mm a'); // Format as "20 Aug, 2025, 06:20 PM"
};

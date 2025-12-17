import { format } from 'date-fns';

export const getMonthKey = (date: Date): string => {
  return format(date, 'yyyy-MM');
};

export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

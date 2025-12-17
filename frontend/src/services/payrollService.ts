import { supabase } from '../config/supabaseClient';
import { PayrollSlip } from '../types';

export const getPayrollSlips = async (userId: string): Promise<PayrollSlip[]> => {
  try {
    const { data, error } = await supabase
      .from('payroll')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) {
      console.error('Error fetching payroll:', error.message);
      return [];
    }

    return (data || []).map((record: any) => ({
      id: record.id,
      month: record.month,
      year: record.year,
      amount: record.amount,
      status: record.status,
      pdfUrl: record.pdf_url
    })) as PayrollSlip[];
  } catch (err: any) {
    console.error('Unexpected error in getPayrollSlips:', err.message || err);
    return [];
  }
};

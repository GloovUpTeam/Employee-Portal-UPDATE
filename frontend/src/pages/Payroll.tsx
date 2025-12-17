import React, { useState, useEffect } from 'react';
import { Download, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { PayrollSlip } from '../types';
import { useAuth } from '../context/AuthContext';
import { getPayrollSlips } from '../services/payrollService';

const formatINR = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
};

const Payroll: React.FC = () => {
  const { user } = useAuth();
  const [slips, setSlips] = useState<PayrollSlip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayroll = async () => {
      if (!user) return;
      setLoading(true);
      const data = await getPayrollSlips(user.id);
      setSlips(data);
      setLoading(false);
    };
    fetchPayroll();
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading payroll data...</div>;
  }
  
  if (slips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
        <AlertCircle size={48} />
        <p>No payroll records found.</p>
      </div>
    );
  }

  const latestSlip = slips[0];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Payroll</h2>

      {/* Latest Slip Card */}
      <div className="bg-gradient-to-r from-[#1DCD9C]/20 to-[#1DCD9C]/5 border border-[#1DCD9C]/30 rounded-xl p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-400 text-sm mb-1">Latest Salary ({latestSlip.month} {latestSlip.year})</p>
            <h3 className="text-3xl font-bold text-white">{formatINR(latestSlip.amount)}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <TrendingUp size={12} /> Paid on time
              </span>
            </div>
          </div>
          <button className="bg-[#1DCD9C] text-black p-3 rounded-lg hover:bg-[#1abe90] transition-colors">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-[#222] rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="font-bold text-white">Payment History</h3>
        </div>
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-[#1a1a1a] text-gray-200 uppercase font-bold">
            <tr>
              <th className="p-4">Month</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Slip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {slips.map((slip) => (
              <tr key={slip.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-medium text-white">{slip.month} {slip.year}</td>
                <td className="p-4">{formatINR(slip.amount)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    slip.status === 'Paid' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {slip.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-[#1DCD9C] hover:text-white transition-colors">
                    <Download size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payroll;

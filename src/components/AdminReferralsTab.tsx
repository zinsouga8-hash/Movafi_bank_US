import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Gift, Users, Award, CheckCircle, Clock, XCircle, Search } from 'lucide-react';
import { formatDateTime } from '../utils/formatters';

export const AdminReferralsTab: React.FC = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadReferrals = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getReferrals();
      if (res.success && res.referrals) {
        setReferrals(res.referrals);
      }
    } catch (err: any) {
      console.warn('Load referrals error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, []);

  const filtered = referrals.filter(
    (r) =>
      r.referred_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referral_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-500" />
            <span>Gestion du Programme de Parrainage</span>
          </h3>
          <p className="text-xs text-slate-400">
            Suivi des invitations, vérification des comptes parrainés et attribution des points Privilège.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par e-mail ou code..."
              className="pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-hidden"
            />
          </div>
          <button
            type="button"
            onClick={loadReferrals}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 cursor-pointer"
          >
            Actualiser
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Filleul (Invité)</th>
              <th className="py-3 px-4">Code Parrainage</th>
              <th className="py-3 px-4">Statut</th>
              <th className="py-3 px-4 text-right">Points Récompense</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-mono">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 text-xs font-sans">
                  Aucun parrainage enregistré pour le moment.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 text-slate-400">{formatDateTime(item.created_at)}</td>
                  <td className="py-3 px-4 font-sans text-white font-semibold">{item.referred_email}</td>
                  <td className="py-3 px-4 text-amber-400 font-bold">{item.referral_code}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase ${
                      item.status === 'referral_validated' || item.status === 'account_approved'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : item.status === 'referral_rejected'
                        ? 'bg-rose-500/15 text-rose-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-white font-bold">{item.reward_points || 25} pts</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

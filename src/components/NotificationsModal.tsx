import React, { useState } from 'react';
import { NotificationItem } from '../types/banking';
import { api } from '../services/api';
import { formatDateTime } from '../utils/formatters';
import {
  Bell,
  CheckCheck,
  ShieldCheck,
  CreditCard,
  PiggyBank,
  ArrowLeftRight,
  Info,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onRefresh: () => Promise<void>;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onRefresh
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [markingId, setMarkingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Toutes' },
    { id: 'transaction', label: 'Finances' },
    { id: 'card', label: 'Cartes' },
    { id: 'loan', label: 'Prêts' },
    { id: 'security', label: 'Sécurité' },
    { id: 'admin', label: 'Administratif' }
  ];

  const filtered = notifications.filter((n) => {
    if (selectedCategory === 'all') return true;
    return n.type === selectedCategory || n.category === selectedCategory;
  });

  const handleMarkAsRead = async (id: string) => {
    setMarkingId(id);
    try {
      await api.markNotificationAsRead(id);
      await onRefresh();
    } catch (e) {
      console.warn(e);
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAll = async () => {
    try {
      await api.markAllNotificationsAsRead();
      await onRefresh();
    } catch (e) {
      console.warn(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return <ArrowLeftRight className="w-4 h-4 text-emerald-400" />;
      case 'card':
        return <CreditCard className="w-4 h-4 text-amber-400" />;
      case 'loan':
        return <PiggyBank className="w-4 h-4 text-sky-400" />;
      case 'security':
        return <ShieldCheck className="w-4 h-4 text-indigo-400" />;
      case 'warning':
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      default:
        return <Info className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[85vh] rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col space-y-4 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Centre de Notifications & Alertes</h3>
              <span className="text-xs text-slate-400">
                {notifications.filter((n) => !n.is_read).length} non lue(s)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAll}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-amber-400 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tout marquer lu</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Aucune notification dans cette catégorie.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  item.is_read
                    ? 'bg-slate-950/60 border-slate-800/60 text-slate-400'
                    : 'bg-slate-950 border-amber-500/30 text-white shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-bold text-white block">{item.title}</strong>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.message}</p>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      {formatDateTime(item.created_at)}
                    </span>
                  </div>
                </div>

                {!item.is_read && (
                  <button
                    type="button"
                    disabled={markingId === item.id}
                    onClick={() => handleMarkAsRead(item.id)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 cursor-pointer shrink-0"
                    title="Marquer comme lu"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

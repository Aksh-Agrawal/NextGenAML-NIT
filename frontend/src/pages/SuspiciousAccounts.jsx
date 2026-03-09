import React from 'react';
import GlassCard from '../components/GlassCard';
import { Search, Filter, MoreVertical, AlertCircle, ShieldCheck, ExternalLink } from 'lucide-react';

const accounts = [
    { id: 'ACC-8293-X1', risk: 92, transactions: 142, pattern: 'Structuring', status: 'Flagged', volume: '$1.2M' },
    { id: 'ACC-1029-Y4', risk: 85, transactions: 89, pattern: 'Circular Flow', status: 'Under Review', volume: '$840K' },
    { id: 'ACC-5521-Z2', risk: 78, transactions: 215, pattern: 'Rapid Movement', status: 'Flagged', volume: '$2.1M' },
    { id: 'ACC-9902-A8', risk: 15, transactions: 12, pattern: 'Normal', status: 'Verified', volume: '$45K' },
    { id: 'ACC-3341-B9', risk: 65, transactions: 54, pattern: 'Abnormal Transfer', status: 'Under Review', volume: '$320K' },
    { id: 'ACC-4410-C3', risk: 98, transactions: 310, pattern: 'Shell Linkage', status: 'Critical', volume: '$5.5M' },
    { id: 'ACC-7728-D5', risk: 42, transactions: 34, pattern: 'Normal', status: 'Verified', volume: '$120K' },
];

const SuspiciousAccounts = () => {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-bold gold-text-shimmer mb-2">Suspicious Entities</h2>
                    <p className="text-slate-400 text-sm tracking-wide">Detailed list of accounts flagged for high-risk transactional behavior.</p>
                </div>
                <div className="flex space-x-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search by ID or Pattern..."
                            className="pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-royal-gold/50 transition-colors w-64"
                        />
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-royal-gold hover:bg-glass-gold transition-colors flex items-center space-x-2">
                        <Filter size={16} />
                        <span>Advanced Filters</span>
                    </button>
                </div>
            </div>

            <GlassCard className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Account ID</th>
                                <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Risk Score</th>
                                <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Pattern Detected</th>
                                <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Volume (30d)</th>
                                <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Status</th>
                                <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((acc, idx) => (
                                <tr key={acc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${acc.risk > 80 ? 'bg-fraud-red/10 text-fraud-red' : 'bg-royal-gold/10 text-royal-gold'
                                                }`}>
                                                {acc.id.charAt(0)}
                                            </div>
                                            <span className="text-sm font-bold text-white group-hover:text-royal-gold transition-colors">{acc.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="flex-1 h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${acc.risk > 80 ? 'bg-fraud-red' : acc.risk > 50 ? 'bg-royal-gold' : 'bg-soft-blue'}`}
                                                    style={{ width: `${acc.risk}%` }}
                                                ></div>
                                            </div>
                                            <span className={`text-xs font-bold ${acc.risk > 80 ? 'text-fraud-red' : 'text-slate-300'}`}>{acc.risk}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-slate-400">{acc.pattern}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-white">{acc.volume}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${acc.status === 'Critical' ? 'bg-fraud-red/20 text-fraud-red border border-fraud-red/30' :
                                                acc.status === 'Flagged' ? 'bg-fraud-red/10 text-fraud-red/70' :
                                                    acc.status === 'Under Review' ? 'bg-royal-gold/20 text-royal-gold' :
                                                        'bg-emerald-500/20 text-emerald-500'
                                            }`}>
                                            {acc.status === 'Verified' && <ShieldCheck size={10} className="mr-1" />}
                                            {acc.status === 'Critical' && <AlertCircle size={10} className="mr-1" />}
                                            {acc.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-royal-gold transition-colors">
                                                <ExternalLink size={16} />
                                            </button>
                                            <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-white/[0.01] flex items-center justify-between">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Showing 7 of 1,248 high-risk entities</p>
                    <div className="flex space-x-2">
                        <button className="px-3 py-1 rounded border border-white/5 text-[10px] text-slate-500 hover:border-royal-gold transition-colors">Prev</button>
                        <button className="px-3 py-1 rounded border border-royal-gold/50 text-[10px] text-royal-gold bg-glass-gold">1</button>
                        <button className="px-3 py-1 rounded border border-white/5 text-[10px] text-slate-500 hover:border-royal-gold transition-colors">Next</button>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};

export default SuspiciousAccounts;

import React from 'react';
import GlassCard from '../components/GlassCard';
import {
    FileText,
    Download,
    Search,
    Filter,
    Calendar,
    ExternalLink,
    ChevronRight,
    ShieldCheck,
    Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

const reports = [
    { id: 'RPT-2025-001', title: 'Monthly AML Compliance Audit', type: 'System Audit', date: 'March 01, 2026', size: '2.4 MB', status: 'Ready' },
    { id: 'RPT-2025-002', title: 'Suspicious Activity Summary - Q1', type: 'Intelligence', date: 'Feb 28, 2026', size: '1.1 MB', status: 'Ready' },
    { id: 'RPT-2025-003', title: 'Cross-Border Fund Flow Analysis', type: 'Analytical', date: 'Feb 25, 2026', size: '4.8 MB', status: 'Processing' },
    { id: 'RPT-2025-004', title: 'High-Value Entity Risk Report', type: 'Risk Assessment', date: 'Feb 20, 2026', size: '920 KB', status: 'Ready' },
    { id: 'RPT-2025-005', title: 'Shell Network Topology Mapping', type: 'Investigation', date: 'Feb 15, 2026', size: '12.5 MB', status: 'Archived' },
    { id: 'RPT-2025-006', title: 'Protocol Verification Logistics', type: 'System Audit', date: 'Feb 10, 2026', size: '540 KB', status: 'Ready' },
];

const Reports = () => {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-bold gold-text-shimmer mb-2">Reports & Intelligence</h2>
                    <p className="text-slate-400 text-sm tracking-wide">Secure documentation and generated insights for FIU protocols.</p>
                </div>
                <div className="flex space-x-3">
                    <button className="px-6 py-2 rounded-lg bg-gold-gradient text-royal-navy font-bold text-sm shadow-gold-glow flex items-center space-x-2 active:scale-95 transition-transform">
                        <FileText size={18} />
                        <span>Request Custom Report</span>
                    </button>
                </div>
            </div>

            {/* Stats / Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-royal-gold/10 text-royal-gold">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Verified Reports</p>
                        <h4 className="text-xl font-bold text-white">1,248</h4>
                    </div>
                </GlassCard>
                <GlassCard className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-soft-blue/10 text-soft-blue">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Generated (30d)</p>
                        <h4 className="text-xl font-bold text-white">42</h4>
                    </div>
                </GlassCard>
                <GlassCard className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-fraud-red/10 text-fraud-red">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Awaiting Review</p>
                        <h4 className="text-xl font-bold text-white">03</h4>
                    </div>
                </GlassCard>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <GlassCard title="Filters" subtitle="Narrow down archive">
                        <div className="space-y-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search files..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs focus:outline-none focus:border-royal-gold/50 transition-colors"
                                />
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Classification</p>
                                {['All Classifications', 'Intelligence', 'System Audit', 'Risk Assessment', 'Investigation'].map((type, i) => (
                                    <div key={type} className="flex items-center space-x-2 group cursor-pointer">
                                        <div className={`w-3 h-3 rounded border ${i === 0 ? 'bg-royal-gold border-royal-gold' : 'border-white/20 group-hover:border-royal-gold/50'}`}></div>
                                        <span className={`text-xs ${i === 0 ? 'text-white font-medium' : 'text-slate-400 group-hover:text-slate-300'}`}>{type}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Date Range</p>
                                <button className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 flex items-center justify-between">
                                    <span>Last 90 Days</span>
                                    <ChevronRight size={14} className="rotate-90" />
                                </button>
                            </div>

                            <button className="w-full py-2 rounded-lg border border-white/10 text-[10px] font-bold uppercase tracking-widest text-royal-gold hover:bg-glass-gold transition-colors">
                                Reset All Filters
                            </button>
                        </div>
                    </GlassCard>
                </div>

                {/* Report List */}
                <div className="lg:col-span-3 space-y-4">
                    {reports.map((report, index) => (
                        <motion.div
                            key={report.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <GlassCard className="p-4 hover:border-royal-gold/30 transition-all group cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${report.status === 'Processing' ? 'bg-white/5 text-slate-500' : 'bg-royal-gold/10 text-royal-gold group-hover:bg-royal-gold group-hover:text-royal-navy'
                                            }`}>
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-white mb-1 group-hover:text-royal-gold transition-colors">{report.title}</h4>
                                            <div className="flex items-center space-x-3 text-[10px] uppercase tracking-widest font-medium text-slate-500">
                                                <span>{report.id}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                <span className="text-soft-blue">{report.type}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                <span>{report.date}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-6">
                                        <div className="text-right mr-4 hidden md:block">
                                            <p className="text-xs font-bold text-slate-300">{report.size}</p>
                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${report.status === 'Ready' ? 'text-emerald-500' :
                                                    report.status === 'Processing' ? 'text-royal-gold animate-pulse' :
                                                        'text-slate-500'
                                                }`}>
                                                {report.status}
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-royal-gold transition-colors">
                                                <Download size={18} />
                                            </button>
                                            <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors">
                                                <ExternalLink size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}

                    <div className="flex justify-center mt-8">
                        <button className="px-8 py-3 rounded-xl border border-dashed border-white/10 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-royal-gold hover:border-royal-gold/50 transition-all">
                            Load Older Archives
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;

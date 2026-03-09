import React from 'react';
import GlassCard from '../components/GlassCard';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    ShieldQuestion,
    Search,
    Clock
} from 'lucide-react';

const events = [
    {
        id: 1,
        time: '09:12 AM',
        date: 'Oct 24, 2025',
        type: 'origin',
        title: 'Initial Deposit',
        description: 'Wire transfer of $450,000.00 from offshore entity "Skyline Ltd".',
        location: 'Cayman Islands',
        status: 'unverified'
    },
    {
        id: 2,
        time: '10:45 AM',
        date: 'Oct 24, 2025',
        type: 'split',
        title: 'Structuring Detected',
        description: 'Fund split into 15 smaller transactions under $10,000 threshold.',
        location: 'Internal Ledger',
        status: 'alert'
    },
    {
        id: 3,
        time: '02:15 PM',
        date: 'Oct 24, 2025',
        type: 'flow',
        title: 'Cross-Border Move',
        description: 'Consolidated funds moved to Account: ACC_9283_B4 (Pacific Trade).',
        location: 'Singapore',
        status: 'flagged'
    },
    {
        id: 4,
        time: '09:00 AM',
        date: 'Oct 25, 2025',
        type: 'exit',
        title: 'Final Disbursement',
        description: 'Withdrawal at ATM network and luxury asset purchase.',
        location: 'London, UK',
        status: 'critical'
    }
];

const TimelineItem = ({ event, index }) => {
    const isLast = index === events.length - 1;

    const getStatusIcon = (status) => {
        switch (status) {
            case 'unverified': return <ShieldQuestion className="text-slate-500" size={16} />;
            case 'alert': return <AlertTriangle className="text-royal-gold" size={16} />;
            case 'flagged': return <AlertTriangle className="text-fraud-red" size={16} />;
            case 'critical': return <AlertTriangle className="text-fraud-red animate-pulse" size={16} />;
            default: return <CheckCircle2 className="text-emerald-500" size={16} />;
        }
    };

    return (
        <div className="flex group">
            <div className="flex flex-col items-center mr-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${event.status === 'critical' ? 'border-fraud-red bg-fraud-red/10 shadow-red-glow' :
                        event.status === 'alert' ? 'border-royal-gold bg-royal-gold/10' :
                            'border-white/10 bg-white/5'
                    }`}>
                    {getStatusIcon(event.status)}
                </div>
                {!isLast && <div className="w-px h-full bg-gradient-to-b from-white/10 to-transparent my-2"></div>}
            </div>
            <div className="pb-12 flex-1">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{event.date} • {event.time}</span>
                        <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                            <MapPin size={10} className="text-royal-gold" />
                            <span className="text-[10px] text-slate-400 font-medium">{event.location}</span>
                        </div>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2 group-hover:text-royal-gold transition-colors">{event.title}</h4>
                    <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">{event.description}</p>

                    <div className="mt-4 flex items-center space-x-3">
                        <button className="text-[10px] font-bold uppercase tracking-widest text-royal-gold flex items-center space-x-1 hover:underline">
                            <span>View Digital Evidence</span>
                            <ArrowRight size={12} />
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

const InvestigationTimeline = () => {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-bold gold-text-shimmer mb-2">Investigation Hub</h2>
                    <p className="text-slate-400 text-sm tracking-wide">Multi-hop fund journey reconstruction and evidentiary timeline.</p>
                </div>
                <div className="flex space-x-3">
                    <button className="px-6 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-royal-gold hover:bg-glass-gold transition-colors flex items-center space-x-2">
                        <Search size={16} />
                        <span>Trace Transaction ID</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <GlassCard className="lg:col-span-3">
                    <div className="p-4">
                        {events.map((event, index) => (
                            <TimelineItem key={event.id} event={event} index={index} />
                        ))}
                    </div>
                </GlassCard>

                <div className="lg:col-span-1 space-y-6">
                    <GlassCard title="Case Meta" variant="gold">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Subject Entity</p>
                                <p className="text-sm font-bold text-white">Global Holdings APAC</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Total At-Risk Value</p>
                                <p className="text-xl font-bold text-royal-gold">$12,450,000.00</p>
                            </div>
                            <hr className="border-white/10" />
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Lead Investigator</p>
                                <p className="text-sm text-slate-300">Agent D. Richards (FIU)</p>
                            </div>
                            <button className="w-full py-3 rounded-xl bg-gold-gradient text-royal-navy font-bold text-xs uppercase tracking-widest shadow-gold-glow">
                                Generate Case Report
                            </button>
                        </div>
                    </GlassCard>

                    <GlassCard title="Quick Intel">
                        <div className="flex items-start space-x-3 p-3 rounded-lg bg-fraud-red/5 border border-fraud-red/10">
                            <Clock className="text-fraud-red shrink-0 mt-1" size={16} />
                            <p className="text-xs text-slate-300">Fund velocity is 3.5x higher than historical average for this entity.</p>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};

export default InvestigationTimeline;

import React from 'react';
import {
    TrendingUp,
    AlertTriangle,
    Users,
    ShieldAlert,
    ArrowUpRight,
    ArrowDownRight,
    Activity
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { motion } from 'framer-motion';

const MetricCard = ({ icon: Icon, label, value, trend, colorClass }) => (
    <GlassCard className="relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 rounded-full transition-all duration-500 group-hover:opacity-20 ${colorClass}`}></div>
        <div className="flex items-start justify-between">
            <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-1">{label}</p>
                <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${colorClass.replace('bg-', 'text-')}`}>
                <Icon size={24} />
            </div>
        </div>
        <div className="mt-4 flex items-center space-x-2">
            {trend > 0 ? (
                <span className="flex items-center text-emerald-400 text-xs font-medium">
                    <ArrowUpRight size={14} className="mr-1" /> +{trend}%
                </span>
            ) : (
                <span className="flex items-center text-fraud-red text-xs font-medium">
                    <ArrowDownRight size={14} className="mr-1" /> {trend}%
                </span>
            )}
            <span className="text-slate-500 text-[10px] uppercase tracking-wider">vs last 30 days</span>
        </div>
    </GlassCard>
);

const RiskMeter = ({ score }) => {
    const rotation = (score / 100) * 180 - 90;
    const getColor = () => {
        if (score < 30) return '#4FA3FF';
        if (score < 70) return '#D4AF37';
        return '#FF4C4C';
    };

    return (
        <div className="relative flex flex-col items-center justify-center p-8 h-full">
            <svg className="w-48 h-24" viewBox="0 0 100 50">
                <path
                    d="M 10 45 A 40 40 0 0 1 90 45"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="8"
                    strokeLinecap="round"
                />
                <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: score / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    d="M 10 45 A 40 40 0 0 1 90 45"
                    fill="none"
                    stroke={getColor()}
                    strokeWidth="8"
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                />
            </svg>
            <div className="absolute bottom-8 text-center pt-2">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-4xl font-bold text-white"
                >
                    {score}
                </motion.div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: getColor() }}>
                    {score < 30 ? 'Low Risk' : score < 70 ? 'Moderate' : 'Critical'}
                </p>
            </div>
            <div className="mt-2 text-center">
                <p className="text-slate-400 text-xs mt-4">Average System Risk Score</p>
            </div>
        </div>
    );
};

const Dashboard = () => {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-bold gold-text-shimmer mb-2">Central Intelligence</h2>
                    <p className="text-slate-400 text-sm tracking-wide">Live monitoring of global financial fund flows and entity risk.</p>
                </div>
                <div className="flex space-x-3">
                    <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 flex items-center space-x-2">
                        <Activity className="text-royal-gold" size={16} />
                        <span className="text-xs font-medium">Real-time Feed</span>
                    </div>
                    <button className="px-6 py-2 rounded-lg bg-gold-gradient text-royal-navy font-bold text-sm shadow-gold-glow hover:scale-105 transition-transform">
                        Manual Audit
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    icon={TrendingUp}
                    label="Total Transactions"
                    value="$4.2B"
                    trend={12.5}
                    colorClass="bg-royal-gold"
                />
                <MetricCard
                    icon={AlertTriangle}
                    label="Flagged Amount"
                    value="$128.4M"
                    trend={-5.2}
                    colorClass="bg-fraud-red"
                />
                <MetricCard
                    icon={Users}
                    label="High Risk Entities"
                    value="1,248"
                    trend={8.1}
                    colorClass="bg-soft-blue"
                />
                <MetricCard
                    icon={ShieldAlert}
                    label="Active Cases"
                    value="42"
                    trend={2.4}
                    colorClass="bg-royal-gold"
                />
            </div>

            {/* Main Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <GlassCard title="System Risk Index" className="lg:col-span-1">
                    <RiskMeter score={68} />
                </GlassCard>

                <GlassCard title="Recent Activity" className="lg:col-span-2">
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-royal-gold/30 transition-colors group">
                                <div className="flex items-center space-x-4">
                                    <div className={`w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-fraud-red shadow-[0_0_8px_#FF4C4C]' : 'bg-royal-gold'}`}></div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white group-hover:text-royal-gold transition-colors">ACC_TRX_92834{i}</h4>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Structuring pattern detected in SWIFT transfer</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-white">$12,400.00</p>
                                    <p className="text-[10px] text-slate-500 uppercase">2 mins ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 py-3 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-[0.2em] text-royal-gold hover:bg-glass-gold transition-colors">
                        View Intelligence Feed
                    </button>
                </GlassCard>
            </div>
        </div>
    );
};

export default Dashboard;

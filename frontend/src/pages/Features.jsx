import React from 'react';
import { motion } from 'framer-motion';
import {
    Network,
    ShieldAlert,
    Users,
    Clock,
    BarChart3,
    FileCheck,
    Zap,
    ChevronRight
} from 'lucide-react';
import GlassCard from '../components/GlassCard';

const ToolPreview = ({ icon: Icon, title, description, features, imageAlt }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-20">
        <div className="space-y-8">
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-royal-gold/10 text-royal-gold flex items-center justify-center">
                    <Icon size={24} />
                </div>
                <h3 className="text-3xl font-playfair font-bold text-white">{title}</h3>
            </div>
            <p className="text-slate-400 text-lg leading-relaxed">
                {description}
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((f, i) => (
                    <li key={i} className="flex items-center space-x-3 text-xs font-bold text-slate-300 uppercase tracking-widest">
                        <Zap size={14} className="text-royal-gold" />
                        <span>{f}</span>
                    </li>
                ))}
            </ul>
        </div>
        <GlassCard className="aspect-video relative overflow-hidden group border-royal-gold/20">
            <div className="absolute inset-0 bg-gold-gradient opacity-5 group-hover:opacity-10 transition-opacity"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center text-slate-700 font-mono text-[10px] uppercase tracking-[0.5em] pointer-events-none">
                    Display Terminal Interface: {imageAlt}
                </div>
            </div>
        </GlassCard>
    </div>
);

const Features = () => {
    return (
        <div className="pt-32 px-8 max-w-7xl mx-auto pb-32">
            <div className="text-center space-y-6 mb-24">
                <h1 className="text-5xl md:text-7xl font-playfair font-bold gold-text-shimmer">Intelligence Hub</h1>
                <p className="text-slate-500 uppercase tracking-[0.3em] text-xs font-bold">Deep Diving into Platform Capabilities</p>
            </div>

            <ToolPreview
                icon={Network}
                title="Interactive Fund Flow Map"
                description="Visualize the complex web of financial interaction. Our D3-powered graph network allows for deep-dive analysis of account relationships and asset trajectories."
                features={['Force-Directed Layout', 'Real-time Flow Animation', 'Node Path Isolation', 'Volume-based Scalability']}
                imageAlt="GRAPH_ENGINE_v4"
            />

            <ToolPreview
                icon={ShieldAlert}
                title="Fraud Risk Scoring"
                description="Instantaneous evaluation of entity risk based on transaction frequency, structural anomalies, and historical KYC metadata."
                features={['AI Behavioral Alerts', 'Centrality Risk Analysis', 'Threshold Management', 'Categorical Leveling']}
                imageAlt="RISK_TELEMETRY_TERMINAL"
            />

            <ToolPreview
                icon={Clock}
                title="Investigation Timeline"
                description="Reconstruct the journey of every asset chronologically. Track entry points, intermediate node layering, and final asset termination steps."
                features={['Temporal Analysis', 'Flow Replay', 'Multi-Node Comparison', 'Evidence Splicing']}
                imageAlt="TEMPORAL_JOURNEY_MAP"
            />

            <ToolPreview
                icon={BarChart3}
                title="Analytics Dashboard"
                description="Comprehensive data summaries for senior management and regular audit protocols. Keep a pulse on system-wide risk trends."
                features={['Pattern Distribution', 'Trend Forecasting', 'High-Risk Geo-Mapping', 'Custom KPI Tracking']}
                imageAlt="ANALYTICS_CORE_UI"
            />

            <div className="mt-32">
                <GlassCard className="p-16 text-center bg-royal-gold/5 border-royal-gold/30">
                    <h2 className="text-4xl font-playfair font-bold mb-8 italic">Ready to see these tools in action?</h2>
                    <button className="px-10 py-4 rounded-xl bg-gold-gradient text-royal-navy font-bold text-sm uppercase tracking-widest shadow-gold-glow-large hover:scale-105 active:scale-95 transition-all">
                        Request a Deep Dive Demo
                    </button>
                </GlassCard>
            </div>
        </div>
    );
};

export default Features;

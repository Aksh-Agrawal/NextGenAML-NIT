import React from 'react';
import { Shield, Globe, ShieldCheck, Database, Layout, Clock, Activity, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import GlassCard from '../components/GlassCard';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.6 }}
    >
        <GlassCard className="h-full group hover:border-royal-gold/40 transition-all p-8">
            <div className="w-14 h-14 rounded-2xl bg-royal-gold/10 text-royal-gold flex items-center justify-center mb-6 group-hover:bg-royal-gold group-hover:text-royal-navy transition-all duration-500">
                <Icon size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-4 group-hover:text-royal-gold transition-colors">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        </GlassCard>
    </motion.div>
);

const Landing = () => {
    return (
        <div className="relative overflow-hidden">
            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 space-y-8 max-w-5xl"
                >
                    <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-royal-gold/10 border border-royal-gold/20 text-royal-gold text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-royal-gold animate-pulse"></span>
                        <span>Next-Gen Financial Intelligence</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-playfair font-bold leading-tight">
                        Tracking Funds with <br />
                        <span className="gold-text-shimmer italic">Precision Intelligence</span>
                    </h1>

                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                        The elite platform for detecting circular transactions, layering patterns, and financial anomalies through advanced graph neuro-analytics.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-6">
                        <Link
                            to="/dashboard"
                            className="px-10 py-4 rounded-xl bg-gold-gradient text-royal-navy font-bold text-sm uppercase tracking-widest shadow-gold-glow-large hover:scale-105 transition-transform"
                        >
                            Access Command Center
                        </Link>
                        <Link
                            to="/features"
                            className="px-10 py-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-white font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                            Explore Intelligence Hub
                        </Link>
                    </div>
                </motion.div>

                {/* Floating Decorative Elements */}
                <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-royal-gold/5 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[20%] right-[10%] w-72 h-72 bg-soft-blue/5 blur-[120px] rounded-full"></div>
            </section>

            {/* Stats Section */}
            <section className="py-24 relative z-10 border-y border-white/5 bg-royal-navy/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                        {[
                            { val: '$4.2T+', label: 'Volume Analyzed' },
                            { val: '12M+', label: 'Accounts Monitored' },
                            { val: '24ms', label: 'Average Latency' },
                            { val: '99.9%', label: 'Pattern Accuracy' }
                        ].map((stat, i) => (
                            <div key={i} className="space-y-2">
                                <h4 className="text-4xl md:text-5xl font-playfair font-bold gold-text-shimmer tracking-tight">{stat.val}</h4>
                                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-32 px-8 relative z-10 max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6">Financial Defense Protocols</h2>
                    <p className="text-slate-500 uppercase tracking-widest text-xs font-bold">Comprehensive Tools for Multi-Layered Intelligence</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={Globe}
                        delay={0.1}
                        title="Fund Flow Visualization"
                        description="Real-time multi-dimensional graph mapping of transaction trajectories across global boundaries."
                    />
                    <FeatureCard
                        icon={ShieldCheck}
                        delay={0.2}
                        title="Fraud Pattern Detection"
                        description="AI-driven recognition of circular flows, structuring, and rapid layering behavior patterns."
                    />
                    <FeatureCard
                        icon={Activity}
                        delay={0.3}
                        title="Risk Telemetry"
                        description="Instantaneous risk scoring based on node centrality and behavioral historical data snapshots."
                    />
                    <FeatureCard
                        icon={Clock}
                        delay={0.4}
                        title="Investigation Timeline"
                        description="Chronological journey tracking of assets from entry point to terminal destination modules."
                    />
                    <FeatureCard
                        icon={Database}
                        delay={0.5}
                        title="Digital Evidence Logging"
                        description="Tamper-proof archiving of transactional evidence for FIU protocol compliance."
                    />
                    <FeatureCard
                        icon={FileText}
                        delay={0.6}
                        title="Intelligence Reporting"
                        description="Automated generation of detailed risk dossiers with visual network analysis exported instantly."
                    />
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-8 relative z-10">
                <GlassCard className="max-w-5xl mx-auto p-16 text-center border-royal-gold/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-royal-gold/10 blur-[100px] -mr-32 -mt-32"></div>
                    <h2 className="text-4xl md:text-6xl font-playfair font-bold mb-8 relative z-10">Ready to Secure the <br /> <span className="italic gold-text-shimmer">Future of Finance?</span></h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-12 relative z-10">
                        Join the elite financial institutions utilizing NextGenAML to automate their anti-money laundering and fraud detection ecosystems.
                    </p>
                    <Link
                        to="/login"
                        className="inline-block px-12 py-5 rounded-2xl bg-gold-gradient text-royal-navy font-bold text-sm uppercase tracking-widest shadow-gold-glow-large hover:scale-110 active:scale-95 transition-all relative z-10"
                    >
                        Initiate System Access
                    </Link>
                </GlassCard>
            </section>
        </div>
    );
};

export default Landing;

import React from 'react';
import { Shield, Globe, Terminal, Cpu, Network, Lock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';

const InfoSection = ({ title, content, icon: Icon, reverse = false }) => (
    <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-16 py-24`}>
        <div className="flex-1 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-royal-gold/10 text-royal-gold flex items-center justify-center mb-2">
                <Icon size={32} />
            </div>
            <h2 className="text-4xl font-playfair font-bold text-white">{title}</h2>
            <div className="space-y-4 text-slate-400 leading-relaxed text-lg">
                {content.map((p, i) => <p key={i}>{p}</p>)}
            </div>
        </div>
        <div className="flex-1 w-full">
            <GlassCard className="aspect-video relative overflow-hidden flex items-center justify-center border-royal-gold/20">
                <div className="absolute inset-0 bg-gold-gradient opacity-5"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full border-2 border-royal-gold/20 flex items-center justify-center animate-pulse">
                        <Network size={64} className="text-royal-gold" />
                    </div>
                    <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.3em] text-royal-gold">Neural Network Overlay</p>
                </div>
            </GlassCard>
        </div>
    </div>
);

const PatternCard = ({ title, description, code }) => (
    <GlassCard className="p-8 group hover:scale-[1.02] transition-transform">
        <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-bold text-white group-hover:text-royal-gold transition-colors">{title}</h4>
            <span className="text-[10px] font-mono text-royal-gold bg-royal-gold/10 px-3 py-1 rounded-full uppercase tracking-widest">{code}</span>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">{description}</p>
        <div className="pt-6 border-t border-white/5 flex items-center text-xs font-bold text-soft-blue uppercase tracking-widest">
            <span>AI Reliability: 99.7%</span>
            <Zap size={14} className="ml-2" />
        </div>
    </GlassCard>
);

const Information = () => {
    return (
        <div className="pt-32 px-8 max-w-7xl mx-auto space-y-32 pb-32">
            <div className="text-center space-y-6">
                <h1 className="text-5xl md:text-7xl font-playfair font-bold gold-text-shimmer">Operational Intelligence</h1>
                <p className="text-slate-500 uppercase tracking-[0.3em] text-xs font-bold font-inter">Architecting the Backbone of Financial Security</p>
            </div>

            <InfoSection
                title="System Architecture"
                content={[
                    "NextGenAML utilizes a decentralized node architecture to analyze cross-border transaction data in real-time. Our core engine, 'Atlas-1', processes millions of datapoints per second using quantum-resistant algorithms.",
                    "The platform integrates directly with bank mainframes, creating a virtualization layer that maps every account and fund movement into a multi-dimensional graph database (Neo4j/Cytoscape)."
                ]}
                icon={Terminal}
            />

            <div className="space-y-12">
                <div className="text-center">
                    <h2 className="text-3xl md:text-5xl font-playfair font-bold mb-4">Detected Fraud Patterns</h2>
                    <p className="text-slate-500 text-sm uppercase tracking-widest">Global Intelligence Database • v4.2.1 Stable</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <PatternCard
                        title="Circular Flows"
                        description="Detection of funds returning to the original source through a sequence of intermediate shell nodes."
                        code="PAT-001"
                    />
                    <PatternCard
                        title="Rapid Layering"
                        description="High-frequency transfers across multiple accounts to obscure the original audit trail and source."
                        code="PAT-002"
                    />
                    <PatternCard
                        title="Structuring (Smurfing)"
                        description="Systematic breakdown of large transfers into micro-transactions to bypass regulatory reporting thresholds."
                        code="PAT-003"
                    />
                    <PatternCard
                        title="Dormant Activation"
                        description="Sudden high-volume activity in long-inactive accounts, indicating potential entity hijacking or laundering."
                        code="PAT-004"
                    />
                </div>
            </div>

            <InfoSection
                reverse
                title="Predictive AI Scoring"
                content={[
                    "Our proprietary risk-scoring engine evaluates not just individual transactions, but the entire entity network. It calculates 'centrality risk' — how vital an account is to a potential fraud network.",
                    "By employing deep learning on historical fraud data, the system predicts suspicious behavior before it manifests into full-scale circular transfers, allowing for proactive fund freezing."
                ]}
                icon={Cpu}
            />
        </div>
    );
};

export default Information;

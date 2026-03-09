import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, Users, Code, Award, ChevronRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const TeamMember = ({ name, role, initial }) => (
    <div className="flex flex-col items-center group">
        <div className="w-24 h-24 rounded-full bg-gold-gradient p-1 mb-6 group-hover:scale-110 transition-transform duration-500">
            <div className="w-full h-full rounded-full bg-royal-navy flex items-center justify-center font-playfair text-3xl font-bold text-royal-gold">
                {initial}
            </div>
        </div>
        <h4 className="text-xl font-bold text-white mb-1">{name}</h4>
        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">{role}</p>
    </div>
);

const About = () => {
    return (
        <div className="pt-32 px-8 max-w-7xl mx-auto pb-32">
            {/* Hero */}
            <div className="text-center space-y-8 mb-32">
                <h1 className="text-5xl md:text-7xl font-playfair font-bold">Our <span className="gold-text-shimmer">Mission</span></h1>
                <p className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto font-light leading-relaxed">
                    At NextGenAML, we believe that the stability of the global financial system depends on radical transparency and intelligent defense architecture.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center mb-32">
                <div className="space-y-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {[
                            { icon: Target, title: 'Precision', desc: 'Granular tracking of individual asset trajectories.' },
                            { icon: Shield, title: 'Defense', desc: 'Proactive shielding against systemic fraud patterns.' },
                            { icon: Users, title: 'Collaboration', desc: 'Secure data sharing between verified intelligence units.' },
                            { icon: Award, title: 'Standards', desc: 'Compliant with international FIU investigation protocols.' }
                        ].map((item, i) => (
                            <div key={i} className="space-y-4">
                                <div className="w-10 h-10 rounded-xl bg-royal-gold/10 text-royal-gold flex items-center justify-center">
                                    <item.icon size={20} />
                                </div>
                                <h4 className="text-lg font-bold text-white">{item.title}</h4>
                                <p className="text-xs text-slate-500 leading-relaxed font-bold uppercase tracking-wider">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <GlassCard className="p-12 relative overflow-hidden border-royal-gold/20">
                    <div className="absolute inset-0 bg-gold-gradient opacity-5"></div>
                    <h3 className="text-2xl font-bold text-white mb-6">Why Fraud Detection Matters</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        In an era of instant global transfers, traditional AML methods are no longer sufficient. Money launderers exploit latency and complexity to hide illegal assets.
                    </p>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Our system closes these gaps by providing investigators with the same real-time tools used by the entities they track, leveling the playing field through superior network intelligence.
                    </p>
                </GlassCard>
            </div>

            <div className="text-center space-y-16">
                <div className="space-y-4">
                    <h2 className="text-4xl font-playfair font-bold">The Intellectual Command</h2>
                    <p className="text-slate-500 uppercase tracking-widest text-xs font-bold">The Minds Behind the Architecture</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                    <TeamMember name="Alex Sterling" role="Lead Architect" initial="AS" />
                    <TeamMember name="Elena Roth" role="AI Research" initial="ER" />
                    <TeamMember name="Marcus Vane" role="Security Protocol" initial="MV" />
                    <TeamMember name="Sasha Chen" role="Frontend Visuals" initial="SC" />
                </div>
            </div>
        </div>
    );
};

export default About;

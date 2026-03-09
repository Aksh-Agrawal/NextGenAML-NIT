import React from 'react';
import { Shield } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="relative z-10 py-20 px-8 border-t border-white/5 bg-royal-navy/30 backdrop-blur-md">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="col-span-1 md:col-span-2 space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-gold-gradient p-1.5 flex items-center justify-center shadow-gold-glow">
                            <Shield className="text-royal-navy" size={18} />
                        </div>
                        <h3 className="text-xl font-playfair font-bold text-white tracking-tight">NextGen<span className="text-royal-gold">AML</span></h3>
                    </div>
                    <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
                        The world's most advanced financial intelligence platform for detecting and neutralizing fraud networks in real-time.
                    </p>
                    <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">
                        © 2026 NEXTGENAML INTELLIGENCE • ALL RIGHTS RESERVED
                    </p>
                </div>

                <div className="space-y-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold">Intelligence Hub</h4>
                    <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                        <li className="hover:text-white transition-colors cursor-pointer">System Core</li>
                        <li className="hover:text-white transition-colors cursor-pointer">Risk Telemetry</li>
                        <li className="hover:text-white transition-colors cursor-pointer">Graph Engine</li>
                        <li className="hover:text-white transition-colors cursor-pointer">API Protocols</li>
                    </ul>
                </div>

                <div className="space-y-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold">System Security</h4>
                    <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                        <li className="hover:text-white transition-colors cursor-pointer">Login Terminal</li>
                        <li className="hover:text-white transition-colors cursor-pointer">Privacy Matrix</li>
                        <li className="hover:text-white transition-colors cursor-pointer">Audit Logs</li>
                        <li className="hover:text-white transition-colors cursor-pointer">Emergency Reset</li>
                    </ul>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

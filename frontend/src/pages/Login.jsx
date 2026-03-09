import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, Mail, Lock, ChevronRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const Login = () => {
    const [email, setEmail] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        window.location.href = '/dashboard';
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-10">
                    <div className="w-20 h-20 rounded-2xl bg-gold-gradient p-4 flex items-center justify-center shadow-gold-glow mx-auto mb-6">
                        <Shield className="text-royal-navy" size={40} />
                    </div>
                    <h1 className="text-3xl font-playfair font-bold text-white mb-2 tracking-tight">Access <span className="gold-text-shimmer">Command Center</span></h1>
                    <p className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Secure Verification Protocol Required</p>
                </div>

                <GlassCard className="p-8 border-royal-gold/20">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Terminal ID (Email)</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="investigator@bank.intel"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-royal-gold/50 transition-colors placeholder:text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Access Cipher (Password)</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••••••"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-royal-gold/50 transition-colors placeholder:text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest pt-2">
                            <label className="flex items-center space-x-2 text-slate-500 cursor-pointer">
                                <input type="checkbox" className="w-3 h-3 rounded border-white/20 bg-transparent accent-royal-gold" />
                                <span>Remember Terminal</span>
                            </label>
                            <a href="#" className="text-royal-gold hover:text-royal-gold-light transition-colors">Emergency Recovery</a>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 rounded-xl bg-gold-gradient text-royal-navy font-bold text-xs uppercase tracking-widest shadow-gold-glow flex items-center justify-center space-x-3 group active:scale-95 transition-all mt-4"
                        >
                            <span>Initiate Secure Link</span>
                            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                </GlassCard>

                <p className="mt-12 text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]">
                    Classified Information • Authorized Personnel Only
                </p>
            </motion.div>
        </div>
    );
};

export default Login;

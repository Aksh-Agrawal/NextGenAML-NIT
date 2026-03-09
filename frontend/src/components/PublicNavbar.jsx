import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, ChevronRight, ArrowLeft } from 'lucide-react';

const PublicNavbar = () => {
    const location = useLocation();
    const isDashboard = location.pathname.startsWith('/dashboard');

    if (isDashboard) return null;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-8 h-20 flex items-center justify-between border-b border-white/5 bg-royal-navy/50 backdrop-blur-lg">
            <div className="flex items-center space-x-6">
                {location.pathname !== '/' && (
                    <button
                        onClick={() => window.history.back()}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-royal-gold hover:bg-white/10 transition-all flex items-center justify-center group"
                        title="Go Back"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                )}
                <Link to="/" className="flex items-center space-x-3 group active:scale-95 transition-transform">
                    <div className="w-10 h-10 rounded-xl bg-gold-gradient p-2 flex items-center justify-center shadow-gold-glow group-hover:shadow-gold-glow-large transition-all">
                        <Shield className="text-royal-navy" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-playfair font-bold text-white tracking-tight">NextGen<span className="text-royal-gold">AML</span></h1>
                        <p className="text-[8px] uppercase tracking-widest text-royal-gold/60 font-bold leading-none">Intelligence Unit</p>
                    </div>
                </Link>
            </div>

            <div className="hidden md:flex items-center space-x-10">
                {['System', 'Features', 'About'].map((item) => (
                    <Link
                        key={item}
                        to={`/${item.toLowerCase()}`}
                        className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-royal-gold transition-colors"
                    >
                        {item}
                    </Link>
                ))}
            </div>

            <div className="flex items-center space-x-4">
                <Link to="/login" className="text-xs font-bold uppercase tracking-widest text-white hover:text-royal-gold transition-colors">
                    Login
                </Link>
                <Link
                    to="/dashboard"
                    className="px-6 py-2 rounded-lg bg-gold-gradient text-royal-navy font-bold text-xs uppercase tracking-widest shadow-gold-glow flex items-center space-x-2 group active:scale-95 transition-all"
                >
                    <span>Get Started</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </nav>
    );
};

export default PublicNavbar;

import React from 'react';
import {
    LayoutDashboard,
    Map,
    Users,
    BarChart3,
    History,
    FileText,
    Settings,
    ShieldCheck,
    ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <motion.button
        whileHover={{ x: 5, backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-6 py-4 transition-all duration-300 border-r-2 ${active
                ? 'text-royal-gold border-royal-gold bg-glass-gold'
                : 'text-slate-400 border-transparent hover:text-royal-gold'
            }`}
    >
        <Icon size={20} className={active ? 'drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]' : ''} />
        <span className="font-medium tracking-wide text-sm">{label}</span>
        {active && (
            <motion.div
                layoutId="activeIndicator"
                className="ml-auto"
            >
                <ChevronRight size={14} />
            </motion.div>
        )}
    </motion.button>
);

const Sidebar = ({ activeTab, setActiveTab }) => {
    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'fund-flow', icon: Map, label: 'Fund Flow Map' },
        { id: 'suspicious', icon: Users, label: 'Suspicious Accounts' },
        { id: 'analytics', icon: BarChart3, label: 'Fraud Analytics' },
        { id: 'timeline', icon: History, label: 'Investigation Timeline' },
        { id: 'reports', icon: FileText, label: 'Reports' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="w-72 h-screen bg-royal-navy border-r border-white/5 flex flex-col fixed left-0 top-0 z-50">
            <div className="p-8 pb-12 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gold-gradient flex items-center justify-center shadow-gold-glow">
                    <ShieldCheck className="text-royal-navy" size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold bg-gold-gradient bg-clip-text text-transparent">NextGenAML</h1>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-royal-gold/60 font-medium">Intelligence Unit</p>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto">
                {menuItems.map((item) => (
                    <SidebarItem
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        active={activeTab === item.id}
                        onClick={() => setActiveTab(item.id)}
                    />
                ))}
            </nav>

            <div className="p-6 mt-auto">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 glass-morphism">
                    <p className="text-xs text-slate-400 mb-2">System Status</p>
                    <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-sm font-medium text-emerald-500">Secure & Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;

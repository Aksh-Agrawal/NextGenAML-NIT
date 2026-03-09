import React from 'react';
import GlassCard from '../components/GlassCard';
import {
    Settings as SettingsIcon,
    User,
    Bell,
    Shield,
    Globe,
    Database,
    Cpu,
    Key,
    LogOut,
    ChevronRight,
    ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';

const SettingsSection = ({ icon: Icon, title, subtitle, children }) => (
    <div className="space-y-4">
        <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-royal-gold/10 text-royal-gold">
                <Icon size={20} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
        </div>
        <GlassCard>
            <div className="divide-y divide-white/5">
                {children}
            </div>
        </GlassCard>
    </div>
);

const SettingItem = ({ label, description, type = 'toggle', value }) => (
    <div className="py-4 flex items-center justify-between group">
        <div>
            <p className="text-sm font-bold text-slate-200 group-hover:text-royal-gold transition-colors">{label}</p>
            <p className="text-xs text-slate-500">{description}</p>
        </div>
        <div>
            {type === 'toggle' ? (
                <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${value ? 'bg-royal-gold' : 'bg-slate-800'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
            ) : (
                <button className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-royal-gold flex items-center space-x-1">
                    <span>Configure</span>
                    <ChevronRight size={12} />
                </button>
            )}
        </div>
    </div>
);

const Settings = () => {
    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <div>
                    <h2 className="text-4xl font-bold gold-text-shimmer mb-2">System Config</h2>
                    <p className="text-slate-400 text-sm tracking-wide">Manage your intelligence protocols and terminal environments.</p>
                </div>
                <button className="px-6 py-2 rounded-lg bg-fraud-red/10 border border-fraud-red/20 text-fraud-red font-bold text-xs uppercase tracking-widest flex items-center space-x-2 hover:bg-fraud-red/20 transition-colors">
                    <LogOut size={16} />
                    <span>Exit Secure Session</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-12">
                    <SettingsSection
                        icon={User}
                        title="Investigator Profile"
                        subtitle="Manage your identity credentials"
                    >
                        <div className="py-4 flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-full bg-gold-gradient p-1">
                                <div className="w-full h-full rounded-full bg-royal-navy flex items-center justify-center font-playfair text-xl font-bold text-royal-gold">
                                    HP
                                </div>
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-white">Himanshu Pandey</h4>
                                <p className="text-xs text-slate-500">Lead FIU Investigator • ID: 829-XJ</p>
                                <button className="mt-2 text-[10px] font-bold text-royal-gold uppercase tracking-widest">Edit Credentials</button>
                            </div>
                        </div>
                        <SettingItem label="Public Profile" description="Allow other units to see your investigation status" value={true} />
                        <SettingItem label="Active Duty Status" description="Display online status to the network" value={true} />
                    </SettingsSection>

                    <SettingsSection
                        icon={Shield}
                        title="Intelligence Protocols"
                        subtitle="Security & verification rules"
                    >
                        <SettingItem label="Auto-Flag Threshold" description="Automatic alert at risk score > 85" value={true} />
                        <SettingItem label="Deep Scan Frequency" description="Perform entity background checks every 24h" value={false} />
                        <SettingItem label="Two-Factor Auth" description="Required for viewing critical fund journeys" value={true} />
                        <SettingItem label="Access Logs" description="Review system access history" type="button" />
                    </SettingsSection>
                </div>

                <div className="space-y-12">
                    <SettingsSection
                        icon={Globe}
                        title="Network & Connectivity"
                        subtitle="Central Node link configurations"
                    >
                        <div className="py-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Mainframe Connected</span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">LATENCY: 12ms</span>
                            </div>
                            <SettingItem label="Regional Node Sync" description="Synchronize data with APAC and EMEA hubs" value={true} />
                            <SettingItem label="Encryption Level" description="Quantum-resistant AES-1024 protocol" type="button" />
                        </div>
                    </SettingsSection>

                    <SettingsSection
                        icon={Cpu}
                        title="System Performance"
                        subtitle="Optimization & telemetry"
                    >
                        <SettingItem label="Hardware Acceleration" description="Use GPU for 3D graph visualizations" value={true} />
                        <SettingItem label="Data Caching" description="Store historical flows for offline analysis" value={true} />
                        <SettingItem label="Telemetry Data" description="Send anonymous system logs to HQ" value={false} />
                    </SettingsSection>

                    <GlassCard variant="danger" className="text-center p-6 border-dashed">
                        <ShieldAlert className="text-fraud-red mx-auto mb-3" size={32} />
                        <h4 className="text-base font-bold text-white mb-2">Emergency Hub Reset</h4>
                        <p className="text-xs text-slate-400 mb-6 px-4">This will clear all local caches and reset investigative protocols. Proceed with extreme caution.</p>
                        <button className="w-full py-2 rounded-lg bg-fraud-red/20 text-fraud-red text-[10px] font-bold uppercase tracking-widest hover:bg-fraud-red/30 transition-colors">
                            Initiate Reset Sequence
                        </button>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};

export default Settings;

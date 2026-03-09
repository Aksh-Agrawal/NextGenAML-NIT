import React from 'react';
import FundFlowGraph from '../components/FundFlowGraph';
import GlassCard from '../components/GlassCard';
import { Info, Download, Filter } from 'lucide-react';

const FundFlowMap = () => {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-bold gold-text-shimmer mb-2">Fund Flow Map</h2>
                    <p className="text-slate-400 text-sm tracking-wide">Interactive network visualization of cross-border and local financial transfers.</p>
                </div>
                <div className="flex space-x-3">
                    <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-royal-gold transition-colors">
                        <Filter size={20} />
                    </button>
                    <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-royal-gold transition-colors">
                        <Download size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-3 h-[600px]">
                    <FundFlowGraph />
                </div>

                <div className="xl:col-span-1 space-y-6">
                    <GlassCard title="Entity Intel" subtitle="Selected Node Details">
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center mb-4">
                                <Info className="text-slate-600" size={32} />
                            </div>
                            <p className="text-sm text-slate-500">Select an account node on the map to view detailed financial intelligence, risk scores, and transaction history.</p>
                        </div>
                    </GlassCard>

                    <GlassCard title="Legend">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 rounded-full bg-fraud-red shadow-red-glow"></div>
                                <span className="text-xs text-slate-300">Flagged Money Laundering Risk</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 rounded-full bg-royal-gold"></div>
                                <span className="text-xs text-slate-300">High-Value Institutional Transfer</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 rounded-full bg-soft-blue"></div>
                                <span className="text-xs text-slate-300">Standard Retail Transaction</span>
                            </div>
                            <hr className="border-white/5" />
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-1 bg-royal-gold opacity-50"></div>
                                <span className="text-xs text-slate-300">Transaction Volume (Line Thickness)</span>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};

export default FundFlowMap;

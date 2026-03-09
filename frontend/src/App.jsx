import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import FundFlowMap from './pages/FundFlowMap';
import SuspiciousAccounts from './pages/SuspiciousAccounts';
import FraudAnalytics from './pages/FraudAnalytics';
import InvestigationTimeline from './pages/InvestigationTimeline';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-royal-navy text-slate-200 overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-royal-gold/10 blur-[120px] rounded-full opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-soft-blue/10 blur-[120px] rounded-full opacity-40"></div>
        <div className="absolute top-[30%] right-[10%] w-[20%] h-[20%] bg-fraud-red/5 blur-[100px] rounded-full opacity-20"></div>
      </div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="pl-72 min-h-screen relative z-10">
        {/* Top Navbar / Breadcrumb */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-royal-navy/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest">
            <span className="text-slate-500">System</span>
            <span className="text-slate-700">/</span>
            <span className="text-royal-gold">{activeTab.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center space-x-6 text-xs font-semibold text-slate-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Central Node Link: Online</span>
            </div>
            <div className="w-px h-4 bg-white/10"></div>
            <span>March 09, 2026</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="p-8 pb-20"
          >
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'fund-flow' && <FundFlowMap />}
            {activeTab === 'suspicious' && <SuspiciousAccounts />}
            {activeTab === 'analytics' && <FraudAnalytics />}
            {activeTab === 'timeline' && <InvestigationTimeline />}

            {/* Other pages placeholder */}
            {activeTab !== 'dashboard' &&
              activeTab !== 'fund-flow' &&
              activeTab !== 'suspicious' &&
              activeTab !== 'analytics' &&
              activeTab !== 'timeline' && (
                <div className="flex flex-col items-center justify-center min-h-[70vh]">
                  <div className="w-24 h-24 rounded-2xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center mb-8">
                    <div className="w-12 h-12 border-2 border-royal-gold/30 border-t-royal-gold rounded-full animate-spin"></div>
                  </div>
                  <h2 className="text-4xl font-playfair font-bold gold-text-shimmer mb-4">Under Development</h2>
                  <p className="text-slate-400 tracking-widest uppercase text-sm">Component: {activeTab.replace('-', ' ')} Intelligence Module</p>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="mt-8 px-6 py-2 rounded-lg border border-royal-gold/50 text-royal-gold text-xs font-bold uppercase tracking-widest hover:bg-glass-gold transition-colors"
                  >
                    Return to Command Center
                  </button>
                </div>
              )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;

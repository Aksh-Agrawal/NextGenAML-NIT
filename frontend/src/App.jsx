import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import FundFlowMap from './pages/FundFlowMap';
import SuspiciousAccounts from './pages/SuspiciousAccounts';
import FraudAnalytics from './pages/FraudAnalytics';
import InvestigationTimeline from './pages/InvestigationTimeline';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Public Pages
import Landing from './pages/Landing';
import Information from './pages/Information';
import Features from './pages/Features';
import About from './pages/About';
import Login from './pages/Login';

// Components
import PublicNavbar from './components/PublicNavbar';
import Footer from './components/Footer';
import BackgroundEffect from './components/BackgroundEffect';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
  >
    {children}
  </motion.div>
);

const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const location = useLocation();

  return (
    <div className="min-h-screen bg-royal-navy text-slate-200 overflow-x-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="pl-72 min-h-screen relative z-10">
        {/* Top Navbar / Breadcrumb */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-royal-navy/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center space-x-4">
            {activeTab !== 'dashboard' && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-royal-gold hover:bg-white/10 transition-all flex items-center justify-center group"
                title="Back to Command Center"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              </button>
            )}
            <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest">
              <span className="text-slate-500">Intelligence Unit</span>
              <span className="text-slate-700">/</span>
              <span className="text-royal-gold">{activeTab.replace('-', ' ')}</span>
            </div>
          </div>
          <div className="flex items-center space-x-6 text-xs font-semibold text-slate-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
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
            {activeTab === 'reports' && <Reports />}
            {activeTab === 'settings' && <Settings />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="relative min-h-screen bg-[#0A0F1F]">
        <BackgroundEffect />
        <PublicNavbar />

        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
            <Route path="/system" element={<PageWrapper><Information /></PageWrapper>} />
            <Route path="/features" element={<PageWrapper><Features /></PageWrapper>} />
            <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
            <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
            <Route path="/dashboard" element={<DashboardLayout />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>

        <FooterConditionally />
      </div>
    </Router>
  );
}

const FooterConditionally = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  if (isDashboard) return null;
  return <Footer />;
};

export default App;

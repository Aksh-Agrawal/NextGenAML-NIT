import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import GlassCard from '../components/GlassCard';
import { Download, Calendar } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const FraudAnalytics = () => {
    const lineData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [
            {
                label: 'Suspicious Volume',
                data: [65, 59, 80, 81, 56, 55, 40],
                fill: true,
                borderColor: '#D4AF37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                tension: 0.4,
            },
            {
                label: 'Total Volume (Scale: 1:10)',
                data: [28, 48, 40, 19, 86, 27, 90],
                fill: false,
                borderColor: '#4FA3FF',
                tension: 0.4,
            }
        ],
    };

    const barData = {
        labels: ['Shell Corp', 'Structuring', 'Circular', 'Smurfing', 'Rapid Move'],
        datasets: [{
            label: 'Flagged Patterns',
            data: [12, 19, 3, 5, 2],
            backgroundColor: [
                'rgba(212, 175, 55, 0.6)',
                'rgba(255, 76, 76, 0.6)',
                'rgba(79, 163, 255, 0.6)',
                'rgba(212, 175, 55, 0.4)',
                'rgba(255, 76, 76, 0.4)',
            ],
            borderWidth: 0,
            borderRadius: 8,
        }],
    };

    const doughnutData = {
        labels: ['High Risk', 'Medium Risk', 'Low Risk'],
        datasets: [{
            data: [30, 50, 20],
            backgroundColor: ['#FF4C4C', '#D4AF37', '#4FA3FF'],
            hoverOffset: 4,
            borderWidth: 0,
        }],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            y: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#64748b', font: { size: 10 } }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#64748b', font: { size: 10 } }
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-bold gold-text-shimmer mb-2">Fraud Analytics</h2>
                    <p className="text-slate-400 text-sm tracking-wide">Predictive insights and historical trends for anti-money laundering investigations.</p>
                </div>
                <div className="flex space-x-3">
                    <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center space-x-2">
                        <Calendar size={16} />
                        <span>Last 30 Days</span>
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-gold-gradient text-royal-navy font-bold text-xs uppercase tracking-widest flex items-center space-x-2">
                        <Download size={16} />
                        <span>Export Intel</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <GlassCard title="Transaction Trends" className="lg:col-span-2 h-[400px]">
                    <div className="h-[300px]">
                        <Line data={lineData} options={options} />
                    </div>
                </GlassCard>

                <GlassCard title="Risk Distribution" className="lg:col-span-1 h-[400px]">
                    <div className="h-[300px] flex items-center justify-center relative">
                        <Doughnut data={doughnutData} options={{ ...options, scales: {} }} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-white">1.2K</span>
                            <span className="text-[10px] text-slate-500 uppercase">Entities</span>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard title="Pattern Frequency" className="lg:col-span-2 h-[400px]">
                    <div className="h-[300px]">
                        <Bar data={barData} options={options} />
                    </div>
                </GlassCard>

                <GlassCard title="Intelligence Summary" className="lg:col-span-1">
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-fraud-red/5 border border-fraud-red/20">
                            <h4 className="text-fraud-red text-xs font-bold uppercase mb-2">High Alert</h4>
                            <p className="text-sm text-slate-300">Structuring activities have increased by <span className="text-fraud-red font-bold">14%</span> in the APAC region over the last 48 hours.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-royal-gold/5 border border-royal-gold/20">
                            <h4 className="text-royal-gold text-xs font-bold uppercase mb-2">System Insight</h4>
                            <p className="text-sm text-slate-300">New circular flow detected between offshore accounts and shell corp 'Alpha-92'.</p>
                        </div>
                        <button className="w-full py-3 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold hover:bg-glass-gold transition-colors">
                            Run Predictive Scan
                        </button>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default FraudAnalytics;

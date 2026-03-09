import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, title, subtitle, className = '', variant = 'default' }) => {
    const variants = {
        default: 'glass-morphism',
        gold: 'gold-glass',
        danger: 'bg-fraud-red/5 border-fraud-red/20 backdrop-blur-md',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className={`rounded-2xl p-6 transition-all duration-300 ${variants[variant]} ${className}`}
        >
            {(title || subtitle) && (
                <div className="mb-6">
                    {title && <h3 className="text-xl font-bold text-white mb-1">{title}</h3>}
                    {subtitle && <p className="text-xs text-slate-400 uppercase tracking-widest">{subtitle}</p>}
                </div>
            )}
            {children}
        </motion.div>
    );
};

export default GlassCard;

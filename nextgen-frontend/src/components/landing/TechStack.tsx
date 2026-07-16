"use client";

import { motion } from "framer-motion";
import { TECH_ROWS } from "@/lib/landing-data";

export function TechStack() {
  return (
    <section
      id="tech-stack"
      style={{ padding: "100px 32px", maxWidth: "1280px", margin: "0 auto" }}
    >
      {/* Section heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: "center", marginBottom: "56px" }}
      >
        <p
          style={{
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', monospace",
            color: "var(--accent-blue)",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          Technology
        </p>
        <h2
          style={{
            fontSize: "clamp(28px, 3.5vw, 42px)",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.5px",
          }}
        >
          Built on
        </h2>
      </motion.div>

      {/* Tech rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {TECH_ROWS.map((row, rowIdx) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.4, delay: rowIdx * 0.08 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            {/* Row label */}
            <span
              style={{
                fontSize: "10px",
                fontFamily: "'JetBrains Mono', monospace",
                color: "var(--text-muted)",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                width: "54px",
                flexShrink: 0,
              }}
            >
              {row.label}
            </span>

            {/* Divider */}
            <div
              style={{
                width: "1px",
                height: "28px",
                background: "var(--border)",
                flexShrink: 0,
              }}
            />

            {/* Tech tags */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.04 } },
              }}
              style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
            >
              {row.items.map((item) => (
                <motion.div
                  key={item.name}
                  variants={{
                    hidden: { opacity: 0, scale: 0.92 },
                    visible: {
                      opacity: 1,
                      scale: 1,
                      transition: { duration: 0.3, ease: "easeOut" },
                    },
                  }}
                  whileHover={{
                    scale: 1.04,
                    borderColor: "rgba(0,229,255,0.36)",
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "var(--text-primary)",
                    cursor: "default",
                    transition: "border-color 0.15s ease, transform 0.15s ease",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "2px",
                      background: item.color,
                      flexShrink: 0,
                    }}
                  />
                  {item.name}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

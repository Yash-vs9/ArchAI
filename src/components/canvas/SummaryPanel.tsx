"use client";

import { ChevronDown, ChevronUp, FolderTree, Database, Code, CircleDollarSign } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SummaryPanel({ summary }: { summary: any }) {
    const [isOpen, setIsOpen] = useState(false);

    if (!summary) return null;

    const score = summary.complexityScore?.total || 0;
    const circumference = 2 * Math.PI * 18; // r=18
    const strokeDashoffset = circumference - (score / 10) * circumference;

    return (
        <motion.div
            initial={false}
            animate={{ height: isOpen ? 320 : 64 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl z-50 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        >
            <div
                className="h-16 flex items-center justify-between px-6 cursor-pointer hover:bg-white/5 transition-colors border-b border-transparent"
                style={{ borderBottomColor: isOpen ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-white tracking-wide">Infrastructure Summary</span>

                    {/* Radial Progress Ring */}
                    <div className="flex items-center gap-2 bg-white/5 rounded-full pr-3 pl-1 py-1 border border-white/10">
                        <div className="relative w-8 h-8 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 40 40">
                                <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                                <motion.circle
                                    cx="20" cy="20" r="18" fill="none"
                                    stroke="#3b82f6" strokeWidth="4"
                                    strokeLinecap="round"
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={{ strokeDashoffset: isOpen ? strokeDashoffset : circumference }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    style={{ strokeDasharray: circumference }}
                                />
                            </svg>
                            <span className="absolute text-[10px] font-bold text-white">{score}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Complexity</span>
                    </div>
                </div>
                <div className="text-white/50 bg-white/5 p-1.5 rounded-full">
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        <ChevronUp size={20} />
                    </motion.div>
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-6 h-[calc(100%-4rem)] overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 scrollbar-hide"
                    >
                        {/* Tech Stack */}
                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                                <Code size={16} className="text-blue-500" /> Tech Stack
                            </h4>
                            <ul className="space-y-3">
                                {summary.techStack?.map((tech: any, idx: number) => (
                                    <li key={idx} className="text-xs bg-white/5 p-3 rounded-xl border border-white/5 backdrop-blur-sm shadow-inner transition-colors hover:bg-white/10">
                                        <span className="font-semibold text-blue-100 block mb-1">{tech.name}</span>
                                        <span className="text-neutral-400 leading-relaxed">{tech.rationale}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Database Schemas */}
                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                                <Database size={16} className="text-orange-500" /> Database Entities
                            </h4>
                            <div className="space-y-3">
                                {summary.schemas?.map((schema: any, idx: number) => (
                                    <div key={idx} className="text-xs bg-white/5 p-3 rounded-xl border border-white/5 backdrop-blur-sm transition-colors hover:bg-white/10">
                                        <div className="flex items-baseline justify-between mb-2">
                                            <span className="font-semibold text-orange-400">{schema.name}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {schema.fields?.map((f: string, idy: number) => (
                                                <span key={idy} className="px-2 py-1 rounded-md bg-black/40 text-neutral-300 border border-white/5">{f}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* API Endpoints */}
                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                                <CircleDollarSign size={16} className="text-emerald-500" /> Endpoints & Compute
                            </h4>
                            <div className="text-xs bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 mb-3">
                                <span className="font-semibold text-emerald-400 block mb-1">Compute Estimate</span>
                                <span className="text-emerald-100/70">{summary.serverEstimate}</span>
                            </div>
                            <div className="space-y-2">
                                {summary.apiEndpoints?.slice(0, 4).map((api: any, idx: number) => (
                                    <div key={idx} className="text-xs flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                                        <span className={`px-2 py-1 rounded-md font-bold tracking-wider text-[9px] ${api.method === 'GET' ? 'text-blue-400 bg-blue-500/20' :
                                                api.method === 'POST' ? 'text-emerald-400 bg-emerald-500/20' :
                                                    api.method === 'DELETE' ? 'text-red-400 bg-red-500/20' : 'text-purple-400 bg-purple-500/20'
                                            }`}>{api.method}</span>
                                        <span className="text-neutral-300 font-mono truncate">{api.route}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Folder Structure */}
                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                                <FolderTree size={16} className="text-indigo-500" /> Structure
                            </h4>
                            <div className="text-xs font-mono bg-black/40 p-4 rounded-xl border border-white/5 text-neutral-400 overflow-x-auto whitespace-pre cursor-text">
                                {summary.folderStructure?.map((folder: string, idx: number) => (
                                    <div key={idx} className="hover:text-indigo-300 transition-colors py-0.5">
                                        {folder}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

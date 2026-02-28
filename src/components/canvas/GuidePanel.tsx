"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Copy, Check, Loader2, AlertCircle, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type GuidePanelProps = {
    guide: string | null;
    isLoading: boolean;
    error: string | null;
    hasArchitecture: boolean;
    onRequestGuide: () => void;
};

export default function GuidePanel({ guide, isLoading, error, hasArchitecture, onRequestGuide }: GuidePanelProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!guide) return;
        navigator.clipboard.writeText(guide);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!guide) return;
        const blob = new Blob([guide], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "implementation-guide.md";
        a.click();
        URL.revokeObjectURL(url);
    };

    // Empty state — no architecture yet
    if (!hasArchitecture) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <BookOpen className="h-7 w-7 text-white/30" />
                </div>
                <h3 className="text-white/60 font-medium mb-2">No Architecture Yet</h3>
                <p className="text-white/30 text-sm leading-relaxed">
                    Complete the interview and generate an architecture first. Then come back here for your implementation guide.
                </p>
            </div>
        );
    }

    // Ready to generate
    if (!guide && !isLoading && !error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className="relative mb-6">
                        <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-xl" />
                        <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-blue-500/30 flex items-center justify-center">
                            <BookOpen className="h-7 w-7 text-blue-400" />
                        </div>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">Generate Dev Guide</h3>
                    <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-xs">
                        Get a complete step-by-step implementation guide tailored to your architecture, including setup, code structure, deployment, and cost estimates.
                    </p>
                    <button
                        onClick={onRequestGuide}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] border border-blue-500/50"
                    >
                        <BookOpen size={16} />
                        Generate Guide
                    </button>
                </motion.div>
            </div>
        );
    }

    // Loading
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full blur-xl bg-blue-500/30 animate-pulse" />
                    <Loader2 className="h-12 w-12 text-blue-400 animate-spin relative z-10" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Writing your guide...</h3>
                <p className="text-white/40 text-sm">This may take 15–30 seconds.</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                    <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-white/70 font-medium mb-2">Generation Failed</h3>
                <p className="text-white/30 text-sm mb-6">{error}</p>
                <button
                    onClick={onRequestGuide}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white/70 rounded-xl transition-all"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // Guide content
    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/20 shrink-0">
                <div className="flex items-center gap-2 text-white/50 text-xs font-medium uppercase tracking-wider">
                    <BookOpen size={13} />
                    Implementation Guide
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-lg transition-all"
                    >
                        <Download size={12} />
                        .md
                    </button>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-lg transition-all"
                    >
                        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                        onClick={onRequestGuide}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-lg transition-all"
                    >
                        Regenerate
                    </button>
                </div>
            </div>

            {/* Markdown Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-hide">
                <div className="guide-content max-w-3xl mx-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {guide || ""}
                    </ReactMarkdown>
                </div>
            </div>

            <style jsx global>{`
                .guide-content {
                    color: #e2e8f0;
                    font-family: 'Georgia', 'Times New Roman', serif;
                    font-size: 15px;
                    line-height: 1.8;
                }

                .guide-content h1 {
                    font-family: 'system-ui', sans-serif;
                    font-size: 1.875rem;
                    font-weight: 700;
                    color: #ffffff;
                    margin-bottom: 0.5rem;
                    margin-top: 2rem;
                    letter-spacing: -0.02em;
                    background: linear-gradient(to right, #ffffff, #94a3b8);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .guide-content h2 {
                    font-family: 'system-ui', sans-serif;
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #e2e8f0;
                    margin-top: 2.5rem;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                }

                .guide-content h3 {
                    font-family: 'system-ui', sans-serif;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #93c5fd;
                    margin-top: 1.5rem;
                    margin-bottom: 0.5rem;
                }

                .guide-content p {
                    margin-bottom: 1rem;
                    color: #cbd5e1;
                }

                .guide-content ul, .guide-content ol {
                    padding-left: 1.5rem;
                    margin-bottom: 1rem;
                    color: #cbd5e1;
                }

                .guide-content li {
                    margin-bottom: 0.4rem;
                }

                .guide-content code {
                    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
                    font-size: 0.8rem;
                    background: rgba(59, 130, 246, 0.12);
                    color: #93c5fd;
                    padding: 0.15rem 0.4rem;
                    border-radius: 4px;
                    border: 1px solid rgba(59, 130, 246, 0.2);
                }

                .guide-content pre {
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 10px;
                    padding: 1.25rem;
                    overflow-x: auto;
                    margin-bottom: 1.25rem;
                }

                .guide-content pre code {
                    background: none;
                    border: none;
                    color: #e2e8f0;
                    padding: 0;
                    font-size: 0.82rem;
                    line-height: 1.7;
                }

                .guide-content blockquote {
                    border-left: 3px solid #3b82f6;
                    padding-left: 1rem;
                    color: #94a3b8;
                    font-style: italic;
                    margin: 1.25rem 0;
                }

                .guide-content table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 1.25rem;
                    font-size: 0.875rem;
                }

                .guide-content th {
                    background: rgba(59, 130, 246, 0.1);
                    color: #93c5fd;
                    font-family: 'system-ui', sans-serif;
                    font-weight: 600;
                    padding: 0.625rem 0.875rem;
                    text-align: left;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }

                .guide-content td {
                    padding: 0.625rem 0.875rem;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    color: #cbd5e1;
                }

                .guide-content tr:hover td {
                    background: rgba(255,255,255,0.02);
                }

                .guide-content a {
                    color: #60a5fa;
                    text-decoration: underline;
                    text-decoration-color: rgba(96, 165, 250, 0.3);
                }

                .guide-content hr {
                    border: none;
                    border-top: 1px solid rgba(255,255,255,0.08);
                    margin: 2rem 0;
                }

                .guide-content strong {
                    color: #f1f5f9;
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
}
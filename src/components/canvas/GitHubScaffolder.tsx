"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github, X, ExternalLink, Loader2, CheckCircle2, AlertCircle, Lock, FolderGit2 } from "lucide-react";

type ScaffoldStatus = "idle" | "generating" | "creating_repo" | "pushing_files" | "done" | "error";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onScaffold: (token: string, repoName: string, isPrivate: boolean) => void;
    status: ScaffoldStatus;
    repoUrl: string | null;
    error: string | null;
};

const STATUS_STEPS = [
    { key: "generating", label: "Generating file contents..." },
    { key: "creating_repo", label: "Creating GitHub repository..." },
    { key: "pushing_files", label: "Pushing files & boilerplate..." },
    { key: "done", label: "Repository ready!" },
];

export default function GitHubScaffolder({ isOpen, onClose, onScaffold, status, repoUrl, error }: Props) {
    const [token, setToken] = useState("");
    const [repoName, setRepoName] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [showToken, setShowToken] = useState(false);

    const isLoading = ["generating", "creating_repo", "pushing_files"].includes(status);
    const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === status);

    const handleSubmit = () => {
        if (!token.trim() || !repoName.trim()) return;
        onScaffold(token.trim(), repoName.trim(), isPrivate);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isLoading ? onClose : undefined}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
                    >
                        <div className="bg-neutral-950 border border-white/10 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/30">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                        <Github size={16} className="text-white/70" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-white">GitHub Repo Scaffolder</h2>
                                        <p className="text-xs text-white/40">Create a ready-to-code repository</p>
                                    </div>
                                </div>
                                {!isLoading && (
                                    <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
                                        <X size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="p-6">
                                {/* Idle / Input form */}
                                {status === "idle" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                        {/* Token input */}
                                        <div>
                                            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                                                GitHub Personal Access Token
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showToken ? "text" : "password"}
                                                    value={token}
                                                    onChange={e => setToken(e.target.value)}
                                                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/50 transition-colors pr-20"
                                                />
                                                <button
                                                    onClick={() => setShowToken(v => !v)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 hover:text-white/60 transition-colors"
                                                >
                                                    {showToken ? "Hide" : "Show"}
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-white/30 mt-1.5 flex items-center gap-1">
                                                <Lock size={10} />
                                                Needs <code className="text-blue-400">repo</code> scope.
                                                <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
                                                    Generate one <ExternalLink size={9} />
                                                </a>
                                            </p>
                                        </div>

                                        {/* Repo name */}
                                        <div>
                                            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                                                Repository Name
                                            </label>
                                            <input
                                                type="text"
                                                value={repoName}
                                                onChange={e => setRepoName(e.target.value.replace(/\s+/g, "-").toLowerCase())}
                                                placeholder="my-awesome-project"
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                            />
                                        </div>

                                        {/* Private toggle */}
                                        <div className="flex items-center justify-between py-2">
                                            <div>
                                                <p className="text-sm text-white/70 font-medium">Private Repository</p>
                                                <p className="text-xs text-white/30">Only you can see this repo</p>
                                            </div>
                                            <button
                                                onClick={() => setIsPrivate(v => !v)}
                                                className={`relative h-6 w-11 rounded-full transition-colors ${isPrivate ? "bg-blue-600" : "bg-white/10"}`}
                                            >
                                                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isPrivate ? "translate-x-5" : "translate-x-0"}`} />
                                            </button>
                                        </div>

                                        {/* What gets created */}
                                        <div className="rounded-xl bg-white/3 border border-white/5 p-4">
                                            <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <FolderGit2 size={12} />
                                                What gets created
                                            </p>
                                            <ul className="space-y-1 text-xs text-white/40">
                                                <li>✓ Full folder structure from your architecture</li>
                                                <li>✓ Boilerplate files for your tech stack</li>
                                                <li>✓ Pre-filled README with your project details</li>
                                                <li>✓ .gitignore, .env.example, package.json stubs</li>
                                            </ul>
                                        </div>

                                        <button
                                            onClick={handleSubmit}
                                            disabled={!token.trim() || !repoName.trim()}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black font-semibold text-sm rounded-xl disabled:opacity-40 transition-all hover:bg-neutral-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                        >
                                            <Github size={16} />
                                            Create Repository
                                        </button>
                                    </motion.div>
                                )}

                                {/* Loading / progress */}
                                {isLoading && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4">
                                        <div className="flex justify-center mb-6">
                                            <div className="relative">
                                                <div className="absolute inset-0 rounded-full blur-xl bg-blue-500/20 animate-pulse" />
                                                <Loader2 className="h-10 w-10 text-blue-400 animate-spin relative z-10" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {STATUS_STEPS.slice(0, 3).map((step, i) => (
                                                <div key={step.key} className={`flex items-center gap-3 text-sm transition-all ${
                                                    i < currentStepIndex ? "text-emerald-400" :
                                                    i === currentStepIndex ? "text-white" :
                                                    "text-white/20"
                                                }`}>
                                                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                                                        i < currentStepIndex ? "border-emerald-500 bg-emerald-500/20" :
                                                        i === currentStepIndex ? "border-blue-500 bg-blue-500/20" :
                                                        "border-white/10"
                                                    }`}>
                                                        {i < currentStepIndex ? (
                                                            <CheckCircle2 size={12} />
                                                        ) : i === currentStepIndex ? (
                                                            <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                                                        ) : null}
                                                    </div>
                                                    {step.label}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Success */}
                                {status === "done" && repoUrl && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="py-4 flex flex-col items-center text-center"
                                    >
                                        <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
                                            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                                        </div>
                                        <h3 className="text-white font-semibold text-lg mb-1">Repository Created!</h3>
                                        <p className="text-white/40 text-sm mb-6">Your project scaffold is ready to clone.</p>
                                        <a
                                            href={repoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-xl hover:bg-neutral-100 transition-all"
                                        >
                                            <Github size={16} />
                                            Open on GitHub
                                            <ExternalLink size={13} />
                                        </a>
                                        <button onClick={onClose} className="mt-3 text-sm text-white/30 hover:text-white/60 transition-colors">
                                            Close
                                        </button>
                                    </motion.div>
                                )}

                                {/* Error */}
                                {status === "error" && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="py-4 flex flex-col items-center text-center"
                                    >
                                        <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                                            <AlertCircle className="h-6 w-6 text-red-400" />
                                        </div>
                                        <h3 className="text-white/70 font-medium mb-2">Scaffold Failed</h3>
                                        <p className="text-white/30 text-sm mb-5">{error || "Something went wrong."}</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onScaffold(token, repoName, isPrivate)}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white/70 rounded-xl transition-all"
                                            >
                                                Try Again
                                            </button>
                                            <button onClick={onClose} className="px-4 py-2 text-sm text-white/30 hover:text-white/60 transition-colors">
                                                Cancel
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
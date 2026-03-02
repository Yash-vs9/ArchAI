"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import ReactFlow, {
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    Panel,
    ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { Download, Loader2, DollarSign, TrendingUp } from "lucide-react";
import { nodeTypes } from "./CustomNodes";
import SummaryPanel from "./SummaryPanel";
import { toPng } from "html-to-image";
import { motion, AnimatePresence } from "framer-motion";

const initialNodes = [
    { id: "intro", position: { x: 250, y: 250 }, data: { label: "Architecture Canvas" }, type: "ServiceNode" }
];

type ArchitectureData = {
    nodes: any[];
    edges: any[];
    summary: any;
} | null;

// Parse cost strings like "$20/mo", "$5-10/mo", "~$50/month" → number
function parseCost(costStr: string): number {
    if (!costStr) return 0;
    const matches = costStr.match(/\$?([\d,]+(?:\.\d+)?)/g);
    if (!matches || matches.length === 0) return 0;
    // If range like "$5-10", average it
    const nums = matches.map(m => parseFloat(m.replace(/[$,]/g, "")));
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function computeTotalCost(nodes: any[]): number {
    return nodes.reduce((total, node) => {
        const cost = parseCost(node.data?.costEstimate || "");
        return total + cost;
    }, 0);
}

// Diff node styles
const DIFF_STYLES = {
    new: {
        border: "2px solid #22c55e",
        boxShadow: "0 0 20px rgba(34,197,94,0.5), 0 0 40px rgba(34,197,94,0.2)",
        animation: "pulseGreen 2s ease-in-out infinite",
    },
    modified: {
        border: "2px solid #eab308",
        boxShadow: "0 0 20px rgba(234,179,8,0.5), 0 0 40px rgba(234,179,8,0.2)",
        animation: "pulseYellow 2s ease-in-out infinite",
    },
    removed: {
        border: "2px solid #ef4444",
        boxShadow: "0 0 20px rgba(239,68,68,0.5)",
        opacity: 0.5,
    },
    unchanged: {},
};

function applyDiff(newNodes: any[], prevNodes: any[]): any[] {
    if (!prevNodes || prevNodes.length === 0) return newNodes;

    const prevMap = new Map(prevNodes.map(n => [n.id, n]));
    const newIds = new Set(newNodes.map(n => n.id));

    // Mark new and modified nodes
    const diffedNew = newNodes.map(node => {
        const prev = prevMap.get(node.id);
        let diffType: "new" | "modified" | "unchanged" = "unchanged";

        if (!prev) {
            diffType = "new";
        } else {
            const prevData = JSON.stringify(prev.data);
            const newData = JSON.stringify(node.data);
            if (prevData !== newData) diffType = "modified";
        }

        return {
            ...node,
            style: {
                ...node.style,
                ...DIFF_STYLES[diffType],
                borderRadius: "12px",
            },
            data: { ...node.data, diffType }
        };
    });

    // Add removed nodes (greyed out, faded)
    const removedNodes = prevNodes
        .filter(n => !newIds.has(n.id))
        .map(n => ({
            ...n,
            style: {
                ...n.style,
                ...DIFF_STYLES.removed,
                borderRadius: "12px",
            },
            data: { ...n.data, diffType: "removed" }
        }));

    return [...diffedNew, ...removedNodes];
}

// Animated cost counter
function CostCounter({ total, prevTotal }: { total: number; prevTotal: number }) {
    const [displayed, setDisplayed] = useState(prevTotal);

    useEffect(() => {
        if (total === prevTotal) return;
        const diff = total - prevTotal;
        const steps = 30;
        const stepVal = diff / steps;
        let current = prevTotal;
        let step = 0;

        const interval = setInterval(() => {
            step++;
            current += stepVal;
            setDisplayed(Math.round(current));
            if (step >= steps) {
                setDisplayed(total);
                clearInterval(interval);
            }
        }, 20);

        return () => clearInterval(interval);
    }, [total, prevTotal]);

    const isIncrease = total > prevTotal;
    const isDecrease = total < prevTotal;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col"
        >
            <div className="flex items-center gap-1.5">
                <DollarSign size={14} className="text-emerald-400" />
                <span className="text-white font-bold text-lg tabular-nums">
                    {displayed.toLocaleString()}
                    <span className="text-white/40 font-normal text-xs ml-0.5">/mo</span>
                </span>
                {isIncrease && prevTotal > 0 && (
                    <span className="text-xs text-red-400 flex items-center gap-0.5">
                        <TrendingUp size={10} /> +${Math.abs(total - prevTotal)}
                    </span>
                )}
                {isDecrease && prevTotal > 0 && (
                    <span className="text-xs text-emerald-400 flex items-center gap-0.5">
                        <TrendingUp size={10} className="rotate-180" /> -${Math.abs(total - prevTotal)}
                    </span>
                )}
            </div>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Est. Monthly Cost</span>
        </motion.div>
    );
}

// Diff legend
function DiffLegend({ visible }: { visible: boolean }) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md text-xs"
                >
                    <span className="text-white/40 font-medium uppercase tracking-wider text-[10px]">Changes</span>
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                        <span className="text-white/60">New</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.8)]" />
                        <span className="text-white/60">Modified</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                        <span className="text-white/60">Removed</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function CanvasInner({ isGenerating, architecture }: { isGenerating: boolean; architecture: ArchitectureData }) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as any);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [totalCost, setTotalCost] = useState(0);
    const [prevTotalCost, setPrevTotalCost] = useState(0);
    const [showDiffLegend, setShowDiffLegend] = useState(false);
    const prevArchitectureRef = useRef<any>(null);
    const diffTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const memoizedNodeTypes = useMemo(() => nodeTypes, []);

    useEffect(() => {
        if (!architecture) return;

        const isUpdate = prevArchitectureRef.current !== null;
        const prevNodes = prevArchitectureRef.current?.nodes || [];

        // Compute cost before applying diff
        const newCost = Math.round(computeTotalCost(architecture.nodes));
        setPrevTotalCost(totalCost);
        setTotalCost(newCost);

        if (isUpdate) {
            // Apply visual diff
            const diffedNodes = applyDiff(architecture.nodes, prevNodes);
            setNodes(diffedNodes);
            setEdges(architecture.edges);

            // Show diff legend for 6 seconds then fade
            setShowDiffLegend(true);
            if (diffTimeoutRef.current) clearTimeout(diffTimeoutRef.current);
            diffTimeoutRef.current = setTimeout(() => {
                setShowDiffLegend(false);
                // Remove diff styles after legend fades
                setTimeout(() => {
                    setNodes(architecture.nodes);
                }, 500);
            }, 6000);
        } else {
            setNodes(architecture.nodes);
            setEdges(architecture.edges);
        }

        prevArchitectureRef.current = architecture;

        return () => {
            if (diffTimeoutRef.current) clearTimeout(diffTimeoutRef.current);
        };
    }, [architecture]);

    const onExportClick = () => {
        const rfElement = document.querySelector('.react-flow') as HTMLElement;
        if (rfElement) {
            toPng(rfElement, {
                filter: (node) => !(node.classList && node.classList.contains('react-flow__panel')),
            }).then((dataUrl) => {
                const a = document.createElement('a');
                a.setAttribute('download', 'architecture.png');
                a.setAttribute('href', dataUrl);
                a.click();
            });
        }
    };

    return (
        <div className="w-full h-full relative bg-[#0a0f1d] flex flex-col overflow-hidden">
            {/* Diff glow keyframes */}
            <style>{`
                @keyframes pulseGreen {
                    0%, 100% { box-shadow: 0 0 20px rgba(34,197,94,0.4), 0 0 40px rgba(34,197,94,0.1); }
                    50% { box-shadow: 0 0 30px rgba(34,197,94,0.7), 0 0 60px rgba(34,197,94,0.3); }
                }
                @keyframes pulseYellow {
                    0%, 100% { box-shadow: 0 0 20px rgba(234,179,8,0.4), 0 0 40px rgba(234,179,8,0.1); }
                    50% { box-shadow: 0 0 30px rgba(234,179,8,0.7), 0 0 60px rgba(234,179,8,0.3); }
                }
            `}</style>

            {/* Ambient glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

            {/* Loading overlay */}
            {isGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0f1d]/60 backdrop-blur-md z-50">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full blur-xl bg-blue-500/30 animate-pulse" />
                        <Loader2 className="h-14 w-14 text-blue-400 animate-spin relative z-10" />
                    </div>
                    <h3 className="text-2xl font-semibold text-white mt-6 tracking-tight">Architecting System...</h3>
                    <p className="text-blue-200/60 mt-2 text-sm max-w-sm text-center">
                        DevArchitect AI is connecting components and designing your system blueprint.
                    </p>
                </div>
            )}

            <div className="flex-1 relative pb-12">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={memoizedNodeTypes}
                    fitView
                    className="dark"
                    proOptions={{ hideAttribution: true }}
                >
                    <Background color="#1e293b" gap={24} size={1} />
                    <Controls
                        className="bg-black/40 backdrop-blur-xl border-white/10 fill-white/70 shadow-2xl rounded-xl overflow-hidden"
                        position="bottom-left"
                    />

                    {/* Top-right: Export button */}
                    <Panel position="top-right" className="flex flex-col gap-3 m-4 z-40">
                        <button
                            onClick={onExportClick}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] border border-blue-500/50"
                        >
                            <Download size={16} />
                            Export Blueprint
                        </button>
                    </Panel>

                    {/* Top-left: Live cost counter */}
                    {totalCost > 0 && (
                        <Panel position="top-left" className="m-4 z-40">
                            <div className="px-4 py-3 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md shadow-2xl">
                                <CostCounter total={totalCost} prevTotal={prevTotalCost} />
                            </div>
                        </Panel>
                    )}

                    {/* Bottom-center: Diff legend */}
                    <Panel position="bottom-center" className="mb-16 z-40">
                        <DiffLegend visible={showDiffLegend} />
                    </Panel>
                </ReactFlow>
            </div>

            <SummaryPanel summary={architecture?.summary ?? null} />
        </div>
    );
}

export default function ArchitectureCanvas({ isGenerating, architecture }: { isGenerating: boolean; architecture: ArchitectureData }) {
    return (
        <ReactFlowProvider>
            <CanvasInner isGenerating={isGenerating} architecture={architecture} />
        </ReactFlowProvider>
    );
}
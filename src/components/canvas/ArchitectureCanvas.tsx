"use client";

import { useMemo, useEffect, useState } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Panel,
    ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { Download, Loader2 } from "lucide-react";
import { nodeTypes } from "./CustomNodes";
import SummaryPanel from "./SummaryPanel";
import { io } from "socket.io-client";
import { toPng } from "html-to-image";

const initialNodes = [
    { id: "intro", position: { x: 250, y: 250 }, data: { label: "Architecture Canvas" }, type: "ServiceNode" }
];

function CanvasInner({ isGenerating }: { isGenerating: boolean }) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as any);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [summary, setSummary] = useState<any>(null);

    const memoizedNodeTypes = useMemo(() => nodeTypes, []);

    useEffect(() => {
        const socket = io("http://localhost:3001");

        socket.on("generate_canvas_success", (data: any) => {
            if (data.nodes) setNodes(data.nodes);
            if (data.edges) setEdges(data.edges);
            if (data.summary) setSummary(data.summary);
        });

        return () => {
            socket.disconnect();
        };
    }, [setNodes, setEdges]);

    const onExportClick = () => {
        const rfElement = document.querySelector('.react-flow') as HTMLElement;
        if (rfElement) {
            toPng(rfElement, {
                filter: (node) => {
                    // exclude panel controls from image
                    return !(node.classList && node.classList.contains('react-flow__panel'));
                },
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
            {/* Ambient Base Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

            {isGenerating && !summary ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0f1d]/60 backdrop-blur-md z-50 transition-all duration-500">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full blur-xl bg-blue-500/30 animate-pulse"></div>
                        <Loader2 className="h-14 w-14 text-blue-400 animate-spin relative z-10" />
                    </div>
                    <h3 className="text-2xl font-semibold text-white mt-6 tracking-tight">Architecting System...</h3>
                    <p className="text-blue-200/60 mt-2 text-sm max-w-sm text-center font-medium">DevArchitect AI is connecting components and designing your system blueprint.</p>
                </div>
            ) : null}

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
                    <Panel position="top-right" className="flex gap-3 m-6 z-40">
                        <button
                            onClick={onExportClick}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] border border-blue-500/50"
                        >
                            <Download size={16} />
                            Export Blueprint
                        </button>
                    </Panel>
                </ReactFlow>
            </div>

            <SummaryPanel summary={summary} />
        </div>
    );
}

export default function ArchitectureCanvas({ isGenerating }: { isGenerating: boolean }) {
    return (
        <ReactFlowProvider>
            <CanvasInner isGenerating={isGenerating} />
        </ReactFlowProvider>
    )
}

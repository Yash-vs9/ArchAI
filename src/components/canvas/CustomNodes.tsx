import { Handle, Position } from "reactflow";
import { Server, Database, Globe, Layers, HardDrive, Shield } from "lucide-react";
import React from "react";

const nodeConfig: any = {
    ClientNode: { icon: Globe, bg: "bg-blue-900/40", headerBg: "bg-blue-500/10", iconBg: "bg-blue-500/20", iconColor: "text-blue-400", text: "text-blue-100" },
    GatewayNode: { icon: Shield, bg: "bg-indigo-900/40", headerBg: "bg-indigo-500/10", iconBg: "bg-indigo-500/20", iconColor: "text-indigo-400", text: "text-indigo-100" },
    ServiceNode: { icon: Server, bg: "bg-emerald-900/40", headerBg: "bg-emerald-500/10", iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400", text: "text-emerald-100" },
    DatabaseNode: { icon: Database, bg: "bg-orange-900/40", headerBg: "bg-orange-500/10", iconBg: "bg-orange-500/20", iconColor: "text-orange-400", text: "text-orange-100" },
    CacheNode: { icon: Layers, bg: "bg-purple-900/40", headerBg: "bg-purple-500/10", iconBg: "bg-purple-500/20", iconColor: "text-purple-400", text: "text-purple-100" },
    StorageNode: { icon: HardDrive, bg: "bg-cyan-900/40", headerBg: "bg-cyan-500/10", iconBg: "bg-cyan-500/20", iconColor: "text-cyan-400", text: "text-cyan-100" }
};

import { motion } from "framer-motion";

export const CustomNode = ({ data, type }: any) => {
    const config = nodeConfig[type] || nodeConfig.ServiceNode;
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, mass: 1 }}
            className={`flex flex-col min-w-[200px] rounded-xl border border-white/10 ${config.bg} shadow-2xl overflow-hidden backdrop-blur-md`}
        >
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-neutral-400 border-none" />

            <div className={`flex items-center gap-2 p-3 ${config.headerBg} border-b border-white/5`}>
                <div className={`p-1.5 rounded-md ${config.iconBg}`}>
                    <Icon size={14} className={config.iconColor} />
                </div>
                <span className={`font-semibold text-sm tracking-wide ${config.text}`}>{data.label || type}</span>
            </div>

            <div className="p-4 text-sm text-neutral-300 flex flex-col gap-2">
                <p className="text-xs text-neutral-400 leading-relaxed font-medium">{data.description}</p>
                <div className="flex justify-between items-center text-[11px] mt-2 pt-3 border-t border-white/5">
                    <span className="font-semibold text-blue-400/80 px-2 py-1 bg-blue-500/10 rounded-md border border-blue-500/20">{data.tech}</span>
                    {data.costEstimate && <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">{data.costEstimate}</span>}
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-neutral-400 border-none" />
        </motion.div>
    );
};

export const nodeTypes = {
    ClientNode: (props: any) => <CustomNode {...props} type="ClientNode" />,
    GatewayNode: (props: any) => <CustomNode {...props} type="GatewayNode" />,
    ServiceNode: (props: any) => <CustomNode {...props} type="ServiceNode" />,
    DatabaseNode: (props: any) => <CustomNode {...props} type="DatabaseNode" />,
    CacheNode: (props: any) => <CustomNode {...props} type="CacheNode" />,
    StorageNode: (props: any) => <CustomNode {...props} type="StorageNode" />,
    AuthNode: (props: any) => <CustomNode {...props} type="GatewayNode" />,
    CDNNode: (props: any) => <CustomNode {...props} type="ClientNode" />,
    ThirdPartyNode: (props: any) => <CustomNode {...props} type="StorageNode" />,
    QueueNode: (props: any) => <CustomNode {...props} type="CacheNode" />
};

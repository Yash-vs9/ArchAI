"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export function CursorSpotlight() {
    const mouseX = useMotionValue(-1000);
    const mouseY = useMotionValue(-1000);

    // Smooth out the motion
    const smoothX = useSpring(mouseX, { damping: 50, stiffness: 400 });
    const smoothY = useSpring(mouseY, { damping: 50, stiffness: 400 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <motion.div
            className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
            style={{
                background: "radial-gradient(circle 400px at calc(var(--x, 0) * 1px) calc(var(--y, 0) * 1px), rgba(59, 130, 246, 0.1), transparent 80%)",
                x: smoothX,
                y: smoothY,
                translateX: "-50%",
                translateY: "-50%",
                width: "800px",
                height: "800px",
                borderRadius: "50%",
                transformOrigin: "center center"
            }}
        />
    );
}

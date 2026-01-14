import React, { useRef, useEffect, useCallback } from 'react';

/*
 * WaterfallCanvas
 * 
 * Real-time SDR-style waterfall display. Each signal shows up as a colored
 * column that scrolls left as time passes. Strong signals are red/yellow,
 * weak ones are blue/black.
 * 
 * Uses requestAnimationFrame for smooth 60fps updates.
 */
export default function WaterfallCanvas({ packets = [], height = 200, className = '' }) {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const dataBufferRef = useRef([]); // incoming signals queue up here
    const lastTimestampRef = useRef(0); // for dedup - don't draw the same packet twice

    // converts RSSI to a color - weak signals are blue, strong are red
    const getColor = useCallback((rssi) => {
        // typical range: -100 (can barely see it) to -30 (right next to us)
        const normalized = Math.max(0, Math.min(1, (rssi + 100) / 70));

        // gradient: black -> blue -> cyan -> yellow -> red
        if (normalized < 0.25) {
            const t = normalized / 0.25;
            return `rgb(0, 0, ${Math.floor(t * 255)})`;
        } else if (normalized < 0.5) {
            const t = (normalized - 0.25) / 0.25;
            return `rgb(0, ${Math.floor(t * 255)}, 255)`;
        } else if (normalized < 0.75) {
            const t = (normalized - 0.5) / 0.25;
            return `rgb(${Math.floor(t * 255)}, 255, ${Math.floor((1 - t) * 255)})`;
        } else {
            const t = (normalized - 0.75) / 0.25;
            return `rgb(255, ${Math.floor((1 - t) * 255)}, 0)`;
        }
    }, []);

    // main render loop - shifts everything left, draws new column on the right
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;

        // shift the whole image left by 1 pixel
        const imageData = ctx.getImageData(1, 0, width - 1, height);
        ctx.putImageData(imageData, 0, 0);

        // draw the newest signal (if we have one)
        const buffer = dataBufferRef.current;
        if (buffer.length > 0) {
            const latest = buffer.shift();
            const color = getColor(latest.rssi || -70);

            ctx.fillStyle = color;
            ctx.fillRect(width - 1, 0, 1, height);

            // add some noise for visual interest
            const variation = Math.random() * 20 - 10;
            ctx.fillStyle = getColor((latest.rssi || -70) + variation);
            ctx.fillRect(width - 1, height * 0.3, 1, height * 0.4);
        } else {
            // no signal - just draw the noise floor
            ctx.fillStyle = 'rgb(0, 0, 20)';
            ctx.fillRect(width - 1, 0, 1, height);

            // occasional random speckles
            if (Math.random() > 0.8) {
                const y = Math.floor(Math.random() * height);
                ctx.fillStyle = `rgba(0, ${30 + Math.random() * 30}, ${50 + Math.random() * 30}, 0.5)`;
                ctx.fillRect(width - 1, y, 1, 2);
            }
        }

        animationRef.current = requestAnimationFrame(draw);
    }, [getColor]);

    // when new packets come in, add them to the buffer (but skip duplicates)
    useEffect(() => {
        if (packets.length === 0) return;

        const lastProcessedTime = lastTimestampRef.current;

        // find packets we haven't drawn yet
        const newPackets = [];
        for (let i = packets.length - 1; i >= 0; i--) {
            const packet = packets[i];
            const packetTime = packet.timestamp || 0;
            if (packetTime > lastProcessedTime) {
                newPackets.push({
                    rssi: packet.meta?.rssi || -70,
                    freq: packet.meta?.freq || 433.92,
                    timestamp: packetTime,
                });
            }
        }

        if (newPackets.length > 0) {
            dataBufferRef.current.push(...newPackets);
            lastTimestampRef.current = packets[0].timestamp || Date.now();
        }
    }, [packets]);

    // kick off the animation when we mount
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // match canvas resolution to display size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = height;

        // start with a dark background
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgb(0, 0, 10)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        animationRef.current = requestAnimationFrame(draw);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [draw, height]);

    // handle window resize
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = height;
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [height]);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <canvas
                ref={canvasRef}
                className="w-full"
                style={{ height: `${height}px`, imageRendering: 'pixelated' }}
            />
            {/* frequency labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 py-1 text-[10px] font-mono text-cyan-500/50 bg-gradient-to-t from-black/80 to-transparent">
                <span>300 MHz</span>
                <span>433.92 MHz</span>
                <span>868 MHz</span>
                <span>915 MHz</span>
            </div>
            {/* signal strength legend */}
            <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-mono text-dim">
                <span>WEAK</span>
                <div className="w-16 h-2 rounded" style={{
                    background: 'linear-gradient(to right, rgb(0,0,100), rgb(0,255,255), rgb(255,255,0), rgb(255,0,0))'
                }} />
                <span>STRONG</span>
            </div>
        </div>
    );
}

import React, { useEffect } from 'react';
import useStore from '../../store/useStore';
import WaterfallCanvas from '../molecules/WaterfallCanvas';

export default function Spectrum() {
    const radioTraffic = useStore(state => state.radioTraffic);
    const addRadioPacket = useStore(state => state.addRadioPacket);

    // Listen for live updates
    useEffect(() => {
        if (window.soubiAPI?.onRadioTraffic) {
            return window.soubiAPI.onRadioTraffic((packet) => {
                addRadioPacket(packet);
            });
        }
    }, [addRadioPacket]);

    return (
        <div className="h-full flex flex-col p-6 animate-in fade-in">
            {/* Header */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tighter text-white flex items-center gap-2">
                        <span className="text-cyan-neon">///</span> SPECTRUM ANALYZER
                    </h2>
                    <p className="text-dim font-mono text-sm mt-1">SUB-GHZ TRAFFIC MONITOR</p>
                </div>
                <div className="text-xs font-mono text-cyan-neon border border-cyan-neon/30 px-3 py-1 bg-cyan-neon/5">
                    STATUS: LISTENING (433.92 MHz)
                </div>
            </div>

            {/* Real-time Waterfall Visualizer */}
            <div className="mb-6 border border-dim bg-black">
                <WaterfallCanvas
                    packets={radioTraffic}
                    height={180}
                    className="w-full"
                />
            </div>


            {/* Traffic Log */}
            <div className="flex-1 overflow-auto bg-armor border border-dim">
                <table className="w-full text-left text-sm font-mono">
                    <thead className="bg-void text-dim sticky top-0 z-10">
                        <tr>
                            <th className="p-3 border-b border-dim">TIMESTAMP</th>
                            <th className="p-3 border-b border-dim">FREQ (MHz)</th>
                            <th className="p-3 border-b border-dim">SIGNAL</th>
                            <th className="p-3 border-b border-dim">IDENTIFIED PROTOCOL</th>
                            <th className="p-3 border-b border-dim">DATA (HEX)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {radioTraffic.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-dim">
                                    NO SIGNALS DETECTED...
                                </td>
                            </tr>
                        ) : (
                            radioTraffic.map((packet, i) => (
                                <tr key={i} className="border-b border-dim/30 hover:bg-white/5 transition-colors">
                                    <td className="p-3 text-dim">
                                        {new Date(packet.timestamp).toLocaleTimeString()}
                                    </td>
                                    <td className="p-3 text-white">
                                        {packet.meta?.freq || '433.92'}
                                    </td>
                                    <td className="p-3 text-cyan-neon">
                                        {packet.meta?.rssi || '-'} dBm
                                    </td>
                                    <td className="p-3">
                                        {packet.analysis?.name === 'Unknown Signal' ? (
                                            <span className="text-dim">Unknown</span>
                                        ) : (
                                            <span className="text-amber-warn font-bold glow-amber">
                                                {packet.analysis?.name}
                                            </span>
                                        )}
                                        <span className="block text-[10px] text-dim">{packet.analysis?.protocol}</span>
                                    </td>
                                    <td className="p-3 text-dim font-mono text-xs">
                                        {packet.data}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

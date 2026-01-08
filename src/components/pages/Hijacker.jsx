import React, { useState, useEffect } from 'react';
import useStore from '../../store/useStore';
import SoundTx from '../../utils/SoundTx';

export default function Hijacker() {
    const wirelessTraffic = useStore(state => state.wirelessTraffic);
    const addWirelessPacket = useStore(state => state.addWirelessPacket);

    const [prompt, setPrompt] = useState('');
    const [script, setScript] = useState('');
    const [generating, setGenerating] = useState(false);

    // Listen for live updates
    useEffect(() => {
        if (window.soubiAPI?.onWirelessTraffic) {
            return window.soubiAPI.onWirelessTraffic((packet) => {
                addWirelessPacket(packet);
                // Throttle audio to avoid spamming
                if (Math.random() > 0.7) SoundTx.playAlert();
            });
        }
    }, [addWirelessPacket]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setGenerating(true);
        try {
            if (window.soubiAPI?.generatePayload) {
                const result = await window.soubiAPI.generatePayload(prompt);
                if (result.success) {
                    setScript(result.script);
                    SoundTx.playSuccess();
                } else {
                    setScript(`ERROR: ${result.error}`);
                    SoundTx.playError();
                }
            }
        } catch (e) {
            setScript(`ERROR: ${e.message}`);
        } finally {
            setGenerating(false);
        }
    };

    const handleInject = async () => {
        if (!script) return;

        // Wrap in a packet structure familiar to the Ghost Node firmware
        const packet = {
            type: 'INJECT_DUCKY',
            payload: script
        };

        try {
            if (window.soubiAPI?.sendSerial) {
                const result = await window.soubiAPI.sendSerial(packet);
                if (result.success) {
                    console.log('Payload sent:', script);
                    SoundTx.playSuccess();
                    // Minimal alert or toast could go here
                    alert('PAYLOAD SENT TO GHOST NODE');
                } else {
                    SoundTx.playError();
                    alert(`INJECTION FAILED: ${result.error}`);
                }
            }
        } catch (e) {
            alert(`ERROR: ${e.message}`);
        }
    };

    return (
        <div className="h-full flex gap-6 p-6 animate-in fade-in">
            {/* Left Column: Target List */}
            <div className="w-1/2 flex flex-col">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-cyan-neon">///</span> TARGET LIST
                </h2>

                <div className="flex-1 bg-armor border border-dim overflow-auto p-2 space-y-2">
                    {wirelessTraffic.length === 0 ? (
                        <div className="text-center text-dim mt-20">SCANNING 2.4GHz SPECTRUM...</div>
                    ) : (
                        wirelessTraffic.map((target, i) => (
                            <div key={i} className="bg-void border border-dim p-3 hover:border-cyan-neon transition-all group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-white group-hover:text-cyan-neon transition-colors">
                                            {target.meta?.ssid || target.data || 'Unknown Device'}
                                        </div>
                                        {target.analysis?.vendor && (
                                            <div className="text-xs text-amber-warn font-mono mt-1">
                                                VENDOR: {target.analysis.vendor}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs font-mono text-dim">
                                        {target.meta?.rssi || '?'} dBm
                                    </div>
                                </div>
                                <div className="mt-2 flex gap-2">
                                    <button className="text-[10px] bg-dim/20 border border-dim px-2 py-1 hover:bg-cyan-neon/20 hover:text-cyan-neon hover:border-cyan-neon transition-all">
                                        PROFILE
                                    </button>
                                    <button className="text-[10px] bg-dim/20 border border-dim px-2 py-1 hover:bg-red-glitch/20 hover:text-red-glitch hover:border-red-glitch transition-all">
                                        LOG
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Column: Payload Generator */}
            <div className="w-1/2 flex flex-col">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-red-glitch">///</span> PAYLOAD GEN
                </h2>

                <div className="bg-void border border-dim flex-1 flex flex-col p-4">
                    <label className="text-xs text-dim uppercase tracking-widest mb-2">Natural Language Command</label>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. Open cmd and ping 1.1.1.1"
                            className="flex-1 bg-armor border border-dim px-4 py-2 text-white focus:border-cyan-neon outline-none font-mono text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="px-4 bg-cyan-neon/10 border border-cyan-neon text-cyan-neon font-bold hover:bg-cyan-neon/20 transition-all flex items-center"
                        >
                            {generating ? '...' : 'GENERATE'}
                        </button>
                    </div>

                    <label className="text-xs text-dim uppercase tracking-widest mb-2">Generated DuckyScript</label>
                    <textarea
                        value={script}
                        readOnly
                        className="flex-1 bg-black border border-dim p-4 text-green-500 font-mono text-xs resize-none focus:border-dim outline-none"
                        placeholder="// Script will appear here..."
                    />

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleInject}
                            disabled={!script}
                            className={`px-6 py-3 border font-bold transition-all ${script
                                ? 'bg-red-glitch border-red-glitch text-black hover:bg-red-500 glow-red'
                                : 'bg-transparent border-dim text-dim cursor-not-allowed'
                                }`}
                        >
                            INJECT PAYLOAD
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * LoadoutDock - Mission Mode sidebar for grouping assets
 * Per FRONTEND_SPEC.md and PRD.md "Mission Mode"
 * Now with useDroppable for drag-and-drop support
 */

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';

export default function LoadoutDock({ 
  isOpen, 
  assets,
  loadouts,
  selectedLoadoutId,
  onClose,
  onCreateLoadout,
  onDeleteLoadout,
  onSelectLoadout,
  onUpdateItems,
  onEquip,
  onReturn,
}) {
  const [newLoadoutName, setNewLoadoutName] = useState('');
  const [showDebriefModal, setShowDebriefModal] = useState(false);
  const [compromisedItems, setCompromisedItems] = useState([]);

  const selectedLoadout = loadouts.find(l => l.id === selectedLoadoutId);
  const loadoutAssets = selectedLoadout 
    ? assets.filter(a => selectedLoadout.items.includes(a.id))
    : [];
  const isActive = selectedLoadout?.status === 'ACTIVE';

  // Droppable setup for the dock
  const { isOver, setNodeRef } = useDroppable({
    id: 'loadout-dock-drop-zone',
    disabled: !selectedLoadout || isActive,
  });

  // Handle create loadout
  const handleCreateLoadout = async () => {
    if (!newLoadoutName.trim()) return;
    await onCreateLoadout(newLoadoutName);
    setNewLoadoutName('');
  };

  // Handle equip
  const handleEquip = async () => {
    if (!selectedLoadout || loadoutAssets.length === 0) return;
    await onEquip(selectedLoadout.id);
  };

  // Handle return - open debrief modal
  const handleStartReturn = () => {
    if (!selectedLoadout) return;
    setCompromisedItems([]);
    setShowDebriefModal(true);
  };

  // Handle debrief confirmation
  const handleConfirmReturn = async () => {
    if (!selectedLoadout) return;
    await onReturn(selectedLoadout.id, compromisedItems);
    setShowDebriefModal(false);
    setCompromisedItems([]);
  };

  // Toggle compromised item
  const toggleCompromised = (assetId) => {
    setCompromisedItems(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  // Remove item from loadout
  const handleRemoveItem = (assetId) => {
    if (!selectedLoadout || isActive) return;
    const newItems = selectedLoadout.items.filter(id => id !== assetId);
    onUpdateItems(selectedLoadout.id, newItems);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Dock Panel - Droppable Zone */}
      <div 
        ref={setNodeRef}
        className={`
          fixed right-0 top-10 bottom-8
          w-80 bg-armor border-l 
          ${isOver ? 'border-cyan-neon border-l-4 shadow-[0_0_30px_rgba(0,255,255,0.3)]' : 'border-dim'}
          flex flex-col
          z-40
          transition-all duration-200
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Drop Zone Indicator */}
        {isOver && (
          <div className="absolute inset-0 bg-cyan-neon/10 pointer-events-none z-10 flex items-center justify-center">
            <div className="text-cyan-neon text-lg font-bold uppercase animate-pulse">
              DROP TO ADD
            </div>
          </div>
        )}

        {/* Header */}
        <div className="border-b border-dim px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-amber-warn">
            // MISSION MODE
          </h2>
          <button
            onClick={onClose}
            className="text-dim hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Loadout Selector */}
        <div className="border-b border-dim p-4">
          <label className="block text-xs text-dim uppercase tracking-wide mb-2">
            SELECT LOADOUT
          </label>
          <div className="flex gap-2">
            <select
              value={selectedLoadoutId || ''}
              onChange={(e) => onSelectLoadout(e.target.value || null)}
              className="
                flex-1 bg-void border border-dim 
                px-3 py-2 text-sm text-white
                focus:border-amber-warn focus:outline-none
              "
            >
              <option value="">-- Select --</option>
              {loadouts.map(loadout => (
                <option key={loadout.id} value={loadout.id}>
                  {loadout.name} {loadout.status === 'ACTIVE' ? '(ACTIVE)' : ''}
                </option>
              ))}
            </select>
            {selectedLoadout && !isActive && (
              <button
                onClick={() => onDeleteLoadout(selectedLoadout.id)}
                className="px-3 py-2 border border-red-glitch text-red-glitch hover:bg-red-glitch/10 transition-colors text-sm"
                title="Delete Loadout"
              >
                🗑
              </button>
            )}
          </div>

          {/* Create New */}
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newLoadoutName}
              onChange={(e) => setNewLoadoutName(e.target.value)}
              placeholder="New loadout name..."
              className="
                flex-1 bg-void border border-dim 
                px-3 py-2 text-sm text-white
                focus:border-amber-warn focus:outline-none
                placeholder:text-dim
              "
              onKeyDown={(e) => e.key === 'Enter' && handleCreateLoadout()}
            />
            <button
              onClick={handleCreateLoadout}
              disabled={!newLoadoutName.trim()}
              className={`
                px-3 py-2 border text-sm
                ${newLoadoutName.trim() 
                  ? 'border-amber-warn text-amber-warn hover:bg-amber-warn/10' 
                  : 'border-dim text-dim cursor-not-allowed'
                }
              `}
            >
              +
            </button>
          </div>
        </div>

        {/* Loadout Items */}
        <div className="flex-1 overflow-auto p-4">
          {!selectedLoadout ? (
            <div className="text-center text-dim text-sm py-8">
              Select or create a loadout to begin
            </div>
          ) : loadoutAssets.length === 0 ? (
            <div className="text-center text-dim text-sm py-8">
              <p>Loadout empty</p>
              <p className="text-xs mt-2">Drag assets here or click to add</p>
            </div>
          ) : (
            <div className="space-y-2">
              {loadoutAssets.map(asset => (
                <div 
                  key={asset.id}
                  className={`
                    p-3 border 
                    ${asset.status === 'DEPLOYED' 
                      ? 'border-amber-warn bg-amber-warn/5' 
                      : 'border-dim bg-void'
                    }
                    flex items-center gap-3
                  `}
                >
                  <span className={`
                    text-sm font-medium flex-1 truncate
                    ${asset.status === 'DEPLOYED' ? 'text-amber-warn' : 'text-white'}
                  `}>
                    {asset.name}
                  </span>
                  {!isActive && (
                    <button
                      onClick={() => handleRemoveItem(asset.id)}
                      className="text-dim hover:text-red-glitch transition-colors"
                      title="Remove from loadout"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {selectedLoadout && (
          <div className="border-t border-dim p-4">
            {isActive ? (
              // Loadout is ACTIVE - show RETURN button
              <button
                onClick={handleStartReturn}
                className="
                  w-full py-3 text-sm font-bold uppercase tracking-widest
                  border border-cyan-neon text-cyan-neon
                  hover:bg-cyan-neon/10 transition-all
                  glow-cyan
                "
              >
                [RETURN TO BASE]
              </button>
            ) : (
              // Loadout is DORMANT - show EQUIP button
              <button
                onClick={handleEquip}
                disabled={loadoutAssets.length === 0}
                className={`
                  w-full py-3 text-sm font-bold uppercase tracking-widest
                  border transition-all
                  ${loadoutAssets.length > 0
                    ? 'border-amber-warn text-amber-warn hover:bg-amber-warn/10 glow-amber'
                    : 'border-dim text-dim cursor-not-allowed'
                  }
                `}
              >
                [EQUIP LOADOUT] ({loadoutAssets.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Debrief Modal */}
      {showDebriefModal && selectedLoadout && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm"
          onClick={() => setShowDebriefModal(false)}
        >
          <div 
            className="bg-armor border border-cyan-neon w-full max-w-md mx-4 cyber-clip"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-dim px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold uppercase tracking-wide text-cyan-neon">
                // DEBRIEF
              </h2>
              <button
                onClick={() => setShowDebriefModal(false)}
                className="text-dim hover:text-red-glitch transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-dim mb-4">
                Which items captured data and need sanitization?
              </p>
              
              <div className="space-y-2 max-h-64 overflow-auto">
                {loadoutAssets.map(asset => (
                  <label 
                    key={asset.id}
                    className={`
                      flex items-center gap-3 p-3 border cursor-pointer
                      transition-colors
                      ${compromisedItems.includes(asset.id) 
                        ? 'border-red-glitch bg-red-glitch/10' 
                        : 'border-dim hover:border-bright'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={compromisedItems.includes(asset.id)}
                      onChange={() => toggleCompromised(asset.id)}
                      className="sr-only"
                    />
                    <span className={`
                      w-4 h-4 border flex items-center justify-center
                      ${compromisedItems.includes(asset.id) 
                        ? 'border-red-glitch bg-red-glitch text-void' 
                        : 'border-dim'
                      }
                    `}>
                      {compromisedItems.includes(asset.id) && '✓'}
                    </span>
                    <span className="text-sm text-white flex-1">{asset.name}</span>
                    {compromisedItems.includes(asset.id) && (
                      <span className="text-xs text-red-glitch">COMPROMISED</span>
                    )}
                  </label>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowDebriefModal(false)}
                  className="
                    flex-1 py-3 text-sm font-bold uppercase
                    border border-dim text-dim
                    hover:border-bright hover:text-white transition-all
                  "
                >
                  CANCEL
                </button>
                <button
                  onClick={handleConfirmReturn}
                  className="
                    flex-1 py-3 text-sm font-bold uppercase
                    border border-cyan-neon text-cyan-neon
                    hover:bg-cyan-neon/10 transition-all
                    glow-cyan
                  "
                >
                  CONFIRM RETURN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

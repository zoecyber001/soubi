/**
 * TacticalCard
 * 
 * TODO: The drag physics feel a bit floaty, maybe tighten up the DndContext sensors later?
 * Also remember to check if the glow effect kills the framerate on lower-end laptops.
 * 
 * - Zoe
 */

import React, { memo, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// Status colors - honestly, the 'red-glitch' hurts my eyes a bit but it fits the theme.
const STATUS_CONFIG = {
  PRISTINE: {
    borderColor: 'border-cyan-neon',
    bgColor: 'bg-cyan-neon',
    textColor: 'text-cyan-neon',
    glowClass: 'glow-cyan',
    label: 'PRISTINE',
    animate: false,
  },
  COMPROMISED: {
    borderColor: 'border-red-glitch',
    bgColor: 'bg-red-glitch',
    textColor: 'text-red-glitch',
    glowClass: 'glow-red',
    label: 'COMPROMISED',
    animate: true,
  },
  DEPLOYED: {
    borderColor: 'border-amber-warn',
    bgColor: 'bg-amber-warn',
    textColor: 'text-amber-warn',
    glowClass: 'glow-amber',
    label: 'DEPLOYED',
    animate: false,
  },
  BROKEN: {
    borderColor: 'border-gray-600',
    bgColor: 'bg-gray-600',
    textColor: 'text-gray-600',
    glowClass: '',
    label: 'BROKEN',
    animate: false,
  },
  LENT: {
    borderColor: 'border-purple-link',
    bgColor: 'bg-purple-link',
    textColor: 'text-purple-link',
    glowClass: '',
    label: 'LENT',
    animate: false,
  },
};

const CATEGORY_ICONS = {
  RF_TOOLS: '📡',
  NETWORK: '🌐',
  RFID: '💳',
  HARDWARE: '🔧',
  STORAGE: '💾',
  CABLES: '🔌',
  ACCESSORIES: '🎒',
  DEFAULT: '📦',
};

// Helper to handle the custom protocol because Electron pathing is a nightmare
function getImageUrl(imagePath) {
  if (!imagePath) return null;
  return `soubi-asset://${imagePath}`;
}

const TacticalCard = memo(function TacticalCard({ 
  asset, 
  onToggleStatus, 
  onDelete,
  onCardClick,
  onInspect,
  isInLoadout = false,
  missionMode = false,
  isDragOverlay = false,
}) {
  // Draggable setup - only enable in mission mode and when not deployed
  const canDrag = missionMode && asset.status !== 'DEPLOYED' && !isInLoadout;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: asset.id,
    data: { asset },
    disabled: !canDrag,
  });

  const status = STATUS_CONFIG[asset.status] || STATUS_CONFIG.PRISTINE;
  const shortId = asset.id.slice(-4).toUpperCase();
  const categoryIcon = CATEGORY_ICONS[asset.category] || CATEGORY_ICONS.DEFAULT;
  const imageUrl = getImageUrl(asset.image_path);

  // Click fallback because sometimes you just want to tap it.
  // Only valid if we aren't dragging.
  const handleCardClick = () => {
    if (missionMode && onCardClick && asset.status !== 'DEPLOYED') {
      onCardClick(asset.id);
    }
  };

  const handleStatusClick = (e) => {
    e.stopPropagation();
    if (onToggleStatus && (asset.status === 'PRISTINE' || asset.status === 'COMPROMISED')) {
      onToggleStatus(asset.id);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete && confirm(`Decommission "${asset.name}"? This cannot be undone.`)) {
      onDelete(asset.id);
    }
  };

  const canToggle = asset.status === 'PRISTINE' || asset.status === 'COMPROMISED';

  // This style block needs to be performant, it runs on every frame of drag.
  const style = useMemo(() => ({
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: canDrag ? 'grab' : 'pointer',
  }), [transform, isDragging, canDrag]);

  // The ghost card that follows your cursor. Spooky.
  const overlayStyle = useMemo(() => (isDragOverlay ? {
    transform: 'scale(1.05)',
    boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)',
    opacity: 0.9,
  } : {}), [isDragOverlay]);

  return (
    <div 
      ref={setNodeRef}
      style={{ ...style, ...overlayStyle }}
      onClick={handleCardClick}
      {...(canDrag ? { ...listeners, ...attributes } : {})}
      className={`
        relative group
        bg-surface border 
        ${status.borderColor}
        ${missionMode && !isInLoadout && asset.status !== 'DEPLOYED' 
          ? 'hover:border-amber-warn hover:bg-amber-warn/5' 
          : 'hover:border-cyan-neon'
        }
        transition-all duration-150
        w-64 h-80
        cyber-clip
        ${status.glowClass}
        ${isInLoadout ? 'opacity-50' : ''}
        ${isDragging ? 'z-50 scale-105 shadow-2xl' : ''}
        ${isDragOverlay ? 'pointer-events-none' : ''}
      `}
    >
      {/* Status Indicator Bar */}
      <div 
        className={`
          absolute left-0 top-0 bottom-0 w-1
          ${status.bgColor}
          ${status.glowClass}
          ${status.animate ? 'animate-pulse' : ''}
        `}
      />

      {/* ID Badge + Inspect Button */}
      <div className="absolute top-2 right-3 flex items-center gap-2">
        {!isDragOverlay && onInspect && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInspect(asset);
            }}
            className="
              opacity-0 group-hover:opacity-100
              w-5 h-5 flex items-center justify-center
              text-dim hover:text-cyan-neon
              transition-all duration-150
              text-xs
            "
            title="Inspect Asset"
          >
            🔍
          </button>
        )}
        <span className="text-xs text-dim font-mono">ID: {shortId}</span>
      </div>

      {/* IN LOADOUT Badge */}
      {isInLoadout && (
        <div className="absolute top-8 left-4 px-2 py-0.5 bg-amber-warn/20 border border-amber-warn text-amber-warn text-xs uppercase">
          IN LOADOUT
        </div>
      )}

      {/* Drag Handle Indicator */}
      {canDrag && !isInLoadout && !isDragOverlay && (
        <div className="absolute top-2 left-4 opacity-0 group-hover:opacity-100 transition-opacity text-amber-warn text-sm">
          ⋮⋮
        </div>
      )}

      {/* Delete Button - Visible on hover (only when not in loadout and not mission mode) */}
      {!isInLoadout && !missionMode && (
        <button
          onClick={handleDeleteClick}
          className="
            absolute top-2 left-4 
            opacity-0 group-hover:opacity-100
            w-6 h-6 flex items-center justify-center
            text-dim hover:text-red-glitch hover:bg-red-glitch/20
            transition-all duration-150
            border border-transparent hover:border-red-glitch
          "
          title="Decommission Asset"
        >
          🗑️
        </button>
      )}

      {/* Image Container */}
      <div className="p-4 pt-8 flex items-center justify-center h-48">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={asset.name}
            className={`
              max-w-full max-h-full object-contain
              ${isInLoadout ? '' : 'grayscale group-hover:grayscale-0'}
              transition-all duration-300
            `}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`
          ${imageUrl ? 'hidden' : ''}
          w-24 h-24 border-2 border-dim 
          flex flex-col items-center justify-center gap-1
          transition-all duration-300
          group-hover:border-cyan-neon
        `}>
          <span className="text-4xl opacity-50 group-hover:opacity-100 transition-opacity">
            {categoryIcon}
          </span>
          <span className="text-xs text-dim uppercase">NO SIGNAL</span>
        </div>
      </div>

      {/* Info Section */}
      <div className="px-4 pb-4">
        <h3 className="text-lg font-bold text-white tracking-tight uppercase truncate">
          {asset.name}
        </h3>

        <p className="text-xs text-dim uppercase mt-1 tracking-wide">
          {asset.category.replace(/_/g, ' ')}
        </p>

        {/* Status Badge */}
        <button
          onClick={handleStatusClick}
          disabled={!canToggle}
          className={`
            mt-4 flex items-center gap-2
            ${canToggle ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
            transition-opacity
          `}
          title={canToggle ? 'Click to toggle status' : 'Cannot toggle this status'}
        >
          <span 
            className={`
              inline-block w-2 h-2 rounded-full
              ${status.bgColor}
              ${status.animate ? 'animate-pulse' : ''}
            `}
          />
          <span className={`text-xs font-semibold uppercase tracking-wider ${status.textColor}`}>
            {status.label}
          </span>
          {canToggle && (
            <span className="text-xs text-dim opacity-0 group-hover:opacity-100 transition-opacity">
              ⟳
            </span>
          )}
        </button>
      </div>

      {/* Mission Mode Overlay - Drag hint */}
      {missionMode && !isInLoadout && asset.status !== 'DEPLOYED' && !isDragging && !isDragOverlay && (
        <div className="
          absolute inset-0 pointer-events-none
          flex items-center justify-center
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          bg-amber-warn/10
        ">
          <span className="text-amber-warn text-xs font-bold uppercase tracking-wide">
            DRAG TO LOADOUT
          </span>
        </div>
      )}

      {/* Hover Border Glow */}
      <div 
        className={`
          absolute inset-0 pointer-events-none
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300
          border-2 ${missionMode && !isInLoadout ? 'border-amber-warn/50' : 'border-cyan-neon/50'}
          cyber-clip
        `}
      />
    </div>
  );
});

/**
 * DragOverlay version of TacticalCard (simplified for drag preview)
 */
export function TacticalCardDragOverlay({ asset }) {
  return (
    <TacticalCard
      asset={asset}
      missionMode={true}
      isDragOverlay={true}
    />
  );
}

export default TacticalCard;

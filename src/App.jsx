import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import TacticalCard, { TacticalCardDragOverlay } from './components/molecules/TacticalCard';
import AddAssetModal from './components/organisms/AddAssetModal';
import LoadoutDock from './components/organisms/LoadoutDock';
import AssetInspector from './components/organisms/AssetInspector';
import CommandCenter from './components/pages/CommandCenter';
import TitleBar from './components/molecules/TitleBar';
import SettingsModal from './components/organisms/SettingsModal';
import Onboarding from './components/organisms/Onboarding';
import useStore from './store/useStore';

// Main App Entry
// Note to self: The DnD sensors are set to 8px movement to prevent accidental drags when just trying to click.
// If it still feels weird, try increasing to 10px or blaiming the mouse.
export default function App() {
  // Global State via Zustand
  const { 
    assets, loadouts, loading, error, 
    setAssets, setLoadouts, setLoading, setError,
    addAsset, updateAssetStatus, deleteAsset
  } = useStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [missionMode, setMissionMode] = useState(false);
  const [selectedLoadoutId, setSelectedLoadoutId] = useState(null);
  const [activeId, setActiveId] = useState(null); // For drag overlay
  const [inspectedAsset, setInspectedAsset] = useState(null); // For inspector panel
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showSettings, setShowSettings] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'armory'
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PRISTINE' | 'COMPROMISED' | 'DEPLOYED'
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Check localStorage to see if user has completed onboarding
    return !localStorage.getItem('soubi_onboarding_complete');
  });

  // DnD sensors with activation delay to distinguish from clicks
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  // Grab everything on startup. 
  // If the DB gets huge (>10k items), this might need pagination or virtual scroller.
  // For now, it's fine.
  useEffect(() => {
    async function fetchData() {
      try {
        if (window.soubiAPI?.getArmory) {
          const [armoryResult, loadoutsResult] = await Promise.all([
            window.soubiAPI.getArmory(),
            window.soubiAPI.getLoadouts?.() || { success: true, data: [] },
          ]);
          
          if (armoryResult.success) setAssets(armoryResult.data);
          if (loadoutsResult.success) setLoadouts(loadoutsResult.data);
        } else {
          console.log('[SOUBI] Running in browser mode - using static data');
          setAssets([
            {
              id: 'demo-1234-5678-90ab-cdef12345678',
              name: 'Flipper Zero (Demo)',
              category: 'RF_TOOLS',
              status: 'PRISTINE',
              image_path: null,
              logs: [
                { id: '1', timestamp: Date.now(), type: 'CREATED', description: 'Asset registered in system', user: 'System' },
              ],
              files: [],
            },
          ]);
        }
      } catch (err) {
        console.error('[SOUBI] Failed to fetch data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Keyboard shortcuts for the power users
  // Ctrl+N: New Asset, Ctrl+M: Mission Mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setIsModalOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        setMissionMode(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setInspectedAsset(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --------------------------------------------
  // The meat and potatoes: CRUD ops
  // --------------------------------------------

  const handleToggleStatus = useCallback(async (id) => {
    if (!window.soubiAPI?.toggleStatus) {
      const asset = assets.find(a => a.id === id);
      if (asset) {
        updateAssetStatus(id, asset.status === 'PRISTINE' ? 'COMPROMISED' : 'PRISTINE');
      }
      return;
    }

    const result = await window.soubiAPI.toggleStatus(id);
    if (result.success) setAssets(result.data);
  }, []);

  const handleCreateAsset = useCallback(async (formData) => {
    if (!window.soubiAPI?.createAsset) {
      const newAsset = {
        id: `demo-${Date.now()}`,
        name: formData.name,
        category: formData.category,
        status: 'PRISTINE',
        image_path: null,
      };
      addAsset(newAsset);
      return;
    }

    const result = await window.soubiAPI.createAsset(formData);
    if (result.success) setAssets(result.data);
  }, []);

  const handleDeleteAsset = useCallback(async (id) => {
    if (!window.soubiAPI?.deleteAsset) {
      deleteAsset(id);
      return;
    }

    const result = await window.soubiAPI.deleteAsset(id);
    if (result.success) setAssets(result.data);
  }, []);

  // --------------------------------------------
  // Loadout management (The tricky part)
  // --------------------------------------------

  const handleCreateLoadout = useCallback(async (name) => {
    if (!window.soubiAPI?.createLoadout) return;
    const result = await window.soubiAPI.createLoadout(name);
    if (result.success) {
      setLoadouts(result.data);
      setSelectedLoadoutId(result.created?.id || null);
    }
  }, []);

  const handleDeleteLoadout = useCallback(async (id) => {
    if (!window.soubiAPI?.deleteLoadout) return;
    const result = await window.soubiAPI.deleteLoadout(id);
    if (result.success) {
      setLoadouts(result.data);
      if (selectedLoadoutId === id) setSelectedLoadoutId(null);
    }
  }, [selectedLoadoutId]);

  const handleUpdateLoadoutItems = useCallback(async (loadoutId, itemIds) => {
    if (!window.soubiAPI?.updateLoadout) return;
    const result = await window.soubiAPI.updateLoadout(loadoutId, itemIds);
    if (result.success) setLoadouts(result.data);
  }, []);

  const handleEquipLoadout = useCallback(async (loadoutId) => {
    if (!window.soubiAPI?.equipLoadout) return;
    const result = await window.soubiAPI.equipLoadout(loadoutId);
    if (result.success) {
      setAssets(result.assets);
      setLoadouts(result.loadouts);
      if (result.warnings?.length > 0) {
        console.warn('[SOUBI] Equip warnings:', result.warnings);
      }
    } else if (result.conflicts) {
      alert(`Deployment conflict:\n${result.conflicts.join('\n')}`);
    } else {
      alert(result.error || 'Failed to equip loadout');
    }
  }, []);

  const handleReturnLoadout = useCallback(async (loadoutId, compromisedItems) => {
    if (!window.soubiAPI?.returnLoadout) return;
    const result = await window.soubiAPI.returnLoadout(loadoutId, compromisedItems);
    if (result.success) {
      setAssets(result.assets);
      setLoadouts(result.loadouts);
    }
  }, []);

  // Click fallback for adding to loadout
  const handleCardClick = useCallback(async (assetId) => {
    if (!selectedLoadoutId) return;
    
    const loadout = loadouts.find(l => l.id === selectedLoadoutId);
    if (!loadout || loadout.status === 'ACTIVE') return;

    const newItems = loadout.items.includes(assetId)
      ? loadout.items.filter(id => id !== assetId)
      : [...loadout.items, assetId];

    await handleUpdateLoadoutItems(selectedLoadoutId, newItems);
  }, [selectedLoadoutId, loadouts, handleUpdateLoadoutItems]);

  // ============================================
  // INSPECTOR HANDLERS
  // ============================================

  const handleInspect = useCallback((asset) => {
    setInspectedAsset(asset);
  }, []);

  const handleAddFile = useCallback(async (assetId, filePath) => {
    if (!window.soubiAPI?.addFile) return;
    const result = await window.soubiAPI.addFile(assetId, filePath);
    if (result.success) {
      setAssets(result.data);
      // Update the inspected asset if it's the one we modified
      if (inspectedAsset?.id === assetId && result.asset) {
        setInspectedAsset(result.asset);
      }
    }
  }, [inspectedAsset]);

  const handleRemoveFile = useCallback(async (assetId, filePath) => {
    if (!window.soubiAPI?.removeFile) return;
    const result = await window.soubiAPI.removeFile(assetId, filePath);
    if (result.success) {
      setAssets(result.data);
      // Update the inspected asset
      const updatedAsset = result.data.find(a => a.id === assetId);
      if (inspectedAsset?.id === assetId && updatedAsset) {
        setInspectedAsset(updatedAsset);
      }
    }
  }, [inspectedAsset]);

  const handleOpenFile = useCallback(async (filePath) => {
    if (!window.soubiAPI?.openFile) return;
    await window.soubiAPI.openFile(filePath);
  }, []);

  // ============================================
  // DRAG AND DROP HANDLERS
  // ============================================

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    // Check if dropped over the loadout dock
    if (over && over.id === 'loadout-dock-drop-zone' && selectedLoadoutId) {
      const loadout = loadouts.find(l => l.id === selectedLoadoutId);
      if (!loadout || loadout.status === 'ACTIVE') return;

      const assetId = active.id;
      
      // Only add if not already in loadout
      if (!loadout.items.includes(assetId)) {
        const newItems = [...loadout.items, assetId];
        await handleUpdateLoadoutItems(selectedLoadoutId, newItems);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Get active asset for drag overlay
  const activeAsset = activeId ? assets.find(a => a.id === activeId) : null;

  // Get which assets are in the selected loadout
  const selectedLoadout = loadouts.find(l => l.id === selectedLoadoutId);
  const loadoutItemIds = selectedLoadout?.items || [];

  // Filter assets based on selected filter
  const filteredAssets = filterStatus === 'ALL' 
    ? assets 
    : assets.filter(a => a.status === filterStatus);

  // Calculate stats
  const totalAssets = assets.length;
  const compromisedCount = assets.filter(a => a.status === 'COMPROMISED').length;
  const deployedCount = assets.filter(a => a.status === 'DEPLOYED').length;
  const readyAssets = assets.filter(a => a.status !== 'COMPROMISED' && a.status !== 'BROKEN').length;
  const readinessPercent = totalAssets > 0 ? Math.round((readyAssets / totalAssets) * 100) : 100;

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    localStorage.setItem('soubi_onboarding_complete', 'true');
    setShowOnboarding(false);
  };

  // Show onboarding for first-time users
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="h-full bg-void text-white overflow-hidden flex flex-col font-mono">
        {/* Custom Title Bar */}
        <TitleBar 
          onOpenSettings={() => setShowSettings(true)} 
          onHome={() => setCurrentView('dashboard')} 
        />

        {/* Main Content */}
        <main className={`flex-1 overflow-auto p-6 bg-void transition-all ${missionMode ? 'mr-80' : ''}`}>
          {currentView === 'dashboard' ? (
            <CommandCenter 
              onViewArmory={() => setCurrentView('armory')} 
            />
          ) : (
            <>
          {/* HUD Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight uppercase flex items-center gap-3">
                <span className="text-cyan-neon">//</span>
                <span className="text-white">THE ARMORY</span>
                {missionMode && (
                  <span className="text-amber-warn text-sm animate-pulse">[MISSION MODE]</span>
                )}
              </h1>
              
              {/* Status Bar */}
              <div className="mt-4 flex items-center gap-6 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-dim">TOTAL:</span>
                  <span className="text-white font-bold">{totalAssets}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-dim">READINESS:</span>
                  <div className="w-32 h-2 bg-armor rounded overflow-hidden border border-dim">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        readinessPercent >= 80 ? 'bg-cyan-neon' : 
                        readinessPercent >= 50 ? 'bg-amber-warn' : 'bg-red-glitch'
                      }`}
                      style={{ width: `${readinessPercent}%` }}
                    />
                  </div>
                  <span className={`font-bold ${
                    readinessPercent >= 80 ? 'text-cyan-neon' : 
                    readinessPercent >= 50 ? 'text-amber-warn' : 'text-red-glitch'
                  }`}>{readinessPercent}%</span>
                </div>
                {deployedCount > 0 && (
                  <div className="flex items-center gap-2 text-amber-warn">
                    <span>🎯</span>
                    <span>{deployedCount} DEPLOYED</span>
                  </div>
                )}
                {compromisedCount > 0 && (
                  <div className="flex items-center gap-2 text-red-glitch animate-pulse">
                    <span>⚠</span>
                    <span>{compromisedCount} COMPROMISED</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setMissionMode(prev => !prev)}
                className={`
                  px-4 py-2 text-xs font-bold uppercase tracking-wide
                  border transition-all flex items-center gap-2
                  ${missionMode 
                    ? 'bg-amber-warn/10 border-amber-warn text-amber-warn glow-amber' 
                    : 'border-dim text-dim hover:border-amber-warn hover:text-amber-warn'
                  }
                `}
              >
                <span>🎯</span>
                <span>MISSION</span>
                <span className="text-dim text-xs">[Ctrl+M]</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="
                  px-4 py-2 bg-cyan-neon/10 border border-cyan-neon text-cyan-neon
                  text-xs font-bold uppercase tracking-wide
                  hover:bg-cyan-neon/20 transition-all flex items-center gap-2
                "
                title="Ctrl+N"
              >
                <span>+</span>
                <span>NEW ASSET</span>
                <span className="text-cyan-neon/50 text-xs">[Ctrl+N]</span>
              </button>
            </div>
          </div>

          {/* Filter Bar & View Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {['ALL', 'PRISTINE', 'COMPROMISED', 'DEPLOYED'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterStatus(filter)}
                  className={`
                    px-4 py-2 text-xs font-medium uppercase tracking-wide
                    border transition-all duration-150
                    ${filterStatus === filter 
                      ? 'bg-cyan-neon/10 border-cyan-neon text-cyan-neon' 
                      : 'bg-armor border-dim text-dim hover:text-white hover:border-bright'
                    }
                  `}
                >
                  [{filter}]
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex bg-armor border border-dim p-1 gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'text-cyan-neon bg-dim/30' : 'text-dim hover:text-white'}`}
                title="Grid View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 10v-4h4v4h-4zm-6 0v-4h4v4h-4zm0 6v-4h4v4h-4zm6 0v-4h4v4h-4zm6-6v-4h4v4h-4zm0 6v-4h4v4h-4zm-12 6v-4h4v4h-4zm6 0v-4h4v4h-4zm6 0v-4h4v4h-4z"/></svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 transition-colors ${viewMode === 'list' ? 'text-cyan-neon bg-dim/30' : 'text-dim hover:text-white'}`}
                title="List View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10h16v2h-16zm0-4h16v2h-16zm0 8h16v2h-16z"/></svg>
              </button>
            </div>
          </div>

          {/* Loading/Error/Empty States */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-cyan-neon animate-pulse">LOADING ARMORY...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-glitch/10 border border-red-glitch p-4 mb-6">
              <span className="text-red-glitch">ERROR: {error}</span>
            </div>
          )}

          {!loading && !error && assets.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-dim">
              <span className="text-4xl mb-4">📦</span>
              <span>ARMORY EMPTY</span>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-4 py-2 border border-cyan-neon text-cyan-neon text-xs uppercase hover:bg-cyan-neon/10 transition-all"
              >
                + Add Your First Asset
              </button>
            </div>
          )}

          {/* No results for current filter */}
          {!loading && assets.length > 0 && filteredAssets.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-dim">
              <span className="text-4xl mb-4">🔍</span>
              <span>NO {filterStatus} ASSETS</span>
              <button 
                onClick={() => setFilterStatus('ALL')}
                className="mt-4 px-4 py-2 border border-dim text-dim text-xs uppercase hover:border-cyan-neon hover:text-cyan-neon transition-all"
              >
                Clear Filter
              </button>
            </div>
          )}

          {/* Asset Grid / List */}
          {!loading && filteredAssets.length > 0 && (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAssets.map((asset) => (
                  <TacticalCard 
                    key={asset.id} 
                    asset={asset} 
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDeleteAsset}
                    onCardClick={handleCardClick}
                    onInspect={handleInspect}
                    isInLoadout={loadoutItemIds.includes(asset.id)}
                    missionMode={missionMode}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAssets.map((asset) => (
                  <div 
                    key={asset.id}
                    className={`
                      relative group flex items-center justify-between p-4
                      bg-armor border border-dim
                      hover:border-cyan-neon transition-all
                      ${loadoutItemIds.includes(asset.id) ? 'opacity-50' : ''}
                    `}
                    onClick={() => handleCardClick(asset.id)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Status Badge (Clickable) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (asset.status !== 'DEPLOYED') {
                            handleToggleStatus(asset.id);
                          }
                        }}
                        className={`
                          px-2 py-1 text-xs font-bold border
                          transition-all duration-150 uppercase tracking-wider
                          ${asset.status === 'PRISTINE' 
                            ? 'border-cyan-neon text-cyan-neon bg-cyan-neon/10 hover:bg-cyan-neon/20' 
                            : asset.status === 'COMPROMISED' 
                              ? 'border-red-glitch text-red-glitch bg-red-glitch/10 hover:bg-red-glitch/20 animate-pulse' 
                              : asset.status === 'DEPLOYED'
                                ? 'border-amber-warn text-amber-warn bg-amber-warn/10'
                                : 'border-gray-500 text-gray-500'
                          }
                          ${asset.status !== 'DEPLOYED' ? 'cursor-pointer' : 'cursor-default opacity-50'}
                        `}
                        title={asset.status === 'DEPLOYED' ? 'Deployed (Cannot Toggle)' : 'Click to Toggle Status'}
                      >
                        {asset.status}
                      </button>
                      
                      <div className="flex flex-col">
                        <span className="font-bold text-white uppercase tracking-wider">{asset.name}</span>
                        <div className="flex gap-3 text-xs text-dim font-mono">
                          <span>ID: {asset.id.substring(0, 8)}</span>
                          <span className="text-dim/50">|</span>
                          <span className="text-cyan-neon/70">{asset.category.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspect(asset);
                        }}
                        className="
                          w-8 h-8 flex items-center justify-center
                          text-dim hover:text-cyan-neon hover:bg-cyan-neon/10 
                          border border-transparent hover:border-cyan-neon/30
                          transition-all
                        "
                        title="Inspect"
                      >
                        🔍
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this asset?')) {
                            handleDeleteAsset(asset.id);
                          }
                        }}
                        className="
                          w-8 h-8 flex items-center justify-center
                          text-dim hover:text-red-glitch hover:bg-red-glitch/10 
                          border border-transparent hover:border-red-glitch/30
                          transition-all
                        "
                        title="Delete Asset"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
          </>
        )}
        </main>

        {/* Footer */}
        <footer className="h-8 bg-armor border-t border-dim flex items-center px-4 text-xs text-dim">
          <span>SOUBI v0.1.0</span>
          <span className="mx-2 text-bright">|</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-neon animate-pulse glow-cyan" />
            <span className="text-cyan-neon">SYSTEM ONLINE</span>
          </span>
          <span className="mx-2 text-bright">|</span>
          <span>{window.soubiAPI ? 'ELECTRON' : 'BROWSER MODE'}</span>
          {loadouts.filter(l => l.status === 'ACTIVE').length > 0 && (
            <>
              <span className="mx-2 text-bright">|</span>
              <span className="text-amber-warn">
                {loadouts.filter(l => l.status === 'ACTIVE').length} ACTIVE LOADOUT
              </span>
            </>
          )}
        </footer>

        {/* Settings Modal */}
      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)} 
          onReplayOnboarding={() => setShowOnboarding(true)}
        />
      )}

      {/* Modals & Drag Overlay */}
      <AddAssetModal
        isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateAsset}
        />

        <LoadoutDock
          isOpen={missionMode}
          assets={assets}
          loadouts={loadouts}
          selectedLoadoutId={selectedLoadoutId}
          onClose={() => setMissionMode(false)}
          onCreateLoadout={handleCreateLoadout}
          onDeleteLoadout={handleDeleteLoadout}
          onSelectLoadout={setSelectedLoadoutId}
          onUpdateItems={handleUpdateLoadoutItems}
          onEquip={handleEquipLoadout}
          onReturn={handleReturnLoadout}
        />

        <AssetInspector
          isOpen={!!inspectedAsset}
          asset={inspectedAsset}
          onClose={() => setInspectedAsset(null)}
          onAddFile={handleAddFile}
          onRemoveFile={handleRemoveFile}
          onOpenFile={handleOpenFile}
        />
      </div>

      {/* Drag Overlay - Ghost card following cursor */}
      {/* Drag Overlay - Ghost card following cursor */}
      <DragOverlay style={{ zIndex: 1000 }}>
        {activeAsset ? (
          <TacticalCardDragOverlay asset={activeAsset} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

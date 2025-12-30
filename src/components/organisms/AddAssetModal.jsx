/**
 * AddAssetModal - Modal for creating new assets
 * Per FRONTEND_SPEC.md and PRD.md Section 4.1
 */

import { useState } from 'react';

// Asset categories from BACKEND_SPEC.md
const CATEGORIES = [
  { value: 'RF_TOOLS', label: 'RF Tools' },
  { value: 'NETWORK', label: 'Network' },
  { value: 'RFID', label: 'RFID' },
  { value: 'HARDWARE', label: 'Hardware' },
  { value: 'STORAGE', label: 'Storage' },
  { value: 'CABLES', label: 'Cables' },
  { value: 'ACCESSORIES', label: 'Accessories' },
];

export default function AddAssetModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'RF_TOOLS',
    serial_number: '',
    notes: '',
    imagePath: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle image selection
  const handleSelectImage = async () => {
    if (!window.soubiAPI?.selectImage) {
      console.warn('[Modal] selectImage not available');
      return;
    }

    const result = await window.soubiAPI.selectImage();
    if (result.success && result.filePath) {
      setFormData(prev => ({ ...prev, imagePath: result.filePath }));
      setImagePreview(result.filePath);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return; // Name is required
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        name: '',
        category: 'RF_TOOLS',
        serial_number: '',
        notes: '',
        imagePath: null,
      });
      setImagePreview(null);
      onClose();
    } catch (error) {
      console.error('[Modal] Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        category: 'RF_TOOLS',
        serial_number: '',
        notes: '',
        imagePath: null,
      });
      setImagePreview(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm"
      onClick={handleClose}
    >
      {/* Modal Content */}
      <div 
        className="bg-armor border border-cyan-neon w-full max-w-lg mx-4 cyber-clip"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-dim px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold uppercase tracking-wide text-cyan-neon">
            // NEW ASSET
          </h2>
          <button
            onClick={handleClose}
            className="text-dim hover:text-red-glitch transition-colors text-xl"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-xs text-dim uppercase tracking-wide mb-2">
              DESIGNATION *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Flipper Zero"
              required
              className="
                w-full bg-void border border-dim 
                px-4 py-3 text-sm text-white
                focus:border-cyan-neon focus:outline-none
                placeholder:text-dim
                transition-colors
              "
            />
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-xs text-dim uppercase tracking-wide mb-2">
              CATEGORY
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="
                w-full bg-void border border-dim 
                px-4 py-3 text-sm text-white
                focus:border-cyan-neon focus:outline-none
                cursor-pointer
              "
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Serial Number Input */}
          <div>
            <label className="block text-xs text-dim uppercase tracking-wide mb-2">
              SERIAL / MAC
            </label>
            <input
              type="text"
              name="serial_number"
              value={formData.serial_number}
              onChange={handleChange}
              placeholder="e.g. FZ-1234-5678"
              className="
                w-full bg-void border border-dim 
                px-4 py-3 text-sm text-white
                focus:border-cyan-neon focus:outline-none
                placeholder:text-dim
                transition-colors
              "
            />
          </div>

          {/* Image Drop Zone */}
          <div>
            <label className="block text-xs text-dim uppercase tracking-wide mb-2">
              DEVICE IMAGE
            </label>
            <button
              type="button"
              onClick={handleSelectImage}
              className={`
                w-full h-32 border-2 border-dashed 
                flex flex-col items-center justify-center gap-2
                transition-all cursor-pointer
                ${imagePreview 
                  ? 'border-cyan-neon bg-cyan-neon/5' 
                  : 'border-dim hover:border-bright hover:bg-dim/20'
                }
              `}
            >
              {imagePreview ? (
                <>
                  <span className="text-cyan-neon text-2xl">✓</span>
                  <span className="text-xs text-cyan-neon">IMAGE SELECTED</span>
                  <span className="text-xs text-dim truncate max-w-full px-4">
                    {imagePreview.split(/[/\\]/).pop()}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-2xl text-dim">📷</span>
                  <span className="text-xs text-dim">CLICK TO SELECT IMAGE</span>
                </>
              )}
            </button>
          </div>

          {/* Notes Textarea */}
          <div>
            <label className="block text-xs text-dim uppercase tracking-wide mb-2">
              NOTES
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Optional notes about this asset..."
              rows={3}
              className="
                w-full bg-void border border-dim 
                px-4 py-3 text-sm text-white
                focus:border-cyan-neon focus:outline-none
                placeholder:text-dim
                resize-none
                transition-colors
              "
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className={`
                w-full py-3 text-sm font-bold uppercase tracking-widest
                border transition-all
                ${loading || !formData.name.trim()
                  ? 'bg-dim/20 border-dim text-dim cursor-not-allowed'
                  : 'bg-cyan-neon/10 border-cyan-neon text-cyan-neon hover:bg-cyan-neon/20 glow-cyan'
                }
              `}
            >
              {loading ? 'PROCESSING...' : '[ADD TO ARMORY]'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

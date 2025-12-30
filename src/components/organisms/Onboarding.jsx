/**
 * Onboarding - First-time user experience
 * Shows a welcome flow when the armory is empty and user hasn't completed onboarding
 */

import { useState, useEffect } from 'react';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    icon: '⚔️',
    title: 'WELCOME, OPERATOR',
    subtitle: '装備 // SOUBI TACTICAL SYSTEM',
    description: 'You just unlocked your personal armory tracker. Track every piece of gear, know what\'s deployed, and never show up to an engagement missing cables again.',
    tip: '💡 Pro tip: Use Ctrl+N to quickly add assets.',
  },
  {
    id: 'armory',
    icon: '📦',
    title: 'THE ARMORY',
    subtitle: 'YOUR DIGITAL GEAR LOCKER',
    description: 'Every Flipper, every Pineapple, every sketchy USB cable — tracked. Mark items as PRISTINE (clean), COMPROMISED (has data), or DEPLOYED (in the field).',
    tip: '💡 Attach photos and docs to each asset for quick reference.',
  },
  {
    id: 'loadouts',
    icon: '🎯',
    title: 'MISSION MODE',
    subtitle: 'PACK. DEPLOY. DEBRIEF.',
    description: 'Group your gear into loadouts like "WiFi Audit Kit" or "Physical Entry Pack". Drag assets in, hit EQUIP, and when you\'re back — mark what captured data.',
    tip: '💡 Use Ctrl+M to toggle Mission Mode instantly.',
  },
  {
    id: 'locker',
    icon: '📎',
    title: 'THE LOCKER',
    subtitle: 'DOCS, SCRIPTS, FIRMWARE',
    description: 'Each asset has a digital locker. Attach firmware ZIPs, cheat sheets, or scripts. Double-click to open. Your gear comes with its manual — always.',
    tip: '💡 Click the 🔍 icon on any card to inspect its locker.',
  },
  {
    id: 'security',
    icon: '🔒',
    title: 'ZERO CLOUD POLICY',
    subtitle: 'YOUR DATA. YOUR MACHINE. PERIOD.',
    description: 'SOUBI never phones home. No analytics. No updates. No accounts. Everything lives in a local JSON file you can export, wipe, or nuke from orbit.',
    tip: '💡 Use Settings → Export Data to backup your armory.',
  },
  {
    id: 'ready',
    icon: '🚀',
    title: 'SYSTEM READY',
    subtitle: 'OPERATIONAL STATUS: GREEN',
    description: 'You\'re cleared for deployment. Add your first asset, build a loadout, and own your inventory. The Command Center awaits.',
    tip: '// "An organized operator is a dangerous operator."',
  },
];

export default function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayStep, setDisplayStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [exitPhase, setExitPhase] = useState(0); // 0: none, 1: glitch, 2: zoom, 3: boot text, 4: fade

  const step = ONBOARDING_STEPS[displayStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      // Trigger epic exit sequence
      setIsExiting(true);
      setExitPhase(1); // glitch
      setTimeout(() => setExitPhase(2), 400);  // zoom out
      setTimeout(() => setExitPhase(3), 800);  // boot text
      setTimeout(() => setExitPhase(4), 2200); // fade out
      setTimeout(() => onComplete(), 2800);    // complete
    } else {
      // Trigger transition
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setDisplayStep(prev => prev + 1);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const handleStepClick = (idx) => {
    if (idx !== currentStep) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(idx);
        setDisplayStep(idx);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  // Keyboard support - Enter to continue
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, isLastStep]);

  // Boot sequence messages
  const bootMessages = [
    '> INITIALIZING SOUBI SYSTEM...',
    '> LOADING ARMORY DATABASE...',
    '> AUTHENTICATING LOCAL OPERATOR...',
    '> ESTABLISHING SECURE PROTOCOLS...',
    '> COMMAND CENTER: ONLINE',
    '',
    '// WELCOME, OPERATOR.',
  ];

  // Exit animation overlay
  if (isExiting) {
    return (
      <div className={`
        fixed inset-0 z-50 bg-void flex items-center justify-center overflow-hidden
        ${exitPhase === 4 ? 'opacity-0' : 'opacity-100'}
        transition-opacity duration-500
      `}>
        {/* Glitch Effect Layer */}
        {exitPhase === 1 && (
          <div className="absolute inset-0 animate-pulse">
            <div className="absolute inset-0 bg-cyan-neon/20" style={{
              animation: 'glitch 0.1s infinite',
              clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)',
            }} />
            <div className="absolute inset-0 bg-red-glitch/20" style={{
              animation: 'glitch 0.15s infinite reverse',
              clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)',
            }} />
          </div>
        )}

        {/* Zoom Out Effect */}
        <div className={`
          transition-all duration-700 ease-out
          ${exitPhase >= 2 ? 'scale-50 opacity-0' : 'scale-100 opacity-100'}
        `}>
          {exitPhase < 3 && (
            <div className="text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h1 className="text-2xl font-bold text-cyan-neon tracking-wider">
                SYSTEM READY
              </h1>
            </div>
          )}
        </div>

        {/* Boot Sequence Text */}
        {exitPhase >= 3 && exitPhase < 4 && (
          <div className="absolute inset-0 bg-void flex flex-col items-start justify-center p-8 font-mono">
            <div className="max-w-2xl mx-auto w-full">
              {bootMessages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`
                    text-sm mb-1
                    ${msg.startsWith('//') ? 'text-cyan-neon font-bold text-lg mt-4' : 'text-dim'}
                    ${msg.includes('ONLINE') ? 'text-cyan-neon' : ''}
                  `}
                  style={{
                    animation: `fadeSlideIn 0.15s ease-out ${idx * 0.15}s both`,
                  }}
                >
                  {msg}
                </div>
              ))}
            </div>

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.1) 2px, rgba(0,240,255,0.1) 4px)',
            }} />
          </div>
        )}

        {/* CSS Animations */}
        <style>{`
          @keyframes glitch {
            0% { transform: translate(0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(2px, -2px); }
            60% { transform: translate(-2px, -2px); }
            80% { transform: translate(2px, 2px); }
            100% { transform: translate(0); }
          }
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-void flex items-center justify-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 50px,
            rgba(0,240,255,0.1) 50px,
            rgba(0,240,255,0.1) 51px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 50px,
            rgba(0,240,255,0.1) 50px,
            rgba(0,240,255,0.1) 51px
          )`
        }} />
      </div>

      {/* Content Card */}
      <div className="relative w-full max-w-lg mx-4">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {ONBOARDING_STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => handleStepClick(idx)}
              className={`
                h-2 rounded-full transition-all duration-300
                ${idx === currentStep 
                  ? 'bg-cyan-neon w-6' 
                  : idx < currentStep 
                    ? 'bg-cyan-neon/50 w-2' 
                    : 'bg-dim w-2'
                }
              `}
            />
          ))}
        </div>

        {/* Card with Transitions */}
        <div className="bg-armor border border-cyan-neon p-8 text-center cyber-clip overflow-hidden">
          {/* Animated Content */}
          <div className={`
            transition-all duration-200 ease-out
            ${isTransitioning 
              ? 'opacity-0 transform translate-y-4' 
              : 'opacity-100 transform translate-y-0'
            }
          `}>
            {/* Icon */}
            <div className="text-6xl mb-6 transition-transform duration-300 hover:scale-110">
              {step.icon}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-cyan-neon tracking-wider mb-2">
              {step.title}
            </h1>
            <p className="text-xs text-dim uppercase tracking-widest mb-6">
              {step.subtitle}
            </p>

            {/* Description */}
            <p className="text-sm text-white/80 leading-relaxed mb-4">
              {step.description}
            </p>

            {/* Pro Tip */}
            {step.tip && (
              <p className="text-xs text-cyan-neon/70 italic mb-6 px-4 py-2 bg-cyan-neon/5 border-l-2 border-cyan-neon/30">
                {step.tip}
              </p>
            )}
          </div>

          {/* Actions - Always visible */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleSkip}
              className="px-6 py-3 text-xs text-dim uppercase tracking-wide hover:text-white transition-colors duration-200"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-cyan-neon/10 border border-cyan-neon text-cyan-neon text-xs font-bold uppercase tracking-wide hover:bg-cyan-neon/20 hover:scale-105 transition-all duration-200 glow-cyan"
            >
              {isLastStep ? '[BEGIN OPERATIONS]' : 'NEXT →'}
            </button>
          </div>
        </div>

        {/* Keyboard Hint */}
        <p className="text-center text-xs text-dim mt-6">
          Press <span className="text-cyan-neon">Enter</span> to continue
        </p>
      </div>
    </div>
  );
}

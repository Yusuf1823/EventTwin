import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTutorial } from './TutorialContext';
import { useSpotlightRect } from './useSpotlightRect';
import { X, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { TUTORIAL_STEPS } from './TutorialConfig';
import confetti from 'canvas-confetti';
import { cn } from '../ui/cn';

export const TutorialOverlay: React.FC = () => {
  const { isActive, currentStepIndex, currentStep, nextStep, prevStep, skipTutorial, finishTutorial, goToStep, tutorialData, isActionCompleted, canSkipAction } = useTutorial();
  const rect = useSpotlightRect(currentStep?.targetSelector || '', isActive);

  useEffect(() => {
    if (!isActive) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const isNextAllowed = true;
      
      if ((e.key === 'ArrowRight' || e.key === 'Enter') && isNextAllowed) {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevStep();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        skipTutorial();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, nextStep, prevStep, skipTutorial, currentStep, isActionCompleted, canSkipAction]);

  if (!isActive || !currentStep) return null;

  const handleNext = () => {
    if (currentStepIndex === TUTORIAL_STEPS.length - 1) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
    nextStep();
  };

  const handleActionClick = () => {
    if (currentStep.actionButtonOnClick) {
      currentStep.actionButtonOnClick();
    }
  };

  const PADDING = 12;
  const radius = 12;

  const isNextDisabled = false;

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-auto">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - PADDING}
                y={rect.top - PADDING}
                width={rect.width + PADDING * 2}
                height={rect.height + PADDING * 2}
                rx={radius}
                ry={radius}
                fill="black"
                style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            )}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(5, 8, 15, 0.85)" mask="url(#spotlight-mask)" />
      </svg>
      
      {/* Tooltip Dialog */}
      {rect && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorial-title"
          aria-describedby="tutorial-desc"
          className="absolute z-[10000] glass-panel p-5 rounded-2xl border border-cyan-500/40 shadow-2xl shadow-cyan-900/30 w-[calc(100vw-32px)] sm:w-[340px] pointer-events-auto"
          style={{
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            top: currentStep.placement === 'top' 
              ? Math.max(16, rect.top - PADDING - 16 - 180)
              : Math.min(window.innerHeight - 180 - 16, rect.bottom + PADDING + 16),
            left: currentStep.placement === 'left'
              ? Math.max(16, rect.left - PADDING - 16 - 340)
              : currentStep.placement === 'right'
              ? Math.min(window.innerWidth - 340 - 16, rect.right + PADDING + 16)
              : Math.max(16, Math.min(window.innerWidth - 340 - 16, rect.left)),
          }}
        >
          {/* Directional Arrow */}
          <div className="absolute w-4 h-4 bg-[#0a0f1c] border border-cyan-500/40 transform rotate-45 pointer-events-none" 
            style={{
              [currentStep.placement === 'top' ? 'bottom' : currentStep.placement === 'bottom' ? 'top' : currentStep.placement === 'left' ? 'right' : 'left']: '-8px',
              [currentStep.placement === 'top' || currentStep.placement === 'bottom' ? 'left' : 'top']: '50%',
              marginTop: currentStep.placement === 'left' || currentStep.placement === 'right' ? '-8px' : '0',
              marginLeft: currentStep.placement === 'top' || currentStep.placement === 'bottom' ? '-8px' : '0',
              borderTopWidth: currentStep.placement === 'bottom' || currentStep.placement === 'right' ? '1px' : '0',
              borderLeftWidth: currentStep.placement === 'bottom' || currentStep.placement === 'left' ? '1px' : '0',
              borderRightWidth: currentStep.placement === 'top' || currentStep.placement === 'right' ? '1px' : '0',
              borderBottomWidth: currentStep.placement === 'top' || currentStep.placement === 'left' ? '1px' : '0',
            }}
          />

          <div className="flex items-start justify-between mb-3 relative z-10">
            <h3 id="tutorial-title" className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              {currentStep.waitForAction && isActionCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {currentStep.title}
            </h3>
            <button aria-label="Skip Tutorial" onClick={skipTutorial} className="text-slate-400 hover:text-white transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div id="tutorial-desc" className="text-xs text-slate-300 mb-5 leading-relaxed relative z-10">
            {typeof currentStep.content === 'function' ? currentStep.content(tutorialData) : currentStep.content}
          </div>

          {currentStep.actionButtonLabel && (
            <button
              onClick={handleActionClick}
              className="mb-4 w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold rounded-lg border border-cyan-500/30 transition cursor-pointer relative z-10"
            >
              {currentStep.actionButtonLabel}
            </button>
          )}
          
          <div className="flex items-center justify-between relative z-10 mt-2">
            {/* Dots Rail */}
            <div className="flex items-center gap-1.5" aria-live="polite">
              {TUTORIAL_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToStep(idx)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300 cursor-pointer",
                    idx === currentStepIndex ? "bg-cyan-400 scale-125" : 
                    idx < currentStepIndex ? "bg-cyan-900 hover:bg-cyan-700" : "bg-slate-700 hover:bg-slate-600"
                  )}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button 
                aria-label="Previous Step"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-slate-300" />
              </button>
              
              <button 
                aria-label={currentStepIndex === TUTORIAL_STEPS.length - 1 ? 'Finish Tutorial' : 'Next Step'}
                onClick={handleNext}
                disabled={isNextDisabled}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-white text-xs font-bold transition flex items-center gap-1 shadow-lg",
                  isNextDisabled 
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed" 
                    : "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-500/20 cursor-pointer"
                )}
              >
                {currentStepIndex === TUTORIAL_STEPS.length - 1 ? 'FINISH' : canSkipAction && !isActionCompleted ? 'SKIP' : 'NEXT'}
                {currentStepIndex !== TUTORIAL_STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TUTORIAL_STEPS, TutorialStep } from './TutorialConfig';

interface TutorialContextType {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: TutorialStep | null;
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  finishTutorial: () => void;
  goToStep: (index: number) => void;
  tutorialData: any;
  updateTutorialData: (data: any) => void;
  markActionComplete: (actionId: string) => void;
  isActionCompleted: boolean;
  canSkipAction: boolean;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tutorialData, setTutorialData] = useState<any>({});
  const [isActionCompleted, setIsActionCompleted] = useState(false);
  const [canSkipAction, setCanSkipAction] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const updateTutorialData = (data: any) => setTutorialData(prev => ({ ...prev, ...data }));

  const markActionComplete = (actionId: string) => {
    const step = TUTORIAL_STEPS[currentStepIndex];
    if (step?.waitForAction === actionId) {
      setIsActionCompleted(true);
    }
  };

  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const executeStep = async (index: number) => {
    const step = TUTORIAL_STEPS[index];
    if (!step) return;

    setIsActionCompleted(false);
    setCanSkipAction(false);
    
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // Auto-skip timer for gated steps
    if (step.waitForAction) {
      timerRef.current = setTimeout(() => {
        setCanSkipAction(true);
      }, 10000);
    }
    
    if (location.pathname !== step.route) {
      navigate(step.route);
      await new Promise(r => setTimeout(r, 100)); // Allow route to mount
    }
    
    // Ensure the target element is scrolled into view
    setTimeout(() => {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
    
    if (step.preStepAction) {
      await step.preStepAction();
    }
  };

  const startTutorial = () => {
    setIsActive(true);
    setCurrentStepIndex(0);
    executeStep(0);
  };

  const nextStep = () => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      executeStep(nextIndex);
    } else {
      finishTutorial();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      executeStep(prevIndex);
    }
  };

  const goToStep = (index: number) => {
    if (index >= 0 && index < TUTORIAL_STEPS.length) {
      setCurrentStepIndex(index);
      executeStep(index);
    }
  };

  const finishTutorial = () => {
    setIsActive(false);
    localStorage.setItem('et_tutorial_seen', 'true');
  };

  const skipTutorial = () => {
    finishTutorial();
  };

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStepIndex,
        currentStep: isActive ? TUTORIAL_STEPS[currentStepIndex] : null,
        startTutorial,
        nextStep,
        prevStep,
        skipTutorial,
        finishTutorial,
        goToStep,
        tutorialData,
        updateTutorialData,
        markActionComplete,
        isActionCompleted,
        canSkipAction
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorial must be used within TutorialProvider');
  return ctx;
};

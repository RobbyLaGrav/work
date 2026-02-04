
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppState } from './types';
import ValentineProposal from './components/ValentineProposal';
import Celebration from './components/Celebration';
import AIHelper from './components/AIHelper';
import BackgroundDecor from './components/BackgroundDecor';
import { Heart } from 'lucide-react';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppState>(AppState.PROPOSAL);

  return (
    <div className="relative min-h-screen flex flex-col selection:bg-rose-200 selection:text-rose-900 overflow-x-hidden">
      <BackgroundDecor />

      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-50 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto cursor-default">
          <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
          <span className="cursive text-3xl text-rose-600">Robby & Mackenzie</span>
        </div>
        {currentStep === AppState.EXPLORE && (
          <button 
            onClick={() => setCurrentStep(AppState.PROPOSAL)}
            className="pointer-events-auto text-sm text-rose-400 hover:text-rose-600 font-medium transition-colors underline underline-offset-4"
          >
            Start Over
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-20">
        <AnimatePresence mode="wait">
          {currentStep === AppState.PROPOSAL && (
            <motion.div
              key="proposal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="w-full flex justify-center"
            >
              <ValentineProposal onAccept={() => setCurrentStep(AppState.CELEBRATION)} />
            </motion.div>
          )}

          {currentStep === AppState.CELEBRATION && (
            <motion.div
              key="celebration"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -100 }}
              className="w-full flex justify-center"
            >
              <Celebration onContinue={() => setCurrentStep(AppState.EXPLORE)} />
            </motion.div>
          )}

          {currentStep === AppState.EXPLORE && (
            <motion.div
              key="explore"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full"
            >
              <div className="text-center mb-10 px-6">
                <h2 className="cursive text-5xl text-rose-600 mb-2">Our Love Story Planner</h2>
              </div>
              <AIHelper />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="p-8 text-center text-rose-300 text-sm font-light z-10">
        {/* Robby ❤️ Mackenzie */}
      </footer>
    </div>
  );
};

export default App;

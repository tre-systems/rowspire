import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Star, Zap, Trophy, ArrowRight, Circle } from 'lucide-react';
import { APP_NAME, LEGAL_DISCLAIMER } from '@/lib/brand';

interface HowToPlayPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowToPlayPanel({ isOpen, onClose }: HowToPlayPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          data-testid="help-panel"
        >
          <motion.div
            className="glass mystical-glow rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white neon-text">How to Play {APP_NAME}</h2>
              <motion.button
                onClick={onClose}
                className="p-1.5 glass-dark rounded-lg text-white/70 hover:text-white transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                data-testid="help-close"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="space-y-6 text-white/90">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-amber-400" />
                  Objective
                </h3>
                <p className="text-sm leading-relaxed">
                  Drop counters into columns and be the first player to make four in a row
                  horizontally, vertically, or diagonally.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Circle className="w-5 h-5 mr-2 text-teal-400" />
                  Counters
                </h3>
                <div className="text-sm leading-relaxed mb-2">
                  <p className="mb-2">Each player has their own counter style:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="glass-dark p-2 rounded flex items-center">
                      <div className="w-4 h-4 bg-teal-500 rounded-full mr-2"></div>
                      Teal ring counters
                    </div>
                    <div className="glass-dark p-2 rounded flex items-center">
                      <div className="w-4 h-4 bg-violet-500 rounded-full mr-2"></div>
                      Violet moon counters
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <ArrowRight className="w-5 h-5 mr-2 text-green-400" />
                  Taking Turns
                </h3>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Players take turns dropping counters into the grid
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Click a column to drop your counter there
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Counters settle in the lowest open space in the column
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-violet-400" />
                  Winning Conditions
                </h3>
                <p className="text-sm leading-relaxed mb-2">
                  You win by making four of your counters in a row:
                </p>
                <ul className="text-sm space-y-1">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-violet-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <strong>Horizontally:</strong> four counters in a row across
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-violet-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <strong>Vertically:</strong> four counters stacked in a column
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-violet-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <strong>Diagonally:</strong> four counters in a diagonal line
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-amber-400" />
                  Strategy Tips
                </h3>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Control the center columns for more winning opportunities
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Block your opponent&apos;s potential winning moves
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Look for multiple winning threats simultaneously
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-violet-300" />
                  Game End
                </h3>
                <p className="text-sm leading-relaxed">
                  The game ends when a player makes four in a row, or when the grid is full. A full
                  grid with no winner is a draw.
                </p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-white/60 text-center">{LEGAL_DISCLAIMER}</p>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gradient-to-r from-teal-600 to-violet-600 text-white rounded-lg font-bold hover:from-teal-700 hover:to-violet-700 transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                  data-testid="help-close-bottom"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

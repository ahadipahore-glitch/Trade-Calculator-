import React, { useState, useMemo, useEffect } from 'react';
import { TrendingUp, ShieldAlert, Wallet, Repeat, Info, ArrowRight, MousePointer2, Zap } from 'lucide-react';
import { motion } from 'motion/react';

type OrderType = 'market' | 'limit';

export default function App() {
  // Inputs
  const [margin, setMargin] = useState<string>('100');
  const [leverage, setLeverage] = useState<string>('20');
  const [profitPercent, setProfitPercent] = useState<string>('2.5');
  const [iterations, setIterations] = useState<string>('15');
  
  // New States
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [entryFeePercent, setEntryFeePercent] = useState<string>('0.05');
  const [exitFeePercent, setExitFeePercent] = useState<string>('0.05');

  // Update defaults when order type changes
  useEffect(() => {
    if (orderType === 'market') {
      setEntryFeePercent('0.05');
      setExitFeePercent('0.05');
    } else {
      setEntryFeePercent('0.04');
      setExitFeePercent('0.04');
    }
  }, [orderType]);

  // Helper for cleaner number inputs
  const handleNumberInput = (setter: (val: string) => void, max?: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Allow empty string for backspacing
    if (val === '') {
      setter('');
      return;
    }

    // Overwrite leading zero if typing a digit (e.g., "0" + "5" -> "5")
    // But allow "0." for decimals
    if (val.length > 1 && val.startsWith('0') && val[1] !== '.') {
      val = val.replace(/^0+/, '');
      if (val === '') val = '0';
    }

    // Optional max constraint
    if (max !== undefined && Number(val) > max) {
      val = String(max);
    }

    setter(val);
  };

  // Calculations
  const results = useMemo(() => {
    const m = Number(margin) || 0;
    const l = Number(leverage) || 0;
    const p = Number(profitPercent) || 0;
    const it = Number(iterations) || 0;
    const ef = Number(entryFeePercent) || 0;
    const exf = Number(exitFeePercent) || 0;

    const position = m * l;
    const liquidationMove = l > 0 ? 100 / l : 0;
    
    // Single Trade Logic
    const profitAmount = position * (p / 100);
    const entryFee = position * (ef / 100);
    const exitFee = position * (exf / 100);
    const totalFeeSingle = entryFee + exitFee;
    const newCapitalAfterFee = m + profitAmount - totalFeeSingle;

    // Compounding Logic:
    // Each iteration reinvests the NET amount (Initial + Profit - Fees).
    // Formulation: New Capital = Old Capital * (1 + Leverage * (Profit% - TotalFee%))
    // This ensures fees are deducted from the profit before reinvesting the entire net balance.
    
    const totalFeeRate = (ef + exf) / 100;
    
    // Rates per iteration
    const r = l * (p / 100);
    const f = l * totalFeeRate;
    
    // Net growth factor per iteration (1 + r - f)
    const netGrowthFactor = 1 + r - f;
    
    // Gross growth factor (ignores fees)
    const grossGrowthFactor = 1 + r;
    
    const compoundedGross = m * Math.pow(grossGrowthFactor, it);
    const compoundedNet = m * Math.pow(netGrowthFactor, it);
    
    // Total Fee Formula (Compounded Case) from image:
    // Total Fee = C0 * f * ((1 + r - f)^n - 1) / (r - f)
    const totalFeeDeducted = (r === f) 
      ? (m * f * it) 
      : (m * f * (Math.pow(1 + r - f, it) - 1) / (r - f));

    return {
      position,
      liquidationMove,
      profitAmount,
      entryFee,
      exitFee,
      totalFeeSingle,
      newCapitalAfterFee,
      compoundedGross,
      compoundedNet,
      totalFeeDeducted,
      totalFeeRate,
      m,
      l,
      p,
      it
    };
  }, [margin, leverage, profitPercent, iterations, entryFeePercent, exitFeePercent]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const noSpinClass = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div className="h-screen h-[100dvh] md:min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 flex items-center justify-center p-1 md:p-4 overflow-hidden">
      <div className="w-full max-w-4xl h-full md:h-auto bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Panel: Inputs (Top zone on mobile, scrollable) */}
        <div className="w-full md:w-2/5 h-[40%] md:h-auto p-4 md:p-6 border-b md:border-b-0 md:border-r border-zinc-800 space-y-4 md:space-y-5 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 md:p-2 bg-emerald-500/10 rounded-lg">
              <TrendingUp className="w-4 md:w-5 h-4 md:h-5 text-emerald-500" />
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight">Trade Config</h1>
          </div>

          <div className="space-y-3 md:space-y-4">
            {/* Margin Input */}
            <div className="space-y-1 md:space-y-2">
              <label className="text-[10px] md:text-xs font-medium text-zinc-500 uppercase tracking-wider flex justify-between">
                Margin (USDT)
                <span className="text-zinc-400">{margin || '0'}</span>
              </label>
              <input
                type="number"
                value={margin}
                onChange={handleNumberInput(setMargin)}
                className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 md:px-4 md:py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm ${noSpinClass}`}
                placeholder="0"
              />
            </div>

            {/* Leverage Input & Slider */}
            <div className="space-y-1 md:space-y-2">
              <label className="text-[10px] md:text-xs font-medium text-zinc-500 uppercase tracking-wider flex justify-between items-center">
                Leverage
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={leverage}
                    onChange={handleNumberInput(setLeverage, 500)}
                    className={`w-14 md:w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-right text-emerald-500 font-bold text-xs md:text-sm focus:outline-none focus:border-emerald-500 ${noSpinClass}`}
                    placeholder="0"
                  />
                  <span className="text-emerald-500/50 font-bold text-xs md:text-sm">x</span>
                </div>
              </label>
              <input
                type="range"
                min="0"
                max="500"
                step="5"
                value={Number(leverage) === 1 ? 0 : Number(leverage)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setLeverage(String(val === 0 ? 1 : val));
                }}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[8px] md:text-[9px] text-zinc-600 font-mono">
                <span>1x</span>
                <span>125x</span>
                <span>250x</span>
                <span>375x</span>
                <span>500x</span>
              </div>
            </div>

            {/* Profit % Input */}
            <div className="space-y-1 md:space-y-2">
              <label className="text-[10px] md:text-xs font-medium text-zinc-500 uppercase tracking-wider flex justify-between">
                Price Movement (%)
                <span className="text-zinc-400">{profitPercent || '0'}%</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={profitPercent}
                onChange={handleNumberInput(setProfitPercent)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 md:px-4 md:py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                placeholder="0"
              />
            </div>

            {/* Iterations Input */}
            <div className="space-y-1 md:space-y-2">
              <label className="text-[10px] md:text-xs font-medium text-zinc-500 uppercase tracking-wider flex justify-between">
                Iterations (Times)
                <span className="text-zinc-400">{iterations || '0'}</span>
              </label>
              <input
                type="number"
                value={iterations}
                onChange={handleNumberInput(setIterations)}
                className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 md:px-4 md:py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm ${noSpinClass}`}
                placeholder="0"
              />
            </div>

            {/* Order Type Selection */}
            <div className="space-y-1 md:space-y-2 pt-1 md:pt-2 border-t border-zinc-800/50">
              <label className="text-[10px] md:text-xs font-medium text-zinc-500 uppercase tracking-wider">Order Type</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-800 rounded-xl border border-zinc-700">
                <button
                  onClick={() => setOrderType('market')}
                  className={`flex items-center justify-center gap-2 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                    orderType === 'market' 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                  }`}
                >
                  <Zap className="w-3 md:w-3.5 h-3 md:h-3.5" />
                  Market
                </button>
                <button
                  onClick={() => setOrderType('limit')}
                  className={`flex items-center justify-center gap-2 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                    orderType === 'limit' 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                  }`}
                >
                  <MousePointer2 className="w-3 md:w-3.5 h-3 md:h-3.5" />
                  Limit
                </button>
              </div>
            </div>

            {/* Fee Inputs */}
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className="space-y-1 md:space-y-2">
                <label className="text-[9px] md:text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Entry Fee (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={entryFeePercent}
                  onChange={handleNumberInput(setEntryFeePercent)}
                  className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 md:px-3 md:py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-xs md:text-sm ${noSpinClass}`}
                />
              </div>
              <div className="space-y-1 md:space-y-2">
                <label className="text-[9px] md:text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Exit Fee (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={exitFeePercent}
                  onChange={handleNumberInput(setExitFeePercent)}
                  className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 md:px-3 md:py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-xs md:text-sm ${noSpinClass}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Outputs (Bottom zone on mobile, fixed) */}
        <div className="w-full md:w-3/5 h-[60%] md:h-auto p-4 md:p-6 bg-zinc-900/50 flex flex-col overflow-hidden md:overflow-y-auto">
          <div className="space-y-4 md:space-y-6">
            {/* Top Row: Quick Stats */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 md:p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50"
              >
                <div className="flex items-center gap-2 text-zinc-500 text-[10px] md:text-xs mb-1">
                  <Wallet className="w-3 h-3" />
                  <span>Position</span>
                </div>
                <div className="text-sm md:text-lg font-bold text-zinc-100">
                  {formatCurrency(results.position)} <span className="text-[9px] md:text-[10px] text-zinc-500">USDT</span>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-3 md:p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50"
              >
                <div className="flex items-center gap-2 text-zinc-500 text-[10px] md:text-xs mb-1">
                  <ShieldAlert className="w-3 h-3 text-rose-500" />
                  <span>Liq. Move</span>
                </div>
                <div className="text-sm md:text-lg font-bold text-rose-500">
                  {results.liquidationMove.toFixed(2)}%
                </div>
              </motion.div>
            </div>

            {/* Middle Section: Single Trade Breakdown */}
            <div className="space-y-2 md:space-y-3">
              <h3 className="text-[10px] md:text-xs font-bold text-zinc-600 uppercase tracking-widest">Single Trade</h3>
              <div className="space-y-1 md:space-y-2">
                <div className="flex justify-between items-center text-xs md:text-sm">
                  <span className="text-zinc-400">Gross Profit</span>
                  <span className="text-emerald-500 font-medium">+{formatCurrency(results.profitAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs md:text-sm">
                  <span className="text-zinc-400">Fees ({(results.totalFeeRate * 100).toFixed(2)}%)</span>
                  <span className="text-rose-400">-{formatCurrency(results.totalFeeSingle)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-800 font-bold text-xs md:text-sm">
                  <span className="text-zinc-300">Net Capital</span>
                  <span className="text-zinc-100">{formatCurrency(results.newCapitalAfterFee)}</span>
                </div>
              </div>
            </div>

            {/* Bottom Section: Compounding */}
            <div className="space-y-2 md:space-y-4 pt-2 md:pt-4">
              <div className="flex items-center gap-2">
                <Repeat className="w-3.5 md:w-4 h-3.5 md:h-4 text-emerald-500" />
                <h3 className="text-[10px] md:text-xs font-bold text-emerald-500 uppercase tracking-widest">Compounding ({iterations}x)</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-2 md:gap-3">
                <div className="flex justify-between items-center text-xs md:text-sm p-2.5 md:p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
                  <span className="text-zinc-400">Gross</span>
                  <span className="text-zinc-300 font-mono">{formatCurrency(results.compoundedGross)}</span>
                </div>
                <div className="flex justify-between items-center text-xs md:text-sm p-2.5 md:p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
                  <span className="text-zinc-400">Fees</span>
                  <span className="text-rose-400 font-mono">{formatCurrency(results.totalFeeDeducted)}</span>
                </div>
              </div>
            </div>

            {/* Final Result Hero (Moved inside the stack) */}
            <motion.div 
              key={results.compoundedNet}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 md:p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl md:rounded-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-3 md:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-16 md:w-24 h-16 md:h-24 text-emerald-500" />
              </div>
              <div className="relative z-10">
                <div className="text-[10px] md:text-xs font-bold text-emerald-500/70 uppercase tracking-widest mb-1">Final Net Capital</div>
                <div className="text-2xl md:text-4xl font-black text-emerald-500 tracking-tighter flex items-baseline gap-2">
                  {formatCurrency(results.compoundedNet)}
                  <span className="text-xs md:text-sm font-medium text-emerald-500/50 uppercase">USDT</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[9px] md:text-[10px] text-emerald-500/40 uppercase font-bold tracking-tighter">
                  <span>Init: {results.m}</span>
                  <ArrowRight className="w-2 h-2" />
                  <span>ROI: {results.m > 0 ? ((results.compoundedNet / results.m - 1) * 100).toLocaleString() : '0'}%</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Footer / Credits */}
      <div className="fixed bottom-2 md:bottom-4 text-[10px] text-zinc-600 font-mono uppercase tracking-[0.2em]">
        Future Trade Calculator // v2.0
      </div>
    </div>
  );
}

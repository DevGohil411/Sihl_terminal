export interface StrategyLeg {
  id: string;
  action: "BUY" | "SELL";
  strike: string;
  value: string;
  expiry: string;
  segment: "CE" | "PE" | "FUTURES";
  lots: number;
  target: number;
  stoploss: number;
  trail: number;
}

export interface StrategyState {
  name: string;
  underlying: string;
  capital: number;
  type: "Intraday" | "Positional" | "";
  legs: StrategyLeg[];
  entryHour: string;
  entryMinute: string;
  entryDays: string[];
  profitMtmType: "None" | "Amount" | "% Capital";
  profitMtmValue: number;
  stoplossMtmType: "None" | "Amount" | "% Capital";
  stoplossMtmValue: number;
  trailingStoplossType: "None" | "Amount" | "Percentage";
  trailingActivateAt: number;
  trailingLockProfitAt: number;
  trailingIncreaseBy: number;
  trailingIncreaseTslBy: number;
  exitHour: string;
  exitMinute: string;
  exitOnExpiry: "Yes" | "No";
  exitAfterDays: number;
}

export const PRE_BUILT_STRATEGIES = [
  "Bull Call Spread",
  "Bear Put Spread",
  "Bear Call Spread",
  "Bull Put Spread",
  "Covered Call",
  "Long Combo",
  "Collar",
  "Protective Call",
  "Long Straddle",
  "Short Straddle",
  "Strangle",
  "Short Strangle",
  "Long Call Butterfly",
  "Long Call Calendar Spread",
  "Bull Call Ladder",
  "Bear Put Ladder",
  "Bull Ratio Spread",
  "Bear Ratio Spread",
  "Iron Condor",
  "Iron Butterfly",
];

export const SAVED_STRATEGIES = [
  "BankNifty Morning Breakout",
  "Nifty Weekly Iron Condor",
  "FinNifty Trend Strategy",
  "Expiry Scalper",
];

export const UNDERLYINGS = [
  "NIFTY",
  "BANKNIFTY",
  "FINNIFTY",
  "MIDCPNIFTY",
  "RELIANCE",
  "TCS",
  "HDFCBANK",
  "INFY",
  "SBIN",
  "ICICIBANK",
];

export const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
export const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const LOTS_OPTIONS = Array.from({ length: 20 }, (_, i) => (i + 1).toString());
export const DAYS_OPTIONS = Array.from({ length: 31 }, (_, i) => i.toString());

export function createDefaultLeg(): StrategyLeg {
  return {
    id: typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    action: "BUY",
    strike: "ATM Futures",
    value: "OTM 8",
    expiry: "Current Month",
    segment: "CE",
    lots: 1,
    target: 0,
    stoploss: 0,
    trail: 0,
  };
}

export function generateMockLegsForStrategy(strategyName: string): StrategyLeg[] {
  const makeLeg = (partial: Partial<StrategyLeg>): StrategyLeg => ({
    ...createDefaultLeg(),
    ...partial,
  });

  switch (strategyName) {
    case "Bull Call Spread":
      return [
        makeLeg({ action: "BUY", segment: "CE", strike: "ATM", value: "ATM", lots: 1 }),
        makeLeg({ action: "SELL", segment: "CE", strike: "OTM", value: "OTM 2", lots: 1 }),
      ];
    case "Bear Put Spread":
      return [
        makeLeg({ action: "BUY", segment: "PE", strike: "ATM", value: "ATM", lots: 1 }),
        makeLeg({ action: "SELL", segment: "PE", strike: "ITM", value: "ITM 2", lots: 1 }),
      ];
    case "Bear Call Spread":
      return [
        makeLeg({ action: "SELL", segment: "CE", strike: "ATM", value: "ATM", lots: 1 }),
        makeLeg({ action: "BUY", segment: "CE", strike: "OTM", value: "OTM 2", lots: 1 }),
      ];
    case "Bull Put Spread":
      return [
        makeLeg({ action: "SELL", segment: "PE", strike: "ATM", value: "ATM", lots: 1 }),
        makeLeg({ action: "BUY", segment: "PE", strike: "ITM", value: "ITM 2", lots: 1 }),
      ];
    case "Covered Call":
      return [
        makeLeg({ action: "BUY", segment: "FUTURES", strike: "ATM Futures", value: "ATM", lots: 1 }),
        makeLeg({ action: "SELL", segment: "CE", strike: "OTM", value: "OTM 2", lots: 1 }),
      ];
    case "Long Straddle":
      return [
        makeLeg({ action: "BUY", segment: "CE", strike: "ATM", value: "ATM", lots: 1 }),
        makeLeg({ action: "BUY", segment: "PE", strike: "ATM", value: "ATM", lots: 1 }),
      ];
    case "Short Straddle":
      return [
        makeLeg({ action: "SELL", segment: "CE", strike: "ATM", value: "ATM", lots: 1 }),
        makeLeg({ action: "SELL", segment: "PE", strike: "ATM", value: "ATM", lots: 1 }),
      ];
    case "Strangle":
      return [
        makeLeg({ action: "BUY", segment: "CE", strike: "OTM", value: "OTM 5", lots: 1 }),
        makeLeg({ action: "BUY", segment: "PE", strike: "OTM", value: "OTM 5", lots: 1 }),
      ];
    case "Iron Condor":
      return [
        makeLeg({ action: "SELL", segment: "CE", strike: "OTM", value: "OTM 2", lots: 1 }),
        makeLeg({ action: "BUY", segment: "CE", strike: "OTM", value: "OTM 5", lots: 1 }),
        makeLeg({ action: "SELL", segment: "PE", strike: "OTM", value: "OTM 2", lots: 1 }),
        makeLeg({ action: "BUY", segment: "PE", strike: "OTM", value: "OTM 5", lots: 1 }),
      ];
    case "Iron Butterfly":
      return [
        makeLeg({ action: "SELL", segment: "CE", strike: "ATM", value: "ATM", lots: 1 }),
        makeLeg({ action: "BUY", segment: "CE", strike: "OTM", value: "OTM 3", lots: 1 }),
        makeLeg({ action: "SELL", segment: "PE", strike: "ATM", value: "ATM", lots: 1 }),
        makeLeg({ action: "BUY", segment: "PE", strike: "OTM", value: "OTM 3", lots: 1 }),
      ];
    default:
      return [makeLeg({})];
  }
}

export function generatePayoffData(legs: StrategyLeg[]) {
  const spotPrices: number[] = [];
  const payoffs: number[] = [];
  const currentPrice = 22500;
  const range = 6000;
  const steps = 100;

  for (let i = 0; i <= steps; i++) {
    const spot = currentPrice - range / 2 + (range / steps) * i;
    spotPrices.push(spot);

    let payoff = 0;
    legs.forEach((leg) => {
      const lotSize = 1000;
      const qty = leg.lots * lotSize * (leg.action === "BUY" ? 1 : -1);
      let strikePrice = currentPrice;

      if (leg.strike === "ATM") strikePrice = currentPrice;
      else if (leg.strike === "ITM") strikePrice = currentPrice - 200;
      else if (leg.strike === "OTM") strikePrice = currentPrice + 200;
      else if (leg.strike === "ATM Futures") strikePrice = currentPrice;

      if (leg.value.includes("ITM")) {
        const offset = parseInt(leg.value.replace(/\D/g, "")) || 0;
        strikePrice = currentPrice - offset * 100;
      } else if (leg.value.includes("OTM")) {
        const offset = parseInt(leg.value.replace(/\D/g, "")) || 0;
        strikePrice = currentPrice + offset * 100;
      }

      const premium = Math.abs(strikePrice - currentPrice) * 0.05 + 50;

      if (leg.segment === "CE") {
        const intrinsic = Math.max(0, spot - strikePrice);
        payoff += (intrinsic - premium) * qty;
      } else if (leg.segment === "PE") {
        const intrinsic = Math.max(0, strikePrice - spot);
        payoff += (intrinsic - premium) * qty;
      } else {
        payoff += (spot - strikePrice) * qty;
      }
    });

    payoffs.push(payoff);
  }

  return spotPrices.map((spot, i) => ({
    spot: Math.round(spot),
    payoff: Math.round(payoffs[i]),
    zero: 0,
  }));
}

export function calculateSummary(legs: StrategyLeg[], capital: number) {
  const totalLots = legs.reduce((sum, leg) => sum + leg.lots, 0);
  const data = generatePayoffData(legs);
  const payoffs = data.map((d) => d.payoff);
  const maxProfit = Math.max(...payoffs);
  const maxLoss = Math.min(...payoffs);
  const riskReward = maxLoss !== 0 ? Math.abs(maxProfit / maxLoss).toFixed(2) : "∞";

  const breakevens: number[] = [];
  for (let i = 0; i < payoffs.length - 1; i++) {
    if ((payoffs[i] < 0 && payoffs[i + 1] >= 0) || (payoffs[i] > 0 && payoffs[i + 1] <= 0)) {
      breakevens.push(data[i].spot);
    }
  }

  return {
    capital,
    totalLots,
    numLegs: legs.length,
    maxProfit,
    maxLoss,
    riskReward,
    breakevenPoints: breakevens.length > 0 ? breakevens.join(", ") : "—",
  };
}

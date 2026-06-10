export interface StrategyDetail {
  id: string;
  name: string;
  category: string;
  marketView: string;
  riskLevel: string;
  rewardPotential: string;
  capitalRequired: string;
  difficulty: string;
  legs: number;
  description: string;
  howItWorks: string[];
  advantages: string[];
  disadvantages: string[];
  bestConditions: string[];
  maxProfit: string;
  maxLoss: string;
  breakeven: string;
  exampleTrade: string[];
}

export const PRE_BUILT_STRATEGIES: StrategyDetail[] = [
  {
    id: "bull-call-spread",
    name: "Bull Call Spread",
    category: "Spreads",
    marketView: "Moderately Bullish",
    riskLevel: "Moderate",
    rewardPotential: "Limited",
    capitalRequired: "₹35,000",
    difficulty: "Beginner",
    legs: 2,
    description:
      "A limited-risk bullish strategy created by buying a call option and simultaneously selling a higher strike call option. Profits from moderate upside movement while capping both risk and reward.",
    howItWorks: [
      "Buy ATM Call Option (Lower Strike)",
      "Sell Higher Strike OTM Call Option",
      "Net Premium = Premium Paid - Premium Received",
      "Profit when underlying moves up moderately",
      "Maximum profit achieved when price is at or above short strike at expiry",
    ],
    advantages: [
      "Lower cost than buying a naked call option",
      "Defined and limited risk upfront",
      "Good reward-to-risk ratio for directional trades",
      "Time decay on short leg helps offset long leg decay",
    ],
    disadvantages: [
      "Profit is capped at the difference between strikes minus net premium",
      "Requires moderately bullish movement to be profitable",
      "Limited upside if market rallies strongly",
    ],
    bestConditions: [
      "Moderately bullish market outlook",
      "Expecting limited upside (not a strong rally)",
      "Low to moderate volatility environment",
      "Before minor positive events or data releases",
    ],
    maxProfit: "Difference between strikes minus net premium paid",
    maxLoss: "Net premium paid for the spread",
    breakeven: "Long Call Strike + Net Premium Paid",
    exampleTrade: [
      "Buy NIFTY 25000 CE @ ₹280",
      "Sell NIFTY 25200 CE @ ₹140",
      "Net Premium Paid = ₹140",
      "Max Profit = ₹200 - ₹140 = ₹60 per lot",
      "Max Loss = ₹140 per lot",
    ],
  },
  {
    id: "bear-put-spread",
    name: "Bear Put Spread",
    category: "Spreads",
    marketView: "Moderately Bearish",
    riskLevel: "Moderate",
    rewardPotential: "Limited",
    capitalRequired: "₹35,000",
    difficulty: "Beginner",
    legs: 2,
    description:
      "A limited-risk bearish strategy using two put options. Buy an ATM put and sell a lower strike put to reduce cost and define risk.",
    howItWorks: [
      "Buy ATM Put Option (Higher Strike)",
      "Sell Lower Strike OTM Put Option",
      "Net Premium = Premium Paid - Premium Received",
      "Profit when underlying moves down moderately",
      "Maximum profit at or below short strike at expiry",
    ],
    advantages: [
      "Limited risk — maximum loss is net premium paid",
      "Cheaper than buying put outright",
      "Defined reward potential",
      "Benefits from bearish movement",
    ],
    disadvantages: [
      "Profit is capped",
      "Needs downside movement to profit",
      "Two transaction costs",
    ],
    bestConditions: [
      "Moderately bearish outlook",
      "Expecting limited downside",
      "Before negative events or results",
      "High volatility can increase entry cost",
    ],
    maxProfit: "Difference between strikes minus net premium",
    maxLoss: "Net premium paid",
    breakeven: "Long Put Strike - Net Premium Paid",
    exampleTrade: [
      "Buy NIFTY 25000 PE @ ₹300",
      "Sell NIFTY 24800 PE @ ₹160",
      "Net Premium = ₹140",
      "Max Profit = ₹200 - ₹140 = ₹60 per lot",
    ],
  },
  {
    id: "iron-condor",
    name: "Iron Condor",
    category: "Income",
    marketView: "Neutral",
    riskLevel: "High",
    rewardPotential: "Limited",
    capitalRequired: "₹85,000",
    difficulty: "Advanced",
    legs: 4,
    description:
      "A four-leg income strategy designed to profit when the market remains within a range. Combines a bull put spread and a bear call spread.",
    howItWorks: [
      "Sell OTM Call (Upper breakeven)",
      "Buy Further OTM Call (Protection)",
      "Sell OTM Put (Lower breakeven)",
      "Buy Further OTM Put (Protection)",
      "Profit = Net credit received when market stays in range",
    ],
    advantages: [
      "High probability of profit — market can move in a wide range",
      "Time decay works in your favor",
      "Defined maximum risk",
      "Profits from low volatility and sideways movement",
    ],
    disadvantages: [
      "Limited profit potential",
      "Large move in either direction hurts position",
      "Requires active management",
    ],
    bestConditions: [
      "Range-bound market with clear support/resistance",
      "Low volatility environment",
      "Before expiry week for maximum theta decay",
      "When IV rank is low to moderate",
    ],
    maxProfit: "Net credit received",
    maxLoss: "Width of wider spread minus net credit",
    breakeven: "Short Call Strike + Credit OR Short Put Strike - Credit",
    exampleTrade: [
      "Sell NIFTY 25200 CE @ ₹80",
      "Buy NIFTY 25400 CE @ ₹30",
      "Sell NIFTY 24800 PE @ ₹90",
      "Buy NIFTY 24600 PE @ ₹40",
      "Net Credit = ₹100 per lot",
    ],
  },
  {
    id: "iron-butterfly",
    name: "Iron Butterfly",
    category: "Income",
    marketView: "Neutral",
    riskLevel: "High",
    rewardPotential: "Limited",
    capitalRequired: "₹75,000",
    difficulty: "Advanced",
    legs: 4,
    description:
      "A premium-selling strategy that profits when price remains near a specific strike. Higher profit potential than Iron Condor but narrower profitable range.",
    howItWorks: [
      "Sell ATM Call (Same strike as ATM Put)",
      "Buy OTM Call (Protection)",
      "Sell ATM Put (Same strike as ATM Call)",
      "Buy OTM Put (Protection)",
      "Maximum profit if price is exactly at ATM strike at expiry",
    ],
    advantages: [
      "Higher profit potential than Iron Condor",
      "Time decay is very favorable",
      "Defined risk",
      "Best for sideways, low-volatility markets",
    ],
    disadvantages: [
      "Very narrow profit zone",
      "Requires price to stay near one specific level",
      "Higher risk if market moves significantly",
    ],
    bestConditions: [
      "Extremely range-bound market",
      "Low volatility expected",
      "Near expiry for maximum theta",
      "When you have a specific price target in mind",
    ],
    maxProfit: "Net credit received",
    maxLoss: "Difference between strikes minus net credit",
    breakeven: "ATM Strike ± Net Credit",
    exampleTrade: [
      "Sell NIFTY 25000 CE @ ₹200",
      "Buy NIFTY 25200 CE @ ₹80",
      "Sell NIFTY 25000 PE @ ₹180",
      "Buy NIFTY 24800 PE @ ₹60",
      "Net Credit = ₹240 per lot",
    ],
  },
  {
    id: "long-straddle",
    name: "Long Straddle",
    category: "Volatility",
    marketView: "High Volatility Expected",
    riskLevel: "High",
    rewardPotential: "Unlimited",
    capitalRequired: "₹95,000",
    difficulty: "Intermediate",
    legs: 2,
    description:
      "A volatility strategy that profits from a large move in either direction. Buy both ATM call and put to benefit from volatility expansion.",
    howItWorks: [
      "Buy ATM Call Option",
      "Buy ATM Put Option (Same strike, same expiry)",
      "Requires large move in either direction",
      "Profits from volatility expansion",
      "Unlimited upside if market moves strongly",
    ],
    advantages: [
      "Unlimited profit potential on both sides",
      "Profits from volatility expansion",
      "No need to predict direction",
      "Best for event-driven trading",
    ],
    disadvantages: [
      "High premium cost (paying for both call and put)",
      "Time decay hurts both positions",
      "Requires significant move to break even",
      "Loss if market stays flat",
    ],
    bestConditions: [
      "Before major events (budget, earnings, RBI policy)",
      "Results season with expected large moves",
      "High uncertainty periods",
      "When implied volatility is low (cheaper entry)",
    ],
    maxProfit: "Unlimited in both directions",
    maxLoss: "Total premium paid for both options",
    breakeven: "ATM Strike ± Total Premium Paid",
    exampleTrade: [
      "Buy NIFTY 25000 CE @ ₹250",
      "Buy NIFTY 25000 PE @ ₹280",
      "Total Premium = ₹530 per lot",
      "Breakeven: 24470 and 25530",
    ],
  },
  {
    id: "short-straddle",
    name: "Short Straddle",
    category: "Income",
    marketView: "Low Volatility Expected",
    riskLevel: "Very High",
    rewardPotential: "Limited",
    capitalRequired: "₹1,50,000",
    difficulty: "Expert",
    legs: 2,
    description:
      "Premium collection strategy designed to profit when market remains near ATM strike. Sell both call and put at the same strike.",
    howItWorks: [
      "Sell ATM Call Option",
      "Sell ATM Put Option (Same strike)",
      "Collect premium from both legs",
      "Profit if market stays near strike",
      "Maximum profit at exact ATM price at expiry",
    ],
    advantages: [
      "Maximum profit if market stays flat",
      "Time decay works very strongly in your favor",
      "High probability when market is range-bound",
      "Collect premium from both sides",
    ],
    disadvantages: [
      "Unlimited risk on both sides",
      "Requires high margin",
      "Dangerous if market moves sharply",
      "Needs constant monitoring",
    ],
    bestConditions: [
      "Extremely low volatility expected",
      "Range-bound market for extended period",
      "After major events when volatility collapses",
      "Experienced traders only",
    ],
    maxProfit: "Total premium received",
    maxLoss: "Unlimited in both directions",
    breakeven: "ATM Strike ± Total Premium Received",
    exampleTrade: [
      "Sell NIFTY 25000 CE @ ₹250",
      "Sell NIFTY 25000 PE @ ₹280",
      "Total Credit = ₹530 per lot",
      "Breakeven: 24470 and 25530",
    ],
  },
  {
    id: "long-strangle",
    name: "Long Strangle",
    category: "Volatility",
    marketView: "Volatility Expansion",
    riskLevel: "Moderate",
    rewardPotential: "Unlimited",
    capitalRequired: "₹65,000",
    difficulty: "Intermediate",
    legs: 2,
    description:
      "Cheaper alternative to long straddle using OTM options. Buy OTM call and OTM put to profit from large moves with lower cost.",
    howItWorks: [
      "Buy OTM Call Option (Higher Strike)",
      "Buy OTM Put Option (Lower Strike)",
      "Cheaper than straddle due to OTM strikes",
      "Needs larger move than straddle to profit",
      "Unlimited profit potential",
    ],
    advantages: [
      "Lower cost than long straddle",
      "Unlimited profit potential",
      "No directional bias needed",
      "Better for budget-conscious traders",
    ],
    disadvantages: [
      "Needs larger move to break even",
      "Time decay on both positions",
      "Lower probability of profit than straddle",
      "Wider breakeven points",
    ],
    bestConditions: [
      "Expecting large move but unsure of direction",
      "Before major events with limited budget",
      "When OTM options are relatively cheap",
      "High volatility expected",
    ],
    maxProfit: "Unlimited in both directions",
    maxLoss: "Total premium paid",
    breakeven: "Call Strike + Premium and Put Strike - Premium",
    exampleTrade: [
      "Buy NIFTY 25200 CE @ ₹120",
      "Buy NIFTY 24800 PE @ ₹100",
      "Total Premium = ₹220 per lot",
      "Breakeven: 24580 and 25420",
    ],
  },
  {
    id: "short-strangle",
    name: "Short Strangle",
    category: "Income",
    marketView: "Neutral",
    riskLevel: "Very High",
    rewardPotential: "Limited",
    capitalRequired: "₹1,20,000",
    difficulty: "Expert",
    legs: 2,
    description:
      "Premium-selling strategy that benefits from low volatility. Sell OTM call and OTM put to collect premium from a wider range.",
    howItWorks: [
      "Sell OTM Call Option",
      "Sell OTM Put Option",
      "Wider profitable range than short straddle",
      "Collect premium from both sides",
      "Profit if market stays between two strikes",
    ],
    advantages: [
      "Wider profit zone than short straddle",
      "Lower margin requirement than straddle",
      "Time decay benefits both positions",
      "High probability strategy when range-bound",
    ],
    disadvantages: [
      "Unlimited risk on both sides",
      "Lower premium collection than straddle",
      "Needs significant margin",
      "Dangerous in trending markets",
    ],
    bestConditions: [
      "Range-bound market with wide range",
      "Low volatility environment",
      "When you expect market to stay between two levels",
      "For experienced premium sellers",
    ],
    maxProfit: "Total premium received",
    maxLoss: "Unlimited beyond breakevens",
    breakeven: "Call Strike + Credit and Put Strike - Credit",
    exampleTrade: [
      "Sell NIFTY 25200 CE @ ₹120",
      "Sell NIFTY 24800 PE @ ₹100",
      "Total Credit = ₹220 per lot",
      "Profit Zone: 24580 to 25420",
    ],
  },
  {
    id: "covered-call",
    name: "Covered Call",
    category: "Income",
    marketView: "Mildly Bullish",
    riskLevel: "Low",
    rewardPotential: "Limited",
    capitalRequired: "₹2,50,000",
    difficulty: "Beginner",
    legs: 2,
    description:
      "Income-generating strategy where a call option is sold against owned stock or futures. Generates regular income from premiums.",
    howItWorks: [
      "Own the underlying stock/futures (Long position)",
      "Sell OTM Call Option against holding",
      "Collect premium from call sale",
      "If price stays below strike, keep premium",
      "If price goes above, shares are called away",
    ],
    advantages: [
      "Generates regular income from premiums",
      "Reduces cost basis of holding",
      "Limited downside protection (premium amount)",
      "Ideal for sideways to mildly bullish markets",
    ],
    disadvantages: [
      "Caps upside potential above strike",
      "Still exposed to large downside moves",
      "Requires owning underlying asset",
      "Early assignment risk",
    ],
    bestConditions: [
      "Own stock and expect sideways movement",
      "Mildly bullish but not strongly",
      "Before expiry for theta decay benefit",
      "When implied volatility is high (better premiums)",
    ],
    maxProfit: "Strike - Purchase Price + Premium Received",
    maxLoss: "Purchase Price - Premium Received (unlimited downside)",
    breakeven: "Purchase Price - Premium Received",
    exampleTrade: [
      "Buy NIFTY Futures @ 25000",
      "Sell NIFTY 25200 CE @ ₹150",
      "Premium Income = ₹150",
      "If NIFTY closes below 25200, keep full premium",
    ],
  },
  {
    id: "protective-put",
    name: "Protective Put",
    category: "Protection",
    marketView: "Bullish With Protection",
    riskLevel: "Low",
    rewardPotential: "Unlimited",
    capitalRequired: "₹2,60,000",
    difficulty: "Beginner",
    legs: 2,
    description:
      "Insurance strategy used to protect stock holdings against downside risk. Buy a put option while holding the underlying.",
    howItWorks: [
      "Own the underlying stock/futures",
      "Buy ATM or slightly OTM Put Option",
      "Put acts as insurance against downside",
      "If market falls, put gains offset stock losses",
      "If market rises, only lose premium paid",
    ],
    advantages: [
      "Complete downside protection below strike",
      "Unlimited upside potential maintained",
      "Peace of mind during volatile periods",
      "Like insurance for your portfolio",
    ],
    disadvantages: [
      "Premium cost reduces overall returns",
      "Continuous cost if rolled monthly",
      "Time decay on put option",
      "Protection is temporary (expiry-based)",
    ],
    bestConditions: [
      "Bullish but worried about short-term correction",
      "Before major events or earnings",
      "High volatility periods when protection is needed",
      "Long-term holders wanting temporary insurance",
    ],
    maxProfit: "Unlimited (stock upside minus premium)",
    maxLoss: "Stock Purchase Price - Put Strike + Premium",
    breakeven: "Stock Purchase Price + Premium Paid",
    exampleTrade: [
      "Buy NIFTY Futures @ 25000",
      "Buy NIFTY 24800 PE @ ₹200",
      "Maximum Loss = ₹400 per lot",
      "Protection kicks in below 24800",
    ],
  },
];

export function getStrategyById(id: string): StrategyDetail | undefined {
  return PRE_BUILT_STRATEGIES.find((s) => s.id === id);
}

export function searchStrategies(query: string): StrategyDetail[] {
  const q = query.toLowerCase();
  return PRE_BUILT_STRATEGIES.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.marketView.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
  );
}

export function generateStrategyPayoff(strategyId: string) {
  const currentPrice = 22500;
  const range = 8000;
  const steps = 100;
  const data: { spot: number; payoff: number }[] = [];

  for (let i = 0; i <= steps; i++) {
    const spot = currentPrice - range / 2 + (range / steps) * i;
    let payoff = 0;

    switch (strategyId) {
      case "bull-call-spread":
        payoff = Math.max(0, spot - 25000) - Math.max(0, spot - 25200) - 140;
        break;
      case "bear-put-spread":
        payoff = Math.max(0, 25000 - spot) - Math.max(0, 24800 - spot) - 140;
        break;
      case "iron-condor":
        payoff =
          (spot > 25200 && spot < 25400 ? 25200 - spot + 100 : spot >= 25400 ? -100 : 100) +
          (spot > 24600 && spot < 24800 ? spot - 24800 + 100 : spot <= 24600 ? -100 : 100);
        break;
      case "iron-butterfly":
        payoff =
          -Math.max(0, spot - 25000) -
          Math.max(0, 25000 - spot) +
          Math.max(0, spot - 25200) +
          Math.max(0, 24800 - spot) +
          240;
        break;
      case "long-straddle":
        payoff = Math.max(0, spot - 25000) + Math.max(0, 25000 - spot) - 530;
        break;
      case "short-straddle":
        payoff = 530 - Math.max(0, spot - 25000) - Math.max(0, 25000 - spot);
        break;
      case "long-strangle":
        payoff = Math.max(0, spot - 25200) + Math.max(0, 24800 - spot) - 220;
        break;
      case "short-strangle":
        payoff = 220 - Math.max(0, spot - 25200) - Math.max(0, 24800 - spot);
        break;
      case "covered-call":
        payoff = Math.min(spot - 25000, 200) + 150;
        break;
      case "protective-put":
        payoff = spot - 25000 + Math.max(0, 24800 - spot) - 200;
        break;
      default:
        payoff = 0;
    }

    data.push({ spot: Math.round(spot), payoff: Math.round(payoff * 10) });
  }

  return data;
}

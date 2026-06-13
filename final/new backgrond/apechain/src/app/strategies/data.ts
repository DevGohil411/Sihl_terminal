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
    capitalRequired: "",
    difficulty: "Beginner",
    legs: 2,
    description:
      "A moderately bullish options strategy used when a trader expects the underlying to move higher but does not anticipate an extremely large rally. Constructed by buying a lower strike call and selling a higher strike call to create a defined-risk, defined-reward position. Ideal for steady bullish trends rather than sharp breakouts.",
    howItWorks: [
      "Buy ATM or Slightly ITM Call (Lower Strike)",
      "Sell OTM Call (Higher Strike)",
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
    maxProfit: "Defined — difference between strikes minus net premium paid",
    maxLoss: "Defined — net premium paid for the spread",
    breakeven: "Long Call Strike + Net Premium Paid",
    exampleTrade: [
      "NIFTY = 25,000",
      "Buy 25,000 CE (ATM Call)",
      "Sell 25,200 CE (OTM Call)",
      "Why: The bought call provides bullish exposure while the sold call reduces the cost of the trade. Ideal when expecting a moderate upward move rather than an explosive rally.",
    ],
  },
  {
    id: "bear-put-spread",
    name: "Bear Put Spread",
    category: "Spreads",
    marketView: "Moderately Bearish",
    riskLevel: "Moderate",
    rewardPotential: "Limited",
    capitalRequired: "",
    difficulty: "Beginner",
    legs: 2,
    description:
      "A moderately bearish strategy designed for traders who expect the market to decline over a specific period. Created by buying a higher strike put and selling a lower strike put, which reduces the overall premium cost compared to a standalone put. Allows traders to benefit from downside movement while keeping risk and capital deployment under control.",
    howItWorks: [
      "Buy ATM or Slightly ITM Put (Higher Strike)",
      "Sell OTM Put (Lower Strike)",
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
    maxProfit: "Defined — difference between strikes minus net premium",
    maxLoss: "Defined — net premium paid",
    breakeven: "Long Put Strike - Net Premium Paid",
    exampleTrade: [
      "NIFTY = 25,000",
      "Buy 25,000 PE (ATM Put)",
      "Sell 24,800 PE (OTM Put)",
      "Why: The purchased put benefits from downside movement while the sold put offsets part of the premium cost. Suitable when expecting a moderate decline.",
    ],
  },
  {
    id: "iron-condor",
    name: "Iron Condor",
    category: "Income",
    marketView: "Neutral",
    riskLevel: "High",
    rewardPotential: "Limited",
    capitalRequired: "",
    difficulty: "Advanced",
    legs: 4,
    description:
      "A market-neutral options strategy designed to profit from range-bound price action. Created by simultaneously selling an out-of-the-money put spread and an out-of-the-money call spread. Traders use this when they believe the underlying will remain within a predefined range until expiration. Benefits from time decay and falling implied volatility.",
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
    maxProfit: "Defined — net credit received",
    maxLoss: "Defined — width of wider spread minus net credit",
    breakeven: "Short Call Strike + Credit OR Short Put Strike - Credit",
    exampleTrade: [
      "NIFTY = 25,000",
      "Buy 24,600 PE (Long Put)",
      "Sell 24,800 PE (Short Put)",
      "Sell 25,200 CE (Short Call)",
      "Buy 25,400 CE (Long Call)",
      "Structure: Long PE — Short PE — Spot — Short CE — Long CE",
      "Why: Used when expecting the market to remain within a defined range until expiry.",
    ],
  },
  {
    id: "iron-butterfly",
    name: "Iron Butterfly",
    category: "Income",
    marketView: "Neutral",
    riskLevel: "High",
    rewardPotential: "Limited",
    capitalRequired: "",
    difficulty: "Advanced",
    legs: 4,
    description:
      "An advanced income strategy that generates profit when the underlying stays near the center strike at expiry. Offers higher reward potential than the Iron Condor with tighter risk boundaries. Constructed by selling ATM options and buying OTM wings on both sides.",
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
    maxProfit: "Defined — net credit received",
    maxLoss: "Defined — difference between strikes minus net credit",
    breakeven: "Short Call Strike + Credit OR Short Put Strike - Credit",
    exampleTrade: [
      "Sell NIFTY 25000 CE @ ₹150",
      "Buy NIFTY 25200 CE @ ₹50",
      "Sell NIFTY 25000 PE @ ₹150",
      "Buy NIFTY 24800 PE @ ₹50",
      "Net Credit = ₹200 per lot",
    ],
  },
  {
    id: "jade-lizard",
    name: "Jade Lizard",
    category: "Income",
    marketView: "Moderately Bullish",
    riskLevel: "High",
    rewardPotential: "Limited",
    capitalRequired: "",
    difficulty: "Advanced",
    legs: 3,
    description:
      "A premium collection strategy typically deployed in neutral to slightly bullish market conditions. Constructed by selling a put option, selling a call option, and buying a further out-of-the-money call option to hedge the upside risk. The objective is to generate consistent income through option premium decay while maintaining a favorable risk profile.",
    howItWorks: [
      "Sell OTM Put",
      "Sell OTM Call",
      "Buy Higher Strike OTM Call",
      "Collect Net Credit",
      "Profit if price stays above short put",
    ],
    advantages: [
      "Generates premium income",
      "No upside risk beyond spread width",
      "High probability setup",
      "Beneficial in bullish-to-neutral markets",
    ],
    disadvantages: [
      "Downside risk remains",
      "Requires margin",
      "Assignment risk exists",
    ],
    bestConditions: [
      "Moderately bullish to neutral outlook",
      "Low to moderate volatility",
      "Confident price will stay above short put strike",
      "Income-focused traders comfortable with margin",
    ],
    maxProfit: "Defined — net credit received",
    maxLoss: "Defined — difference between put strikes minus net credit",
    breakeven: "Short Put Strike - Net Credit Received",
    exampleTrade: [
      "NIFTY = 25,000",
      "Sell 24,800 PE (Short Put)",
      "Sell 25,200 CE (Short Call)",
      "Buy 25,400 CE (Long Call Hedge)",
      "Structure: Short Put + Short Call Spread",
      "Why: Generates premium income while eliminating upside risk through the purchased call hedge.",
    ],
  },
  {
    id: "batman-strategy",
    name: "Batman Strategy",
    category: "Volatility",
    marketView: "Volatility Expansion",
    riskLevel: "High",
    rewardPotential: "Substantial",
    capitalRequired: "",
    difficulty: "Advanced",
    legs: 4,
    description:
      "A volatility-focused options structure designed for major event-driven opportunities. Commonly used before earnings announcements, budget sessions, election results, central bank decisions, or other events that may trigger significant market movement. Structured to profit from sharp directional expansion while keeping overall risk defined.",
    howItWorks: [
      "Buy Wing Options (Outer strikes)",
      "Sell Inner Options (Closer to ATM)",
      "Construct Symmetrical Risk Profile",
      "Benefit from strong price movement",
      "Defined risk structure",
    ],
    advantages: [
      "Defined maximum risk",
      "Benefits from volatility expansion",
      "Suitable for event-driven trades",
      "Attractive risk/reward profile",
    ],
    disadvantages: [
      "Time decay impact",
      "Requires significant movement",
      "More complex than basic spreads",
    ],
    bestConditions: [
      "Expected large move around events or earnings",
      "Implied volatility expected to rise",
      "Directional bias uncertain but move size expected",
      "Experienced options traders",
    ],
    maxProfit: "Defined but high when price moves sharply beyond breakevens",
    maxLoss: "Defined — net debit or defined risk at center strike",
    breakeven: "Upper and lower strikes adjusted by net credit/debit",
    exampleTrade: [
      "NIFTY = 25,000",
      "Buy 24,700 PE (Wing)",
      "Sell 24,850 PE (Inner)",
      "Sell 25,150 CE (Inner)",
      "Buy 25,300 CE (Wing)",
      "Why: Designed for major events where volatility expansion is expected. Profits from large moves while keeping risk defined.",
    ],
  },
];

export function searchStrategies(query: string) {
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
      case "jade-lizard":
        payoff =
          140 -
          Math.max(0, 24800 - spot) -
          Math.max(0, spot - 25200) +
          Math.max(0, spot - 25400);
        break;
      case "batman-strategy":
        payoff =
          Math.max(0, spot - 25200) -
          2 * Math.max(0, spot - 25000) +
          Math.max(0, spot - 24800) +
          Math.max(0, 24800 - spot) -
          2 * Math.max(0, 25000 - spot) +
          Math.max(0, 25200 - spot) +
          150;
        break;
      default:
        payoff = 0;
    }

    data.push({ spot: Math.round(spot), payoff: Math.round(payoff * 10) });
  }

  return data;
}

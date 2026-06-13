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
      "A defined-risk bullish strategy created by buying a call option and simultaneously selling a higher strike call. Ideal when expecting a moderate upward move while limiting capital outlay.",
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
      "A limited-risk bearish strategy using two put options. Buy a higher strike put and sell a lower strike put to reduce premium cost while maintaining downside exposure.",
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
      "A premium collection strategy designed for range-bound markets. Combines a bull put spread and bear call spread to profit when price remains inside a defined range.",
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
      "An advanced income strategy that generates profit when the underlying stays near the center strike at expiry. Offers higher reward potential with tighter risk boundaries.",
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
    capitalRequired: "₹75,000",
    difficulty: "Advanced",
    legs: 3,
    description:
      "A premium-selling options strategy combining a short put with a short call spread. Designed to generate income while maintaining no upside risk beyond the call spread width.",
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
    maxProfit: "Net credit received",
    maxLoss: "Difference between put strikes minus net credit",
    breakeven: "Short Put Strike - Net Credit Received",
    exampleTrade: [
      "Sell NIFTY 24800 PE @ ₹90",
      "Sell NIFTY 25200 CE @ ₹80",
      "Buy NIFTY 25400 CE @ ₹30",
      "Net Credit = ₹140 per lot",
    ],
  },
  {
    id: "batman-strategy",
    name: "Batman Strategy",
    category: "Volatility",
    marketView: "Volatility Expansion",
    riskLevel: "High",
    rewardPotential: "Substantial",
    capitalRequired: "₹90,000",
    difficulty: "Advanced",
    legs: 4,
    description:
      "A multi-leg options structure designed to benefit from sharp directional movement and volatility expansion. Commonly used when large market moves are expected around events.",
    howItWorks: [
      "Buy Wing Options",
      "Sell Inner Options",
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
    maxProfit: "Limited but high when price moves sharply beyond breakevens",
    maxLoss: "Net debit or defined risk at center strike",
    breakeven: "Upper and lower strikes adjusted by net credit/debit",
    exampleTrade: [
      "Buy NIFTY 24800 PE @ ₹40",
      "Sell 2x NIFTY 25000 PE @ ₹90",
      "Buy NIFTY 25200 CE @ ₹40",
      "Sell 2x NIFTY 25000 CE @ ₹90",
      "Net Credit = ₹100 per set",
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

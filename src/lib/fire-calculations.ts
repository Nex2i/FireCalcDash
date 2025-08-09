import type { FireCalculationResult, Windfall } from "@shared/schema";

export interface FireInputs {
  startingInvestments: number;
  monthlyContributions: number;
  // How contributions are determined
  contributionMode: "fixed" | "salaryPercent";
  // Salary-based fields
  annualSalary: number;
  salaryContributionPercent: number; // percent of salary to contribute annually
  salaryAnnualRaisePercent: number; // expected annual raise percent
  currentAge: number;
  annualExpenses: number;
  annualReturn: number;
  inflationRate: number;
  withdrawalRate: number;
  windfalls: Windfall[];
  adjustContributionsForInflation: boolean;
}

export function calculateFire(inputs: FireInputs): FireCalculationResult {
  const {
    startingInvestments,
    monthlyContributions,
    contributionMode = "fixed",
    annualSalary = 0,
    salaryContributionPercent = 0,
    salaryAnnualRaisePercent = 0,
    currentAge,
    annualExpenses,
    annualReturn,
    inflationRate,
    withdrawalRate,
    windfalls,
    adjustContributionsForInflation,
  } = inputs;

  // Calculate real FIRE number
  const realFireNumber = annualExpenses / (withdrawalRate / 100);

  // Create year-by-year projection
  const projectionData = [];
  let currentInvestments = startingInvestments;
  let age = currentAge;
  let fireAchieved = false;
  let achievableAge = 0;
  const startYear = new Date().getFullYear();

  // Project up to 40 years or until FIRE is achieved
  for (let year = 0; year < 40 && age <= 100; year++) {
    // Calculate inflation-adjusted FIRE target for this year
    const yearsFromNow = year;
    const fireTarget =
      realFireNumber * Math.pow(1 + inflationRate / 100, yearsFromNow);

    // Store starting balance for the year
    const startingBalance = currentInvestments;

    // Calculate annual contributions
    let annualContribution: number;
    if (contributionMode === "salaryPercent") {
      // Base salary grows by salaryAnnualRaisePercent each year
      const salaryThisYear =
        annualSalary *
        Math.pow(1 + salaryAnnualRaisePercent / 100, yearsFromNow);
      const annualFromSalary =
        salaryThisYear * (salaryContributionPercent / 100);
      annualContribution = annualFromSalary;
    } else {
      // Fixed monthly contributions; can optionally adjust for inflation
      const baseAnnualContribution = monthlyContributions * 12;
      annualContribution = adjustContributionsForInflation
        ? baseAnnualContribution *
          Math.pow(1 + inflationRate / 100, yearsFromNow)
        : baseAnnualContribution;
    }
    currentInvestments += annualContribution;

    // Add any windfalls for this age
    const windfall = windfalls.find((w) => w.ageReceived === age);
    const windfallAmount = windfall ? windfall.amount : 0;
    let status: "short" | "windfall" | "fire" = "short";
    if (windfall) {
      currentInvestments += windfall.amount;
      status = "windfall";
    }

    // Apply investment growth
    const preGrowthValue = currentInvestments;
    currentInvestments *= 1 + annualReturn / 100;
    const investmentGrowth = currentInvestments - preGrowthValue;

    // Calculate potential withdrawals
    const potentialWithdrawalNominal =
      currentInvestments * (withdrawalRate / 100);
    // Real withdrawal is the nominal amount adjusted back to today's purchasing power
    const potentialWithdrawalReal =
      potentialWithdrawalNominal /
      Math.pow(1 + inflationRate / 100, yearsFromNow);

    // Check if FIRE is achieved
    if (currentInvestments >= fireTarget && !fireAchieved) {
      fireAchieved = true;
      achievableAge = age;
      status = "fire";
    } else if (fireAchieved) {
      status = "fire";
    }

    projectionData.push({
      age,
      year: startYear + year,
      investmentValue: Math.round(currentInvestments / 1000) * 1000, // Round to nearest $1000
      annualContribution: Math.round(annualContribution / 1000) * 1000,
      potentialWithdrawalNominal:
        Math.round(potentialWithdrawalNominal / 1000) * 1000,
      potentialWithdrawalReal:
        Math.round(potentialWithdrawalReal / 1000) * 1000,
      fireTarget: Math.round(fireTarget / 1000) * 1000,
      windfallAmount:
        windfallAmount > 0
          ? Math.round(windfallAmount / 1000) * 1000
          : undefined,
      investmentGrowth: Math.round(investmentGrowth / 1000) * 1000,
      status,
    });

    age++;
  }

  // If FIRE wasn't achieved in the projection, set achievable age to the last projected age
  if (!fireAchieved) {
    achievableAge = age - 1;
  }

  const yearsToRetirement = achievableAge - currentAge;
  const nominalFireNumber =
    realFireNumber * Math.pow(1 + inflationRate / 100, yearsToRetirement);

  return {
    realFireNumber: Math.round(realFireNumber / 1000) * 1000,
    nominalFireNumber: Math.round(nominalFireNumber / 1000) * 1000,
    achievableAge,
    yearsToRetirement,
    projectionData,
  };
}

export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  } else {
    return `$${value.toLocaleString()}`;
  }
}

export function formatCurrencyDetailed(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

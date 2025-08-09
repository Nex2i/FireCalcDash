import { z } from "zod";

// Zod schemas and TypeScript types without Drizzle

export const windfallSchema = z.object({
  id: z.string(),
  amount: z.number().positive(),
  ageReceived: z.number().int().min(18).max(120),
});

// Base scenario data used by the app (without persistence-specific fields)
export const scenarioSchema = z.object({
  name: z.string(),
  startingInvestments: z.number().nonnegative(),
  monthlyContributions: z.number().nonnegative(),
  currentAge: z.number().int().min(18).max(100),
  annualExpenses: z.number().positive(),
  annualReturn: z.number().min(0).max(30).default(7),
  inflationRate: z.number().min(0).max(20).default(3),
  withdrawalRate: z.number().min(0.1).max(10).default(4),
  adjustContributionsForInflation: z.boolean().default(false),
  windfalls: z.array(windfallSchema).default([]),
});

export type Scenario = z.infer<typeof scenarioSchema>;
export type Windfall = z.infer<typeof windfallSchema>;

export interface FireCalculationResult {
  realFireNumber: number;
  nominalFireNumber: number;
  achievableAge: number;
  yearsToRetirement: number;
  projectionData: {
    age: number;
    year: number;
    investmentValue: number;
    annualContribution: number;
    potentialWithdrawalNominal: number;
    potentialWithdrawalReal: number;
    fireTarget: number;
    windfallAmount?: number;
    investmentGrowth: number;
    status: "short" | "windfall" | "fire";
  }[];
}

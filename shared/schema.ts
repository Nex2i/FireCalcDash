import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const scenarios = pgTable("scenarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  startingInvestments: real("starting_investments").notNull(),
  monthlyContributions: real("monthly_contributions").notNull(),
  currentAge: integer("current_age").notNull(),
  annualExpenses: real("annual_expenses").notNull(),
  annualReturn: real("annual_return").notNull().default(7),
  inflationRate: real("inflation_rate").notNull().default(3),
  withdrawalRate: real("withdrawal_rate").notNull().default(4),
  adjustContributionsForInflation: integer("adjust_contributions_for_inflation").notNull().default(0),
  windfalls: json("windfalls").notNull().default([]),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const windfallSchema = z.object({
  id: z.string(),
  amount: z.number().positive(),
  ageReceived: z.number().int().min(18).max(120),
});

export const insertScenarioSchema = createInsertSchema(scenarios, {
  startingInvestments: z.number().nonnegative(),
  monthlyContributions: z.number().nonnegative(),
  currentAge: z.number().int().min(18).max(100),
  annualExpenses: z.number().positive(),
  annualReturn: z.number().min(0).max(30),
  inflationRate: z.number().min(0).max(20),
  withdrawalRate: z.number().min(0.1).max(10),
  windfalls: z.array(windfallSchema).default([]),
}).extend({
  adjustContributionsForInflation: z.boolean().default(false),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type Scenario = typeof scenarios.$inferSelect;
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
    status: 'short' | 'windfall' | 'fire';
  }[];
}

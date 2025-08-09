import { type Scenario, type InsertScenario } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getScenario(id: string): Promise<Scenario | undefined>;
  getAllScenarios(): Promise<Scenario[]>;
  createScenario(scenario: InsertScenario): Promise<Scenario>;
  updateScenario(id: string, scenario: Partial<InsertScenario>): Promise<Scenario | undefined>;
  deleteScenario(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private scenarios: Map<string, Scenario>;

  constructor() {
    this.scenarios = new Map();
  }

  async getScenario(id: string): Promise<Scenario | undefined> {
    return this.scenarios.get(id);
  }

  async getAllScenarios(): Promise<Scenario[]> {
    return Array.from(this.scenarios.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createScenario(insertScenario: InsertScenario): Promise<Scenario> {
    const id = randomUUID();
    const scenario: Scenario = { 
      ...insertScenario,
      adjustContributionsForInflation: insertScenario.adjustContributionsForInflation ? 1 : 0,
      id,
      createdAt: new Date().toISOString()
    };
    this.scenarios.set(id, scenario);
    return scenario;
  }

  async updateScenario(id: string, updates: Partial<InsertScenario>): Promise<Scenario | undefined> {
    const existing = this.scenarios.get(id);
    if (!existing) return undefined;

    const processedUpdates = { ...updates };
    if ('adjustContributionsForInflation' in processedUpdates) {
      processedUpdates.adjustContributionsForInflation = processedUpdates.adjustContributionsForInflation ? 1 : 0;
    }

    const updated: Scenario = { ...existing, ...processedUpdates };
    this.scenarios.set(id, updated);
    return updated;
  }

  async deleteScenario(id: string): Promise<boolean> {
    return this.scenarios.delete(id);
  }
}

export const storage = new MemStorage();

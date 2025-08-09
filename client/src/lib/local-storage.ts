import type { Scenario } from "@shared/schema";

const SCENARIOS_KEY = 'fire-calculator-scenarios';

export interface StoredScenario extends Scenario {
  id: string;
  createdAt: string;
}

export const localStorageService = {
  // Get all scenarios from localStorage
  getScenarios(): StoredScenario[] {
    try {
      const stored = localStorage.getItem(SCENARIOS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading scenarios from localStorage:', error);
      return [];
    }
  },

  // Save a new scenario to localStorage
  saveScenario(scenario: Omit<StoredScenario, 'id' | 'createdAt'>): StoredScenario {
    try {
      const scenarios = this.getScenarios();
      const newScenario: StoredScenario = {
        ...scenario,
        id: generateId(),
        createdAt: new Date().toISOString()
      };
      scenarios.push(newScenario);
      localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
      return newScenario;
    } catch (error) {
      console.error('Error saving scenario to localStorage:', error);
      throw new Error('Failed to save scenario');
    }
  },

  // Delete a scenario from localStorage
  deleteScenario(id: string): void {
    try {
      const scenarios = this.getScenarios();
      const filtered = scenarios.filter(s => s.id !== id);
      localStorage.setItem(SCENARIOS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting scenario from localStorage:', error);
      throw new Error('Failed to delete scenario');
    }
  },

  // Clear all scenarios from localStorage
  clearAllScenarios(): void {
    try {
      localStorage.removeItem(SCENARIOS_KEY);
    } catch (error) {
      console.error('Error clearing scenarios from localStorage:', error);
      throw new Error('Failed to clear scenarios');
    }
  }
};

// Generate a simple unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
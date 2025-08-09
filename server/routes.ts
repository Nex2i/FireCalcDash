import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScenarioSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all scenarios
  app.get("/api/scenarios", async (req, res) => {
    try {
      const scenarios = await storage.getAllScenarios();
      res.json(scenarios);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scenarios" });
    }
  });

  // Get a specific scenario
  app.get("/api/scenarios/:id", async (req, res) => {
    try {
      const scenario = await storage.getScenario(req.params.id);
      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scenario" });
    }
  });

  // Create a new scenario
  app.post("/api/scenarios", async (req, res) => {
    try {
      const validatedData = insertScenarioSchema.parse(req.body);
      const scenario = await storage.createScenario(validatedData);
      res.status(201).json(scenario);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create scenario" });
    }
  });

  // Update a scenario
  app.patch("/api/scenarios/:id", async (req, res) => {
    try {
      const validatedData = insertScenarioSchema.partial().parse(req.body);
      const scenario = await storage.updateScenario(req.params.id, validatedData);
      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update scenario" });
    }
  });

  // Delete a scenario
  app.delete("/api/scenarios/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteScenario(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete scenario" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

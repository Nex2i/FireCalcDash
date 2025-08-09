import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Trash2, Plus, Save, FolderOpen } from "lucide-react";
import { useState } from "react";
import type { StoredScenario } from "@/lib/local-storage";
import type { FireInputs } from "@/lib/fire-calculations";
import { formatCurrency } from "@/lib/fire-calculations";

interface ScenarioComparisonProps {
  scenarios: StoredScenario[];
  currentInputs: FireInputs;
  onSaveScenario: (name: string) => void;
  onLoadScenario: (scenario: StoredScenario) => void;
  onDeleteScenario: (id: string) => void;
}

export function ScenarioComparison({ 
  scenarios, 
  currentInputs, 
  onSaveScenario, 
  onLoadScenario, 
  onDeleteScenario 
}: ScenarioComparisonProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState("");

  const handleSaveScenario = () => {
    if (scenarioName.trim()) {
      onSaveScenario(scenarioName.trim());
      setScenarioName("");
      setSaveDialogOpen(false);
    }
  };

  // Show up to 3 scenarios (current + 2 saved)
  const displayScenarios = scenarios.slice(0, 2);
  
  return (
    <div className="mt-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <i className="fas fa-layer-group text-primary mr-2"></i>
            Scenario Comparison
          </h3>
          <div className="flex space-x-2">
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary text-white hover:bg-blue-700"
                  data-testid="button-save-scenario"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Current
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Scenario</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="scenario-name">Scenario Name</Label>
                    <Input
                      id="scenario-name"
                      value={scenarioName}
                      onChange={(e) => setScenarioName(e.target.value)}
                      placeholder="Enter scenario name..."
                      data-testid="input-scenario-name"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setSaveDialogOpen(false)}
                      data-testid="button-cancel-save"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveScenario}
                      data-testid="button-confirm-save"
                    >
                      Save Scenario
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Scenario */}
          <Card className="bg-blue-50 border-2 border-blue-200">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">Current Scenario</CardTitle>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Active
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm" data-testid="current-scenario">
              <div className="flex justify-between">
                <span className="text-gray-600">Starting Investments:</span>
                <span className="font-medium">{formatCurrency(currentInputs.startingInvestments)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Contribution:</span>
                <span className="font-medium">{formatCurrency(currentInputs.monthlyContributions)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Age:</span>
                <span className="font-medium">{currentInputs.currentAge}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Annual Expenses:</span>
                <span className="font-medium">{formatCurrency(currentInputs.annualExpenses)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Saved Scenarios */}
          {displayScenarios.map((scenario, index) => (
            <Card key={scenario.id} className="bg-gray-50 border border-gray-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{scenario.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-red-500 p-1"
                      onClick={() => onDeleteScenario(scenario.id)}
                      data-testid={`button-delete-scenario-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm" data-testid={`saved-scenario-${index}`}>
                <div className="flex justify-between">
                  <span className="text-gray-600">Starting Investments:</span>
                  <span className="font-medium">{formatCurrency(scenario.startingInvestments)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Contribution:</span>
                  <span className="font-medium">{formatCurrency(scenario.monthlyContributions)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Age:</span>
                  <span className="font-medium">{scenario.currentAge}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Annual Expenses:</span>
                  <span className="font-medium">{formatCurrency(scenario.annualExpenses)}</span>
                </div>
                <Button 
                  className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300"
                  onClick={() => onLoadScenario(scenario)}
                  data-testid={`button-load-scenario-${index}`}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Load Scenario
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Empty Scenario Slot */}
          {displayScenarios.length < 2 && (
            <Card className="bg-gray-50 border-2 border-dashed border-gray-300">
              <CardContent className="flex items-center justify-center h-full min-h-[200px]">
                <div className="text-center">
                  <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Save another scenario to compare</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

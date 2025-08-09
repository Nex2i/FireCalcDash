import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { WindfallManager } from "@/components/windfall-manager";
import { InvestmentChart } from "@/components/investment-chart";
import { ScenarioComparison } from "@/components/scenario-comparison";
import {
  calculateFire,
  formatCurrency,
  formatCurrencyDetailed,
  type FireInputs,
} from "@/lib/fire-calculations";
import { localStorageService, type StoredScenario } from "@/lib/local-storage";
import { useToast } from "@/hooks/use-toast";
import type { Windfall } from "@shared/schema";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  Calculator,
  BarChart3,
  Download,
} from "lucide-react";

export function FireCalculator() {
  const { toast } = useToast();

  // Form state
  const [inputs, setInputs] = useState<FireInputs>({
    startingInvestments: 500000,
    monthlyContributions: 8000,
    currentAge: 35,
    annualExpenses: 200000,
    annualReturn: 10,
    inflationRate: 3,
    withdrawalRate: 4,
    windfalls: [],
    adjustContributionsForInflation: false,
  });

  // Local scenarios state
  const [scenarios, setScenarios] = useState<StoredScenario[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load scenarios from localStorage on component mount
  useEffect(() => {
    try {
      const storedScenarios = localStorageService.getScenarios();
      setScenarios(storedScenarios);
    } catch (error) {
      console.error("Error loading scenarios:", error);
      toast({
        title: "Failed to load saved scenarios",
        variant: "destructive",
      });
    }
  }, []);

  // Calculate FIRE results in real-time
  const fireResult = useMemo(() => {
    return calculateFire(inputs);
  }, [inputs]);

  const updateInput = (field: keyof FireInputs, value: any) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveScenario = async (name: string) => {
    setIsLoading(true);
    try {
      const scenarioToSave = {
        name,
        ...inputs,
        adjustContributionsForInflation: inputs.adjustContributionsForInflation,
      };
      const newScenario = localStorageService.saveScenario(scenarioToSave);
      setScenarios((prev) => [...prev, newScenario]);
      toast({ title: "Scenario saved successfully!" });
    } catch (error) {
      console.error("Error saving scenario:", error);
      toast({ title: "Failed to save scenario", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadScenario = (scenario: StoredScenario) => {
    setInputs({
      startingInvestments: scenario.startingInvestments,
      monthlyContributions: scenario.monthlyContributions,
      currentAge: scenario.currentAge,
      annualExpenses: scenario.annualExpenses,
      annualReturn: scenario.annualReturn,
      inflationRate: scenario.inflationRate,
      withdrawalRate: scenario.withdrawalRate,
      windfalls: scenario.windfalls as Windfall[],
      adjustContributionsForInflation: Boolean(
        scenario.adjustContributionsForInflation
      ),
    });
    toast({ title: `Loaded scenario: ${scenario.name}` });
  };

  const handleDeleteScenario = async (id: string) => {
    setIsLoading(true);
    try {
      localStorageService.deleteScenario(id);
      setScenarios((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Scenario deleted successfully!" });
    } catch (error) {
      console.error("Error deleting scenario:", error);
      toast({ title: "Failed to delete scenario", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "# FIRE Calculator Projection Export",
      "# Calculation Methodology:",
      "# - Real FIRE Number: Annual Expenses / (Withdrawal Rate / 100) = $" +
        (inputs.annualExpenses || 0).toLocaleString() +
        " / " +
        inputs.withdrawalRate / 100 +
        " = $" +
        (fireResult.realFireNumber || 0).toLocaleString(),
      "# - Nominal FIRE Number: Real FIRE Number * (1 + Inflation Rate)^Years to Retirement",
      "# - Investment Growth: Previous Investment Value * (1 + Annual Return Rate)",
      "# - Potential Withdrawal (Nominal): Current Investment Value * (Withdrawal Rate / 100)",
      "# - Potential Withdrawal (Real): Nominal Withdrawal / (1 + Inflation Rate)^Years from Now",
      "# - Annual Contribution: Base Monthly Contribution * 12" +
        (inputs.adjustContributionsForInflation
          ? " * (1 + Inflation Rate)^Years"
          : ""),
      "# - Assumptions: Annual Return=" +
        inputs.annualReturn +
        "%, Inflation=" +
        inputs.inflationRate +
        "%, Withdrawal Rate=" +
        inputs.withdrawalRate +
        "%",
      "#",
      "Age,Year,Investment Value,Annual Contribution,Potential Withdrawal (Nominal),Potential Withdrawal (Real),Investment Growth,FIRE Target,Status",
    ];

    const csvData = fireResult.projectionData.map((row) =>
      [
        row.age,
        row.year,
        row.investmentValue,
        row.annualContribution,
        row.potentialWithdrawalNominal,
        row.potentialWithdrawalReal,
        row.investmentGrowth,
        row.fireTarget,
        row.status,
      ].join(",")
    );

    const csvContent = [...headers, ...csvData].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `fire-projection-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "CSV export downloaded successfully!" });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form Section */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Calculator className="text-primary mr-2" size={20} />
                Calculator Inputs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Required Fields */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                  Required Information
                </h3>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Liquid Investments
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      type="text"
                      value={(inputs.startingInvestments || 0).toLocaleString()}
                      onChange={(e) => {
                        const value =
                          parseInt(e.target.value.replace(/,/g, "")) || 0;
                        updateInput("startingInvestments", value);
                      }}
                      className="pl-8 pr-4 py-3"
                      placeholder="0"
                      data-testid="input-starting-investments"
                    />
                  </div>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Contributions
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      type="text"
                      value={(
                        inputs.monthlyContributions || 0
                      ).toLocaleString()}
                      onChange={(e) => {
                        const value =
                          parseInt(e.target.value.replace(/,/g, "")) || 0;
                        updateInput("monthlyContributions", value);
                      }}
                      className="pl-8 pr-4 py-3"
                      placeholder="0"
                      data-testid="input-monthly-contributions"
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-3">
                    <Checkbox
                      id="adjust-inflation"
                      checked={inputs.adjustContributionsForInflation}
                      onCheckedChange={(checked) =>
                        updateInput("adjustContributionsForInflation", checked)
                      }
                      data-testid="checkbox-adjust-contributions-inflation"
                    />
                    <Label
                      htmlFor="adjust-inflation"
                      className="text-sm text-gray-600 cursor-pointer"
                    >
                      Adjust contributions for inflation annually
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {inputs.adjustContributionsForInflation
                      ? "Contributions will increase each year to maintain purchasing power"
                      : "Contributions remain constant over time"}
                  </p>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Age
                  </Label>
                  <Input
                    type="number"
                    value={inputs.currentAge}
                    onChange={(e) =>
                      updateInput("currentAge", parseInt(e.target.value) || 0)
                    }
                    className="px-4 py-3"
                    placeholder="Years"
                    data-testid="input-current-age"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Annual Retirement Expenses
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      type="text"
                      value={(inputs.annualExpenses || 0).toLocaleString()}
                      onChange={(e) => {
                        const value =
                          parseInt(e.target.value.replace(/,/g, "")) || 0;
                        updateInput("annualExpenses", value);
                      }}
                      className="pl-8 pr-4 py-3"
                      placeholder="0"
                      data-testid="input-annual-expenses"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    In today's dollars
                  </p>
                </div>
              </div>

              {/* Optional Fields */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                  Advanced Settings
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      Annual Return
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={inputs.annualReturn}
                        onChange={(e) =>
                          updateInput(
                            "annualReturn",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        step="0.1"
                        className="pr-8 text-sm"
                        data-testid="input-annual-return"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        %
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      Inflation Rate
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={inputs.inflationRate}
                        onChange={(e) =>
                          updateInput(
                            "inflationRate",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        step="0.1"
                        className="pr-8 text-sm"
                        data-testid="input-inflation-rate"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        %
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      Withdrawal Rate
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={inputs.withdrawalRate}
                        onChange={(e) =>
                          updateInput(
                            "withdrawalRate",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        step="0.1"
                        className="pr-8 text-sm"
                        data-testid="input-withdrawal-rate"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Windfalls Section */}
              <WindfallManager
                windfalls={inputs.windfalls}
                onChange={(windfalls) => updateInput("windfalls", windfalls)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Results and Chart Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Results Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Real FIRE Number
                    </p>
                    <p
                      className="text-2xl font-bold text-gray-900"
                      data-testid="text-real-fire-number"
                    >
                      {formatCurrency(fireResult.realFireNumber)}
                    </p>
                    <p className="text-xs text-gray-500">Today's dollars</p>
                  </div>
                  <DollarSign className="text-primary" size={20} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Nominal FIRE Number
                    </p>
                    <p
                      className="text-2xl font-bold text-gray-900"
                      data-testid="text-nominal-fire-number"
                    >
                      {formatCurrency(fireResult.nominalFireNumber)}
                    </p>
                    <p className="text-xs text-gray-500">Future dollars</p>
                  </div>
                  <TrendingUp className="text-accent" size={20} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Achievable Age
                    </p>
                    <p
                      className="text-2xl font-bold text-gray-900"
                      data-testid="text-achievable-age"
                    >
                      {fireResult.achievableAge}
                    </p>
                    <p className="text-xs text-gray-500">Years old</p>
                  </div>
                  <Calendar className="text-secondary" size={20} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Years to Retirement
                    </p>
                    <p
                      className="text-2xl font-bold text-gray-900"
                      data-testid="text-years-to-retirement"
                    >
                      {fireResult.yearsToRetirement}
                    </p>
                    <p className="text-xs text-gray-500">Years remaining</p>
                  </div>
                  <Clock className="text-warning" size={20} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Investment Growth Chart */}
          <InvestmentChart result={fireResult} />

          {/* Detailed Projection Table */}
          <Card className="shadow-sm border border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="text-primary mr-2" size={20} />
                  Year-by-Year Projection
                </CardTitle>
                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  data-testid="button-export-csv"
                >
                  <Download size={16} />
                  Export CSV
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Track your investment growth year by year. The table shows your
                potential withdrawal amount (based on your withdrawal rate),
                investment growth from returns, and progress toward your FIRE
                target.
              </p>
              <div className="flex flex-wrap gap-4 mt-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span>Contributions</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-purple-600 rounded"></div>
                  <span>Withdrawal (Nominal)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-purple-700 rounded"></div>
                  <span>Withdrawal (Real)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-600 rounded"></div>
                  <span>Investment Growth</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-orange-600 rounded"></div>
                  <span>FIRE Target</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-600 rounded"></div>
                  <span>Windfall Year</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="overflow-x-auto max-h-96 relative"
                data-testid="projection-table"
              >
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-gray-200 shadow-sm">
                      <th className="text-left py-3 px-2 font-medium text-gray-700 bg-white">
                        Age
                      </th>
                      <th className="text-center py-3 px-2 font-medium text-gray-700 bg-white">
                        Year
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700 bg-white">
                        Investment Value
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700 bg-white">
                        Annual Contribution
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700 bg-white">
                        Potential Withdrawal (Nominal)
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700 bg-white">
                        Potential Withdrawal (Real)
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700 bg-white">
                        Investment Growth
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700 bg-white">
                        FIRE Target
                      </th>
                      <th className="text-center py-3 px-2 font-medium text-gray-700 bg-white">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fireResult.projectionData.map((yearData, index) => (
                      <tr
                        key={yearData.age}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          yearData.status === "fire"
                            ? "bg-green-50"
                            : yearData.status === "windfall"
                            ? "bg-yellow-50"
                            : ""
                        }`}
                        data-testid={`projection-row-${index}`}
                      >
                        <td className="py-3 px-2 font-medium">
                          {yearData.age}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-600">
                          {yearData.year}
                        </td>
                        <td
                          className={`py-3 px-2 text-right ${
                            yearData.status === "fire"
                              ? "font-semibold text-green-700"
                              : ""
                          }`}
                        >
                          {formatCurrency(yearData.investmentValue)}
                        </td>
                        <td className="py-3 px-2 text-right text-blue-600">
                          {formatCurrency(yearData.annualContribution)}
                          {yearData.windfallAmount && (
                            <div className="text-xs text-yellow-600 font-medium">
                              +{formatCurrency(yearData.windfallAmount)}{" "}
                              windfall
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right text-purple-600 font-medium">
                          {formatCurrency(yearData.potentialWithdrawalNominal)}
                        </td>
                        <td className="py-3 px-2 text-right text-purple-700 font-medium">
                          {formatCurrency(yearData.potentialWithdrawalReal)}
                        </td>
                        <td className="py-3 px-2 text-right text-green-600">
                          {formatCurrency(yearData.investmentGrowth)}
                        </td>
                        <td className="py-3 px-2 text-right text-orange-600">
                          {formatCurrency(yearData.fireTarget)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {yearData.status === "fire" ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-medium">
                              🎯 FIRE!
                            </Badge>
                          ) : yearData.status === "windfall" ? (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 font-medium">
                              💰 Windfall
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                              📈 Building
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scenario Comparison Section */}
      <ScenarioComparison
        scenarios={scenarios}
        currentInputs={inputs}
        onSaveScenario={handleSaveScenario}
        onLoadScenario={handleLoadScenario}
        onDeleteScenario={handleDeleteScenario}
      />
    </div>
  );
}

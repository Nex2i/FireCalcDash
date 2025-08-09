import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function FireCalculator() {
  const { toast } = useToast();

  // Form state
  const [inputs, setInputs] = useState<FireInputs>({
    startingInvestments: 150000,
    monthlyContributions: 1200,
    contributionMode: "fixed",
    annualSalary: 0,
    salaryContributionPercent: 0,
    salaryAnnualRaisePercent: 0,
    currentAge: 26,
    annualExpenses: 200000,
    annualReturn: 10,
    inflationRate: 3,
    withdrawalRate: 4,
    windfalls: [],
    adjustContributionsForInflation: false,
  });

  // Keep local string drafts for number inputs so clearing doesn't force 0
  const [numberDrafts, setNumberDrafts] = useState<Record<string, string>>({});

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
      const scenarioToSave: Omit<StoredScenario, "id" | "createdAt"> = {
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
      contributionMode: (scenario as any).contributionMode || "fixed",
      annualSalary: (scenario as any).annualSalary ?? 0,
      salaryContributionPercent:
        (scenario as any).salaryContributionPercent ?? 0,
      salaryAnnualRaisePercent: (scenario as any).salaryAnnualRaisePercent ?? 0,
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
    // Clear any in-progress drafts when loading a scenario
    setNumberDrafts({});
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
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    <span className="inline-flex items-center gap-1">
                      Starting Liquid Investments
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="What are starting liquid investments?"
                          >
                            <Info size={14} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Current investable assets you can deploy (cash,
                          brokerage, etc.).
                        </TooltipContent>
                      </Tooltip>
                    </span>
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
                    Contribution Method
                  </Label>
                  <RadioGroup
                    value={inputs.contributionMode || "fixed"}
                    onValueChange={(v) =>
                      updateInput("contributionMode", v as any)
                    }
                    className="grid grid-cols-2 gap-3 mb-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem id="contrib-fixed" value="fixed" />
                      <Label htmlFor="contrib-fixed" className="text-sm">
                        Fixed Monthly
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        id="contrib-salary"
                        value="salaryPercent"
                      />
                      <Label htmlFor="contrib-salary" className="text-sm">
                        % of Salary
                      </Label>
                    </div>
                  </RadioGroup>

                  {(inputs.contributionMode || "fixed") === "fixed" ? (
                    <>
                      <Label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="inline-flex items-center gap-1">
                          Monthly Contributions
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="What are monthly contributions?"
                              >
                                <Info size={14} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Amount you plan to invest each month before
                              retirement.
                            </TooltipContent>
                          </Tooltip>
                        </span>
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
                            updateInput(
                              "adjustContributionsForInflation",
                              checked
                            )
                          }
                          data-testid="checkbox-adjust-contributions-inflation"
                        />
                        <Label
                          htmlFor="adjust-inflation"
                          className="text-sm text-gray-600 cursor-pointer inline-flex items-center gap-1"
                        >
                          Adjust contributions for inflation annually
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Adjust contributions for inflation explanation"
                              >
                                <Info size={14} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Increases your monthly contribution each year by
                              the inflation rate.
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {inputs.adjustContributionsForInflation
                          ? "Contributions will increase each year to maintain purchasing power"
                          : "Contributions remain constant over time"}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-3">
                          <Label className="block text-sm font-medium text-gray-700 mb-2">
                            Annual Salary
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                              $
                            </span>
                            <Input
                              type="text"
                              value={(
                                inputs.annualSalary || 0
                              ).toLocaleString()}
                              onChange={(e) => {
                                const value =
                                  parseInt(e.target.value.replace(/,/g, "")) ||
                                  0;
                                updateInput("annualSalary", value);
                              }}
                              className="pl-8 pr-4 py-3"
                              placeholder="0"
                              data-testid="input-annual-salary"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="block text-sm font-medium text-gray-700 mb-2">
                            Contribute % of Salary
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={
                                numberDrafts.salaryContributionPercent ??
                                String(inputs.salaryContributionPercent || 0)
                              }
                              onChange={(e) =>
                                setNumberDrafts((d) => ({
                                  ...d,
                                  salaryContributionPercent: e.target.value,
                                }))
                              }
                              onBlur={(e) => {
                                const v = parseFloat(e.target.value);
                                updateInput(
                                  "salaryContributionPercent",
                                  isNaN(v) ? 0 : v
                                );
                                setNumberDrafts((d) => {
                                  const c: any = { ...d };
                                  delete c.salaryContributionPercent;
                                  return c;
                                });
                              }}
                              step="0.1"
                              className="pr-8 text-sm"
                              data-testid="input-salary-contribution-percent"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                              %
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="block text-sm font-medium text-gray-700 mb-2">
                            Expected Annual Raise
                          </Label>
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Input
                                type="number"
                                value={
                                  numberDrafts.salaryAnnualRaisePercent ??
                                  String(inputs.salaryAnnualRaisePercent || 0)
                                }
                                onChange={(e) =>
                                  setNumberDrafts((d) => ({
                                    ...d,
                                    salaryAnnualRaisePercent: e.target.value,
                                  }))
                                }
                                onBlur={(e) => {
                                  const v = parseFloat(e.target.value);
                                  updateInput(
                                    "salaryAnnualRaisePercent",
                                    isNaN(v) ? 0 : v
                                  );
                                  setNumberDrafts((d) => {
                                    const c: any = { ...d };
                                    delete c.salaryAnnualRaisePercent;
                                    return c;
                                  });
                                }}
                                step="0.1"
                                className="pr-8 text-sm"
                                data-testid="input-salary-annual-raise-percent"
                              />
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                %
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              ={" "}
                              {formatCurrencyDetailed(
                                Math.round(
                                  ((inputs.annualSalary || 0) *
                                    ((inputs.salaryContributionPercent || 0) /
                                      100)) /
                                    12
                                )
                              )}{" "}
                              / mo
                            </span>
                          </div>
                        </div>
                        <div className="col-span-3">
                          <p className="text-xs text-gray-500 mt-1">
                            Annual contribution will be salary × contribution %
                            and will grow with your raises.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="inline-flex items-center gap-1">
                      Current Age
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="What is current age?"
                          >
                            <Info size={14} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Your age today. Used as the starting point for the
                          projection.
                        </TooltipContent>
                      </Tooltip>
                    </span>
                  </Label>
                  <Input
                    type="number"
                    value={numberDrafts.currentAge ?? String(inputs.currentAge)}
                    onChange={(e) =>
                      setNumberDrafts((d) => ({
                        ...d,
                        currentAge: e.target.value,
                      }))
                    }
                    onBlur={(e) => {
                      const v = parseInt(e.target.value);
                      updateInput("currentAge", isNaN(v) ? 0 : v);
                      setNumberDrafts((d) => {
                        const c: any = { ...d };
                        delete c.currentAge;
                        return c;
                      });
                    }}
                    className="px-4 py-3"
                    placeholder="Years"
                    data-testid="input-current-age"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="inline-flex items-center gap-1">
                      Expected Annual Retirement Expenses
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="What are expected annual retirement expenses?"
                          >
                            <Info size={14} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Your yearly spending in retirement expressed in
                          today's dollars.
                        </TooltipContent>
                      </Tooltip>
                    </span>
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
                      <span className="inline-flex items-center gap-1">
                        Annual Return
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-gray-400 hover:text-gray-600"
                              aria-label="Annual return explanation"
                            >
                              <Info size={14} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Expected average annual portfolio return before
                            inflation.
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={
                          numberDrafts.annualReturn ??
                          String(inputs.annualReturn)
                        }
                        onChange={(e) =>
                          setNumberDrafts((d) => ({
                            ...d,
                            annualReturn: e.target.value,
                          }))
                        }
                        onBlur={(e) => {
                          const v = parseFloat(e.target.value);
                          updateInput("annualReturn", isNaN(v) ? 0 : v);
                          setNumberDrafts((d) => {
                            const c: any = { ...d };
                            delete c.annualReturn;
                            return c;
                          });
                        }}
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
                      <span className="inline-flex items-center gap-1">
                        Inflation Rate
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-gray-400 hover:text-gray-600"
                              aria-label="Inflation rate explanation"
                            >
                              <Info size={14} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Expected average increase in prices per year. Used
                            to adjust contributions and targets.
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={
                          numberDrafts.inflationRate ??
                          String(inputs.inflationRate)
                        }
                        onChange={(e) =>
                          setNumberDrafts((d) => ({
                            ...d,
                            inflationRate: e.target.value,
                          }))
                        }
                        onBlur={(e) => {
                          const v = parseFloat(e.target.value);
                          updateInput("inflationRate", isNaN(v) ? 0 : v);
                          setNumberDrafts((d) => {
                            const c: any = { ...d };
                            delete c.inflationRate;
                            return c;
                          });
                        }}
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
                      <span className="inline-flex items-center gap-1">
                        Withdrawal Rate
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-gray-400 hover:text-gray-600"
                              aria-label="Withdrawal rate explanation"
                            >
                              <Info size={14} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            The percent of your portfolio you plan to withdraw
                            annually in retirement (e.g., 4%).
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={
                          numberDrafts.withdrawalRate ??
                          String(inputs.withdrawalRate)
                        }
                        onChange={(e) =>
                          setNumberDrafts((d) => ({
                            ...d,
                            withdrawalRate: e.target.value,
                          }))
                        }
                        onBlur={(e) => {
                          const v = parseFloat(e.target.value);
                          updateInput("withdrawalRate", isNaN(v) ? 0 : v);
                          setNumberDrafts((d) => {
                            const c: any = { ...d };
                            delete c.withdrawalRate;
                            return c;
                          });
                        }}
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
                    <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      Real FIRE Number
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="Real FIRE number definition"
                          >
                            <Info size={14} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Target portfolio in today's dollars: annual expenses ÷
                          (withdrawal rate).
                        </TooltipContent>
                      </Tooltip>
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
                    <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      Nominal FIRE Number
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="Nominal vs real FIRE number"
                          >
                            <Info size={14} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Target in future dollars when you retire: real FIRE
                          number grown by inflation.
                        </TooltipContent>
                      </Tooltip>
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
                    <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      Achievable Age
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="Achievable age definition"
                          >
                            <Info size={14} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          The age when real withdrawal power meets or exceeds
                          your expenses.
                        </TooltipContent>
                      </Tooltip>
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
                    <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      Years to Retirement
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="Years to retirement definition"
                          >
                            <Info size={14} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Number of years from your current age to your
                          achievable age.
                        </TooltipContent>
                      </Tooltip>
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
                        <span className="inline-flex items-center gap-1">
                          Age
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Age column definition"
                              >
                                <Info size={14} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Your age during the given year of the projection.
                            </TooltipContent>
                          </Tooltip>
                        </span>
                      </th>
                      <th className="text-center py-3 px-2 font-medium text-gray-700 bg-white">
                        <span className="inline-flex items-center gap-1">
                          Year
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Year column definition"
                              >
                                <Info size={14} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Calendar year for this row.
                            </TooltipContent>
                          </Tooltip>
                        </span>
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700 bg-white">
                        <span className="inline-flex items-center gap-1 justify-end w-full">
                          Investment Value
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Investment value definition"
                              >
                                <Info size={14} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Portfolio balance at the end of the year.
                            </TooltipContent>
                          </Tooltip>
                        </span>
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700 bg-white">
                        <span className="inline-flex items-center gap-1 justify-end w-full">
                          Annual Contribution
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Annual contribution definition"
                              >
                                <Info size={14} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Total added this year (monthly × 12), plus any
                              windfalls.
                            </TooltipContent>
                          </Tooltip>
                        </span>
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700 bg-white">
                        <span className="inline-flex items-center gap-1 justify-end w-full">
                          Potential Withdrawal (Nominal)
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Nominal withdrawal definition"
                              >
                                <Info size={14} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Withdrawal at your rate using same-year dollars.
                            </TooltipContent>
                          </Tooltip>
                        </span>
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700 bg-white">
                        <span className="inline-flex items-center gap-1 justify-end w-full">
                          Potential Withdrawal (Real)
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Real withdrawal definition"
                              >
                                <Info size={14} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Nominal withdrawal adjusted back to today's
                              dollars.
                            </TooltipContent>
                          </Tooltip>
                        </span>
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700 bg-white">
                        <span className="inline-flex items-center gap-1 justify-end w-full">
                          Investment Growth
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Investment growth definition"
                              >
                                <Info size={14} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Return earned this year from market growth.
                            </TooltipContent>
                          </Tooltip>
                        </span>
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700 bg-white">
                        <span className="inline-flex items-center gap-1 justify-end w-full">
                          FIRE Target
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="FIRE target definition"
                              >
                                <Info size={14} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Nominal target: real FIRE number grown by
                              inflation.
                            </TooltipContent>
                          </Tooltip>
                        </span>
                      </th>
                      <th className="text-center py-3 px-2 font-medium text-gray-700 bg-white">
                        <span className="inline-flex items-center gap-1">
                          Status
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Status definition"
                              >
                                <Info size={14} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Highlights years you hit FIRE or receive a
                              windfall.
                            </TooltipContent>
                          </Tooltip>
                        </span>
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

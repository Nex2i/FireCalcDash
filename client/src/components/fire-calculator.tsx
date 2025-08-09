import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { WindfallManager } from "@/components/windfall-manager";
import { InvestmentChart } from "@/components/investment-chart";
import { ScenarioComparison } from "@/components/scenario-comparison";
import { calculateFire, formatCurrency, formatCurrencyDetailed, type FireInputs } from "@/lib/fire-calculations";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Scenario, Windfall } from "@shared/schema";
import { DollarSign, TrendingUp, Calendar, Clock, Calculator, BarChart3 } from "lucide-react";

export function FireCalculator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [inputs, setInputs] = useState<FireInputs>({
    startingInvestments: 500000,
    monthlyContributions: 8000,
    currentAge: 35,
    annualExpenses: 200000,
    annualReturn: 7,
    inflationRate: 3,
    withdrawalRate: 4,
    windfalls: [],
    adjustContributionsForInflation: false
  });

  // Fetch scenarios
  const { data: scenarios = [] } = useQuery<Scenario[]>({
    queryKey: ["/api/scenarios"],
  });

  // Create scenario mutation
  const createScenarioMutation = useMutation({
    mutationFn: async (data: { name: string } & FireInputs) => {
      const response = await apiRequest("POST", "/api/scenarios", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
      toast({ title: "Scenario saved successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to save scenario", variant: "destructive" });
    }
  });

  // Delete scenario mutation
  const deleteScenarioMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/scenarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
      toast({ title: "Scenario deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete scenario", variant: "destructive" });
    }
  });

  // Calculate FIRE results in real-time
  const fireResult = useMemo(() => {
    return calculateFire(inputs);
  }, [inputs]);

  const updateInput = (field: keyof FireInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveScenario = (name: string) => {
    createScenarioMutation.mutate({ name, ...inputs });
  };

  const handleLoadScenario = (scenario: Scenario) => {
    setInputs({
      startingInvestments: scenario.startingInvestments,
      monthlyContributions: scenario.monthlyContributions,
      currentAge: scenario.currentAge,
      annualExpenses: scenario.annualExpenses,
      annualReturn: scenario.annualReturn,
      inflationRate: scenario.inflationRate,
      withdrawalRate: scenario.withdrawalRate,
      windfalls: scenario.windfalls as Windfall[],
      adjustContributionsForInflation: Boolean(scenario.adjustContributionsForInflation)
    });
    toast({ title: `Loaded scenario: ${scenario.name}` });
  };

  const handleDeleteScenario = (id: string) => {
    deleteScenarioMutation.mutate(id);
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
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      type="text"
                      value={inputs.startingInvestments.toLocaleString()}
                      onChange={(e) => {
                        const value = parseInt(e.target.value.replace(/,/g, '')) || 0;
                        updateInput('startingInvestments', value);
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
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      type="text"
                      value={inputs.monthlyContributions.toLocaleString()}
                      onChange={(e) => {
                        const value = parseInt(e.target.value.replace(/,/g, '')) || 0;
                        updateInput('monthlyContributions', value);
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
                      onCheckedChange={(checked) => updateInput('adjustContributionsForInflation', checked)}
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
                      : "Contributions remain constant over time"
                    }
                  </p>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Age
                  </Label>
                  <Input
                    type="number"
                    value={inputs.currentAge}
                    onChange={(e) => updateInput('currentAge', parseInt(e.target.value) || 0)}
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
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      type="text"
                      value={inputs.annualExpenses.toLocaleString()}
                      onChange={(e) => {
                        const value = parseInt(e.target.value.replace(/,/g, '')) || 0;
                        updateInput('annualExpenses', value);
                      }}
                      className="pl-8 pr-4 py-3"
                      placeholder="0"
                      data-testid="input-annual-expenses"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">In today's dollars</p>
                </div>
              </div>

              {/* Optional Fields */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                  Advanced Settings
                </h3>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Annual Return</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={inputs.annualReturn}
                        onChange={(e) => updateInput('annualReturn', parseFloat(e.target.value) || 0)}
                        step="0.1"
                        className="pr-8 text-sm"
                        data-testid="input-annual-return"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Inflation Rate</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={inputs.inflationRate}
                        onChange={(e) => updateInput('inflationRate', parseFloat(e.target.value) || 0)}
                        step="0.1"
                        className="pr-8 text-sm"
                        data-testid="input-inflation-rate"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Rate</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={inputs.withdrawalRate}
                        onChange={(e) => updateInput('withdrawalRate', parseFloat(e.target.value) || 0)}
                        step="0.1"
                        className="pr-8 text-sm"
                        data-testid="input-withdrawal-rate"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Windfalls Section */}
              <WindfallManager
                windfalls={inputs.windfalls}
                onChange={(windfalls) => updateInput('windfalls', windfalls)}
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
                    <p className="text-sm font-medium text-gray-600">Real FIRE Number</p>
                    <p className="text-2xl font-bold text-gray-900" data-testid="text-real-fire-number">
                      {formatCurrency(fireResult.realFireNumber)}
                    </p>
                    <p className="text-xs text-gray-500">Today's dollars</p>
                  </div>
                  <div className="bg-primary bg-opacity-10 p-3 rounded-lg">
                    <DollarSign className="text-primary" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Nominal FIRE Number</p>
                    <p className="text-2xl font-bold text-gray-900" data-testid="text-nominal-fire-number">
                      {formatCurrency(fireResult.nominalFireNumber)}
                    </p>
                    <p className="text-xs text-gray-500">Future dollars</p>
                  </div>
                  <div className="bg-accent bg-opacity-10 p-3 rounded-lg">
                    <TrendingUp className="text-accent" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Achievable Age</p>
                    <p className="text-2xl font-bold text-gray-900" data-testid="text-achievable-age">
                      {fireResult.achievableAge}
                    </p>
                    <p className="text-xs text-gray-500">Years old</p>
                  </div>
                  <div className="bg-secondary bg-opacity-10 p-3 rounded-lg">
                    <Calendar className="text-secondary" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Years to Retirement</p>
                    <p className="text-2xl font-bold text-gray-900" data-testid="text-years-to-retirement">
                      {fireResult.yearsToRetirement}
                    </p>
                    <p className="text-xs text-gray-500">Years remaining</p>
                  </div>
                  <div className="bg-warning bg-opacity-10 p-3 rounded-lg">
                    <Clock className="text-warning" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Investment Growth Chart */}
          <InvestmentChart result={fireResult} />

          {/* Detailed Projection Table */}
          <Card className="shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <BarChart3 className="text-primary mr-2" size={20} />
                Year-by-Year Projection
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Track your investment growth year by year. The table shows your potential withdrawal amount (based on your withdrawal rate), 
                investment growth from returns, and progress toward your FIRE target.
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
              <div className="overflow-x-auto max-h-96 relative" data-testid="projection-table">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-gray-200 shadow-sm">
                      <th className="text-left py-3 px-2 font-medium text-gray-700 bg-white">Age</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-700 bg-white">Year</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700 bg-white">Investment Value</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700 bg-white">Annual Contribution</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700 bg-white">Potential Withdrawal (Nominal)</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700 bg-white">Potential Withdrawal (Real)</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700 bg-white">Investment Growth</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700 bg-white">FIRE Target</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-700 bg-white">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fireResult.projectionData.map((yearData, index) => (
                      <tr 
                        key={yearData.age} 
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          yearData.status === 'fire' ? 'bg-green-50' : 
                          yearData.status === 'windfall' ? 'bg-yellow-50' : ''
                        }`}
                        data-testid={`projection-row-${index}`}
                      >
                        <td className="py-3 px-2 font-medium">{yearData.age}</td>
                        <td className="py-3 px-2 text-center text-gray-600">{yearData.year}</td>
                        <td className={`py-3 px-2 text-right ${
                          yearData.status === 'fire' ? 'font-semibold text-green-700' : ''
                        }`}>
                          {formatCurrency(yearData.investmentValue)}
                        </td>
                        <td className="py-3 px-2 text-right text-blue-600">
                          {formatCurrency(yearData.annualContribution)}
                          {yearData.windfallAmount && (
                            <div className="text-xs text-yellow-600 font-medium">
                              +{formatCurrency(yearData.windfallAmount)} windfall
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
                          {yearData.status === 'fire' ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-medium">
                              🎯 FIRE!
                            </Badge>
                          ) : yearData.status === 'windfall' ? (
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

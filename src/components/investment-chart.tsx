import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { FireCalculationResult } from "@shared/schema";
import { formatCurrency } from "@/lib/fire-calculations";

interface InvestmentChartProps {
  result: FireCalculationResult;
}

export function InvestmentChart({ result }: InvestmentChartProps) {
  const chartData = result.projectionData.map(data => ({
    age: data.age,
    investmentValue: data.investmentValue,
    fireTarget: data.fireTarget,
    status: data.status
  }));

  const formatTooltipValue = (value: number) => formatCurrency(value);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <i className="fas fa-chart-area text-primary mr-2"></i>
          Investment Growth Projection
        </h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
            <span className="text-gray-600">Investment Value</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-accent rounded-full mr-2"></div>
            <span className="text-gray-600">FIRE Target</span>
          </div>
        </div>
      </div>
      <div className="h-80" data-testid="investment-growth-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="age" 
              stroke="#666"
              fontSize={12}
              tickFormatter={(value) => `Age ${value}`}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              tickFormatter={formatTooltipValue}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value), 
                name === 'investmentValue' ? 'Investment Value' : 'FIRE Target'
              ]}
              labelFormatter={(age) => `Age ${age}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="investmentValue" 
              stroke="#1976D2"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: "#1976D2" }}
            />
            <Line 
              type="monotone" 
              dataKey="fireTarget" 
              stroke="#F57C00"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            {result.achievableAge > 0 && (
              <ReferenceLine 
                x={result.achievableAge} 
                stroke="#4CAF50" 
                strokeDasharray="3 3"
                label={{ value: "FIRE!", position: "top" }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

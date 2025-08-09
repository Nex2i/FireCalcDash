import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import type { Windfall } from "@shared/schema";

// Browser-compatible UUID generation
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

interface WindfallManagerProps {
  windfalls: Windfall[];
  onChange: (windfalls: Windfall[]) => void;
}

export function WindfallManager({ windfalls, onChange }: WindfallManagerProps) {
  const addWindfall = () => {
    const newWindfall: Windfall = {
      id: generateId(),
      amount: 100000,
      ageReceived: 45
    };
    onChange([...windfalls, newWindfall]);
  };

  const removeWindfall = (id: string) => {
    onChange(windfalls.filter(w => w.id !== id));
  };

  const updateWindfall = (id: string, updates: Partial<Windfall>) => {
    onChange(windfalls.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  return (
    <div className="space-y-4 pt-6 border-t border-gray-200">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Windfalls</h3>
        <Button
          onClick={addWindfall}
          variant="ghost"
          size="sm"
          className="text-primary hover:text-blue-700 text-sm font-medium"
          data-testid="button-add-windfall"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Windfall
        </Button>
      </div>

      {windfalls.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No windfalls added yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {windfalls.map((windfall, index) => (
            <div 
              key={windfall.id} 
              className="bg-gray-50 rounded-lg p-4 space-y-3"
              data-testid={`windfall-item-${index}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">
                  Windfall #{index + 1}
                </span>
                <Button
                  onClick={() => removeWindfall(windfall.id)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-red-500 p-1"
                  data-testid={`button-remove-windfall-${index}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <Input
                      type="text"
                      value={windfall.amount.toLocaleString()}
                      onChange={(e) => {
                        const value = parseInt(e.target.value.replace(/,/g, '')) || 0;
                        updateWindfall(windfall.id, { amount: value });
                      }}
                      className="pl-6 pr-2 py-2 text-sm"
                      data-testid={`input-windfall-amount-${index}`}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1">Age Received</Label>
                  <Input
                    type="number"
                    value={windfall.ageReceived}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      updateWindfall(windfall.id, { ageReceived: value });
                    }}
                    className="px-2 py-2 text-sm"
                    data-testid={`input-windfall-age-${index}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

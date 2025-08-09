import { FireCalculator } from "@/components/fire-calculator";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <i className="fas fa-fire text-2xl text-accent mr-3"></i>
              <h1 className="text-xl font-bold text-gray-900">
                FIRE Calculator Dashboard
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <FireCalculator />
    </div>
  );
}

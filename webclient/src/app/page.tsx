import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FundTracker } from '../components/FundAllocation/FundTracker';
import { FundHistory } from '../components/FundAllocation/FundHistory';
import { ValidatorPanel } from '../components/ValidatorPanel';
import { TestPanel } from '../components/TestPanel';
import { ValidatorWeights } from '../components/ValidatorWeights';
import { ContractTest } from '../components/ContractTest';
import { PendingProjects } from '../components/PendingProjects';

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-xl font-bold text-white">F</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                FundX
              </h1>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <ContractTest />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <FundTracker />
            <TestPanel />
            <PendingProjects />
            <ValidatorWeights />
          </div>
          <div className="space-y-8">
            <ValidatorPanel />
            <FundHistory />
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 border-t border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-gray-400 text-sm">
            FundX - Transparent Fund Tracking System © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
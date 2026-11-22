/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Layout } from './components/Layout';
import { SimulationProvider, useSimulation } from './context/SimulationContext';
import { AnimationView } from './views/AnimationView';
import { ExperimentLabView } from './views/ExperimentLabView';
import { GraphsView } from './views/GraphsView';
import { HistoryView } from './views/HistoryView';
import { HowToUseBookView } from './views/HowToUseBookView';
import { LearnView } from './views/LearnView';
import { OverviewView } from './views/OverviewView';
import { SimulatorView } from './views/SimulatorView';

function WorkspaceRouter() {
  const { activePage } = useSimulation();

  switch (activePage) {
    case 'overview':
      return <OverviewView />;
    case 'simulator':
      return <SimulatorView />;
    case 'animation':
      return <AnimationView />;
    case 'graphs':
      return <GraphsView />;
    case 'experiment':
      return <ExperimentLabView />;
    case 'learn':
      return <LearnView />;
    case 'guide':
      return <HowToUseBookView />;
    case 'history':
      return <HistoryView />;
    default:
      return <OverviewView />;
  }
}

export default function App() {
  return (
    <SimulationProvider>
      <Layout>
        <WorkspaceRouter />
      </Layout>
    </SimulationProvider>
  );
}

// App.tsx
// Stage router. The store owns which screen is up; this only maps stage to
// component. See docs/WrongUInverse-technical-design.md §12.

import { ChallengeStage } from './game/stages/ChallengeStage.tsx';
import { ExploreStage } from './game/stages/ExploreStage.tsx';
import { IntroStage } from './game/stages/IntroStage.tsx';
import { NormalStage } from './game/stages/NormalStage.tsx';
import { ResultStage } from './game/stages/ResultStage.tsx';
import { ShiftTransition } from './game/stages/ShiftTransition.tsx';
import { useGameStore } from './game/state/gameStore.ts';
import './styles/wronguinverse.css';

function App() {
  const stage = useGameStore((s) => s.stage);

  switch (stage) {
    case 'intro':
      return <IntroStage />;
    case 'normal':
      return <NormalStage />;
    case 'shift':
      return <ShiftTransition />;
    case 'explore':
      return <ExploreStage />;
    case 'challenge':
      return <ChallengeStage />;
    case 'result':
      return <ResultStage />;
  }
}

export default App;

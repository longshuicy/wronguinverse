// App.tsx
// Stage router. The store owns which screen is up; this only maps stage to
// component and wraps it in the terminal shell.
// See docs/WrongUInverse-technical-design.md §12.

import { TerminalShell } from './components/TerminalShell.tsx';
import { BriefingStage } from './game/stages/BriefingStage.tsx';
import { ChallengeStage } from './game/stages/ChallengeStage.tsx';
import { ExploreStage } from './game/stages/ExploreStage.tsx';
import { IntroStage } from './game/stages/IntroStage.tsx';
import { NormalStage } from './game/stages/NormalStage.tsx';
import { ResultStage } from './game/stages/ResultStage.tsx';
import { ShiftTransition } from './game/stages/ShiftTransition.tsx';
import { useGameStore } from './game/state/gameStore.ts';

// Order matters: fonts and variables first, then the NES layer, then our theme.
import './styles/fonts.css';
import './styles/universe-variables.css';
import './styles/nes-overrides.css';
import './styles/wronguinverse-theme.css';

function CurrentStage() {
  const stage = useGameStore((s) => s.stage);

  switch (stage) {
    case 'intro':
      return <IntroStage />;
    case 'briefing':
      return <BriefingStage />;
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

function App() {
  const stage = useGameStore((s) => s.stage);
  // A universe's palette belongs to a RUN, not to the session. Leaving the run
  // in state on the way back to the intro used to tint the landing page with
  // whichever universe was last played — amber or violet at random, depending
  // on the seed, which is why it only happened sometimes.
  const seed = useGameStore((s) =>
    s.stage === 'intro' || s.stage === 'briefing' ? null : (s.run?.seed ?? null),
  );

  return (
    <TerminalShell stage={stage} seed={seed}>
      <CurrentStage />
    </TerminalShell>
  );
}

export default App;

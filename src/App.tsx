// App.tsx
// Stage router. The store owns which screen is up; this only maps stage to
// component and wraps it in the terminal shell.
// See docs/WrongUInverse-technical-design.md §12.

import { PointerLaw } from './components/PointerLaw.tsx';
import { TerminalShell } from './components/TerminalShell.tsx';
import { BriefingStage } from './game/stages/BriefingStage.tsx';
import { ChallengeStage } from './game/stages/ChallengeStage.tsx';
import { ExploreStage } from './game/stages/ExploreStage.tsx';
import { IntroStage } from './game/stages/IntroStage.tsx';
import { NormalStage } from './game/stages/NormalStage.tsx';
import { ResultStage } from './game/stages/ResultStage.tsx';
import { ShiftTransition } from './game/stages/ShiftTransition.tsx';
import { useGameStore } from './game/state/gameStore.ts';
import type { StageId } from './game/state/types.ts';

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

/**
 * Stages that happen before the drift hits.
 *
 * Calibration is on this list on purpose: Stage 1 is the player's HOME
 * universe, the baseline the shift is measured against, so nothing the shifted
 * universe brings with it — not its palette, not its pointer law — may reach
 * back into it. The reality index is the same argument one screen earlier.
 */
const BEFORE_THE_SHIFT: StageId[] = ['intro', 'briefing', 'normal'];

function App() {
  const stage = useGameStore((s) => s.stage);
  const shifted = !BEFORE_THE_SHIFT.includes(stage);
  // A universe's palette belongs to a RUN, and specifically to the part of it
  // after the drift. Leaving the run in state on the way back to the intro used
  // to tint the landing page with whichever universe was last played; applying
  // it from the moment the run was BUILT was the same bug one screen later,
  // and drew calibration in the shifted universe's colours — which on a violet
  // seed is a near-monochrome screen that reads as lost styling.
  const seed = useGameStore((s) => (shifted ? (s.run?.seed ?? null) : null));

  // Same rule for the law: it arrives WITH the drift, on the shift screen that
  // announces it, and never before. The store clears it on the way back to the
  // intro so a tier is never chosen under the rules of one.
  const law = useGameStore((s) => (shifted ? s.pointerLaw : null));

  return (
    <TerminalShell stage={stage} seed={seed}>
      <CurrentStage />
      {law && <PointerLaw law={law} />}
    </TerminalShell>
  );
}

export default App;

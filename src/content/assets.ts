// assets.ts
// The single manifest mapping semantic asset IDs to files.
//
// Runtime code references IDs, never paths — art guide §18 is explicit that
// filenames must not be reinvented at call sites. Art is produced separately
// and lands in `public/` over time, so EVERY optional asset must degrade to a
// CSS fallback rather than blocking gameplay.
//
// IDs come from docs/WrongUInverse-technical-design.md §19; filenames from the
// asset manifest in docs/WrongUInverse-art-audio-guide.md §4.

export type AssetId =
  | 'bg_calibration_lab'
  | 'mascot_zorblet_idle'
  | 'mascot_zorblet_confused'
  | 'mascot_zorblet_success'
  | 'creature_mip'
  | 'creature_quonk'
  | 'creature_velori'
  | 'creature_plim'
  | 'creature_noxu'
  | 'creature_wubbit'
  | 'prop_flux_crystal'
  | 'prop_reactor_orb'
  | 'prop_antenna'
  | 'prop_antigravity_rock'
  | 'prop_alien_plant'
  | 'prop_tiny_satellite'
  | 'prop_anomaly_blob'
  | 'prop_portal';

/** Paths are relative to the site root, matching the art guide's filenames. */
const ASSET_PATHS: Record<AssetId, string> = {
  bg_calibration_lab: 'backgrounds/bg_calibration_lab.png',

  mascot_zorblet_idle: 'creatures/mascot_zorblet_idle.png',
  mascot_zorblet_confused: 'creatures/mascot_zorblet_confused.png',
  mascot_zorblet_success: 'creatures/mascot_zorblet_success.png',

  creature_mip: 'creatures/creature_mip.png',
  creature_quonk: 'creatures/creature_quonk.png',
  creature_velori: 'creatures/creature_velori.png',
  creature_plim: 'creatures/creature_plim.png',
  creature_noxu: 'creatures/creature_noxu.png',
  creature_wubbit: 'creatures/creature_wubbit.png',

  prop_flux_crystal: 'props/prop_flux_crystal.png',
  prop_reactor_orb: 'props/prop_reactor_orb.png',
  prop_antenna: 'props/prop_antenna.png',
  prop_antigravity_rock: 'props/prop_antigravity_rock.png',
  prop_alien_plant: 'props/prop_alien_plant.png',
  prop_tiny_satellite: 'props/prop_tiny_satellite.png',
  prop_anomaly_blob: 'props/prop_anomaly_blob.png',
  prop_portal: 'props/prop_portal.png',
};

/**
 * Resolve an asset ID to a URL.
 *
 * Goes through `BASE_URL` so the same build works at the domain root and under
 * a GitHub Pages project path. Whether the file actually exists is discovered
 * at load time — see `AssetImage` and `.wui-shell-backdrop`.
 */
export function assetUrl(id: AssetId): string {
  return `${import.meta.env.BASE_URL}${ASSET_PATHS[id]}`;
}

/** Mascot state → asset ID. Technical design §19 "Mascot event mapping". */
export type MascotState =
  'idle' | 'watching' | 'confused' | 'suspicious' | 'discovery' | 'celebrate';

export function mascotAsset(state: MascotState): AssetId {
  switch (state) {
    case 'confused':
    case 'suspicious':
      return 'mascot_zorblet_confused';
    case 'discovery':
    case 'celebrate':
      return 'mascot_zorblet_success';
    case 'idle':
    case 'watching':
      return 'mascot_zorblet_idle';
  }
}

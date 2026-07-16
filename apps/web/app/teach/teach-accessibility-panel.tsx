"use client";

import {
  teachAccessibilityProfileIds,
  teachAccessibilityProfiles,
  teachAccessibilitySettingsContract,
  type TeachAccessibilityProfileId,
  type TeachAccessibilitySettings,
} from "../../lib/teach-contracts";

type TeachAccessibilityPanelProps = {
  online: boolean;
  onSettingsChange: (settings: TeachAccessibilitySettings) => void;
  onShowPhoneticChange: (value: boolean) => void;
  onShowTranslationChange: (value: boolean) => void;
  settings: TeachAccessibilitySettings;
  showPhonetic: boolean;
  showTranslation: boolean;
};

export function TeachAccessibilityPanel({
  online,
  onSettingsChange,
  onShowPhoneticChange,
  onShowTranslationChange,
  settings,
  showPhonetic,
  showTranslation,
}: TeachAccessibilityPanelProps) {
  function patchSettings(patch: Partial<TeachAccessibilitySettings>) {
    onSettingsChange(teachAccessibilitySettingsContract({ ...settings, ...patch }));
  }

  function toggleProfile(profileId: TeachAccessibilityProfileId, enabled: boolean) {
    const profilePatch: Partial<TeachAccessibilitySettings> = {
      profiles: { ...settings.profiles, [profileId]: enabled },
    };
    if (enabled && profileId === "deafSigned") profilePatch.showTranscript = true;
    if (enabled && profileId === "autismCalm") {
      profilePatch.density = "reduced";
      profilePatch.motion = "reduced";
    }
    if (enabled && profileId === "dyslexiaReading") {
      profilePatch.readingMeasure = "narrow";
      profilePatch.readingSpacing = "relaxed";
    }
    onSettingsChange(teachAccessibilitySettingsContract({ ...settings, ...profilePatch }));
  }

  return (
    <aside className="teach-control-panel" aria-label="Learning access controls">
      <h2>Acces</h2>
      {!online && <p className="teach-offline-state" role="status">Hors ligne · checkpoint local actif</p>}

      <fieldset>
        <legend>Contenu</legend>
        <label><input type="checkbox" checked={showTranslation} onChange={(event) => onShowTranslationChange(event.target.checked)} /> Traduction</label>
        <label><input type="checkbox" checked={showPhonetic} onChange={(event) => onShowPhoneticChange(event.target.checked)} /> Phonetique</label>
        <label><input type="checkbox" checked={settings.showTranscript} onChange={(event) => patchSettings({ showTranscript: event.target.checked })} /> Transcription</label>
      </fieldset>

      <fieldset>
        <legend>{"Profils d'acces"}</legend>
        {teachAccessibilityProfileIds.map((profileId) => (
          <label key={profileId}>
            <input
              type="checkbox"
              checked={settings.profiles[profileId]}
              onChange={(event) => toggleProfile(profileId, event.target.checked)}
            />
            {teachAccessibilityProfiles[profileId].label}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Affichage et rythme</legend>
        <label><input type="checkbox" checked={settings.contrast === "high"} onChange={(event) => patchSettings({ contrast: event.target.checked ? "high" : "standard" })} /> Contraste eleve</label>
        <label><input type="checkbox" checked={settings.saturation === "reduced"} onChange={(event) => patchSettings({ saturation: event.target.checked ? "reduced" : "standard" })} /> Saturation reduite</label>
        <label><input type="checkbox" checked={settings.density === "reduced"} onChange={(event) => patchSettings({ density: event.target.checked ? "reduced" : "standard" })} /> Densite calme</label>
        <label><input type="checkbox" checked={settings.motion === "reduced"} onChange={(event) => patchSettings({ motion: event.target.checked ? "reduced" : "standard" })} /> Mouvement reduit</label>
        <label><input type="checkbox" checked={settings.sound === "on"} onChange={(event) => patchSettings({ sound: event.target.checked ? "on" : "muted" })} /> Son actif</label>
        <label><input type="checkbox" checked={settings.dataSaver} onChange={(event) => patchSettings({ dataSaver: event.target.checked })} /> Donnees reduites</label>
        <label><input type="checkbox" checked={settings.readingMeasure === "narrow"} onChange={(event) => patchSettings({ readingMeasure: event.target.checked ? "narrow" : "standard" })} /> Ligne de lecture etroite</label>
        <label><input type="checkbox" checked={settings.readingSpacing === "relaxed"} onChange={(event) => patchSettings({ readingSpacing: event.target.checked ? "relaxed" : "standard" })} /> Espacement de lecture</label>
        <label className="teach-range-control">
          <span>Vitesse audio</span>
          <input
            type="range"
            min="0.6"
            max="1.2"
            step="0.05"
            value={settings.speechRate}
            onChange={(event) => patchSettings({ speechRate: Number(event.target.value) })}
            aria-valuetext={settings.speechRate.toFixed(2)}
          />
          <output>{settings.speechRate.toFixed(2)}x</output>
        </label>
        {settings.profiles.adhdSprint && <label className="teach-number-control">
          <span>Duree du sprint</span>
          <input
            type="number"
            min="3"
            max="25"
            step="1"
            value={settings.sprintMinutes}
            onChange={(event) => patchSettings({ sprintMinutes: Number(event.target.value) })}
          />
          <span>min</span>
        </label>}
      </fieldset>

      <div className="teach-profile-proof">
        <strong>Communication</strong>
        <span>Voix facultative</span>
        <span>Texte et choix disponibles</span>
        <span>Aucune penalite de delai</span>
      </div>
    </aside>
  );
}

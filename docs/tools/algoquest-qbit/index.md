# AlgoQuest Qbit Education

<div class="se-tool-header">
  <img src="../../_static/tools/algoquest-qbit/logo.png" alt="AlgoQuest Qbit Education identity">
  <div><strong>AlgoQuest Qbit Education</strong><span>public-preview · browser-app · version 0.0.0</span></div>
</div>

A governed Hero Books learning runtime where AlgoQuest assigns missions, preserves learner-visible state, and alone decides progression from Builder and Colab evidence.

## Public status

- **Runtime:** `browser-app`
- **Availability:** `verified`
- **License:** `LicenseRef-SEL-2.0`
- **Version:** `0.0.0`

<div class="se-actions">
  <a href="https://algoquest.securedme.ca">Open tool</a>
  <a href="https://github.com/SeCuReDmE-main-dev/algoquest-ams-discovry-labs-module-">Source</a>
  <a href="https://github.com/SeCuReDmE-main-dev/algoquest-ams-discovry-labs-module-/issues">Issues</a>
</div>

## Interfaces

- React Hero Books and study/artifact surfaces
- `MissionEnvelope.v2` assignment bridge to the Chromium Builder side panel
- `AlgorithmArtifactReceipt.v2` and `ColabExecutionReceipt.v2` admission
- Teacher planning surface and Vite development server

## Mage First-Proof

The first complete mechanism is the Mage force-and-trajectory mission. AlgoQuest assigns one prompt exactly once, the Builder preserves and validates the card program, and Colab may return execution evidence through the authenticated broker. Failed attempts preserve the build and do not subtract narrative rewards.

The mechanism and local contract loop are tested. Live Auth0, HTTPS broker deployment, real Chrome extension acceptance, live Colab return, and school approval remain separate gates.

```{important}
AlgoQuest owns mission assignment and progression. Builder and Colab return bounded formative evidence; neither grades, profiles, or becomes mastery authority.
```

```{toctree}
:maxdepth: 2

quickstart
architecture
interfaces
operations
```

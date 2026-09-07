# SecuredMe Scholarium

<div class="se-tool-meta">
  <span>Education platform</span>
  <span>Developer guide</span>
</div>

The public education and research commons, and the canonical documentation home for the suite.

## Start here

1. Read the repository README before installing anything.
2. Read `CONTRIBUTING.md` before changing code or opening an issue.
3. Confirm the active branch and local changes with `git status --short --branch`.
4. Use the repository's declared environment and lockfiles.
5. Run the documented checks before proposing a change.

```powershell
git clone https://github.com/SeCuReDmE-main-dev/securedme-scholarium.git
cd securedme-scholarium
git status --short --branch
```

!!! important "Human review boundary"
    Generated output, simulations, classifications, and agent suggestions remain reviewable artifacts. They do not become scientific, legal, security, or editorial authority by themselves.

## Technology signals

`MkDocs documentation`

These signals are detected from public repository files. The README remains authoritative for exact installation and execution commands.

## WebMCP and companion

Scholarium exposes twelve descriptors under the strict `securedme.webmcp.v1`
contract: ten product tools and the two shared companion tools. The page bridge
registers them through `document.modelContext`; it does not claim browser support
when that API is absent. `HeroBookPanelState.v1` remains owned by AlgoQuest, while
Scholarium owns only its application state and returns staged proposals or bounded
receipts.

- [WebMCP contract, companion, and Evidence Gate](../webmcp/README.md)
- [Scholarium tool interfaces](scholarium/interfaces.md)
- [Scholarium operations](scholarium/operations.md)

The unpacked Manifest V3 companion uses only `activeTab`, `scripting`,
`sidePanel`, and `storage`. Product themes come from the verified internal Stitch
design documents recorded in the theme registry; an explicit accessible
SecuredMe Education fallback is used only when a dedicated product source is not
available.

## Developer workflow

```text
Understand the boundary -> reproduce the current state -> make one bounded change
-> run the relevant checks -> inspect the diff -> document limits
```

## Canonical project documents

- [Project README](https://github.com/SeCuReDmE-main-dev/securedme-scholarium/blob/HEAD/README.md)
- [Contribution guide](https://github.com/SeCuReDmE-main-dev/securedme-scholarium/blob/HEAD/CONTRIBUTING.md)
- [Security policy](https://github.com/SeCuReDmE-main-dev/securedme-scholarium/blob/HEAD/SECURITY.md)
- [Safety boundary](https://github.com/SeCuReDmE-main-dev/securedme-scholarium/blob/HEAD/SAFETY.md)
- [License](https://github.com/SeCuReDmE-main-dev/securedme-scholarium/blob/HEAD/LICENSE)
- [Agent instructions](https://github.com/SeCuReDmE-main-dev/securedme-scholarium/blob/HEAD/AGENTS.md)

## Open the project

- [Public project surface](https://www.scholarium.securedme.ca)
- [Source repository](https://github.com/SeCuReDmE-main-dev/securedme-scholarium)
- [Issues](https://github.com/SeCuReDmE-main-dev/securedme-scholarium/issues)

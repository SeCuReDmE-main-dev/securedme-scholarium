# Code collaboration boundary

Scholarium can attach a canonical source repository to a publication, but it is not a Git host, code editor, or fork service. The publication preserves the educational context, provenance, artifacts, and discussion; code collaboration is deliberately handed back to GitHub, GitLab, or SourceForge.

## Accepted links

Only public HTTPS repository homepages are accepted:

- `https://github.com/owner/repository`
- `https://gitlab.com/group/project` (including nested groups)
- `https://sourceforge.net/p/project/code`

Credential-bearing clone URLs, URL fragments, provider issue pages, webhooks, and arbitrary links are rejected. Scholarium stores the normalized provider, repository path, and canonical public URL; it does not copy repository contents or provider credentials.

## Handoff behavior

The publication card offers **Open source** and **Start project** only when an author has linked a repository. Both open the attributed provider in a separate tab. The provider decides whether the visitor can fork, create a private project, create a branch, or contribute upstream.

This is intentional: GitHub documents a fork as a new repository derived from an upstream repository and requires the person to choose the owner and fork settings; GitLab likewise creates the fork in a selected namespace and applies the person’s provider visibility rules. [GitHub Docs: Fork a repository](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo?platform=linux) · [GitLab Docs: Forks](https://docs.gitlab.com/user/project/repository/forking_workflow/)

## Safety and ranking

- Repository links are author-owned, account-bound, and allowed only when the account may publish publicly.
- A minor account needs the same active guardian-consent or verified-school relationship used for public publication.
- A source link affects neither discovery ranking nor paid reach.
- A publication quarantine prevents adding the link.
- Source links are included in the author’s private account export.

No OAuth token, repository write permission, or private source code is stored by Scholarium.

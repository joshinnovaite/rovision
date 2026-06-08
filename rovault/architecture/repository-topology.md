# Repository Topology

The repo is a **standalone Rovision project** that *vendors* SAM 2 as a pristine dependency. It was previously a fork of Meta's SAM 2; that fork was cut and the repository restructured (see [[DR-010-Standalone-Repository-Restructure]]). It now reads as two parts:

- **Vendored SAM 2** (`sam2/`) — Meta's segmentation/tracking engine, kept untouched and treated as a frozen dependency the pipeline imports. The upstream demo/training/research scaffolding was removed; only the importable package remains.
- **The rovision layer** (`rovision/`) — where all the work lives: `rovision/labelling/` (the local `label_defects.py`, its requirements, and the `labels.json` golden set), `rovision/notebooks/subsea_defect_demo.ipynb`, and `rovision/dataset/` (the gitignored amplified dataset, durable copy on Drive).

**Ownership.** The project is owned by the maintainer's *work* personal GitHub account (`joshinnovaite/rovision`), with their personal account added as a collaborator. The rationale is push convenience: the local machine is authenticated as the personal account, and collaborator access lets it push to the work-owned repo without re-authenticating. There is no `upstream` remote — only `origin` — because the project no longer tracks Meta (see [[DR-010-Standalone-Repository-Restructure]]).

**Compute split.** The heavy SAM 2 / Torch stack runs on **Colab GPU**, never locally — the development machine is a Mac with no NVIDIA GPU. Only the lightweight [[label_defects.py|labelling tool]] runs locally, because annotation needs a desktop GUI but not a GPU. This split is also why persistence is handled through Google Drive rather than the local filesystem (see [[DR-006-Drive-Persistence-And-Resumable-Batch]]). See [[pipeline-overview]] for what runs where.

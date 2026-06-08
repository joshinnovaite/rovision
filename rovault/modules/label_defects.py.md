# label_defects.py

The local labelling GUI that produces the [[GoldenSet]]. Its existence and shape encode a few deliberate choices.

- **Local, not in the notebook.** Interactive click-and-drag annotation needs a desktop GUI (matplotlib), and annotation needs no GPU, so this tool deliberately lives off Colab — it is the one part of the pipeline that runs on the dev machine (see [[repository-topology]]).
- **Output shape.** Each drawn box is recorded with its class and a centre point; the box is the real prompt and the point is supplementary (see [[GoldenSet]]).
- **Sweep support.** A frame-offset parameter drives the multi-pass labelling sweep (see [[golden-set-labelling]]), and a frame-export mode feeds AI-assisted defect identification.
- **Robustness hardening.** Per-callback error guards write to an error log, the box selector is recreated per frame, and blitting is disabled — all added after a reproducible freeze where an uncaught callback exception killed the matplotlib event loop. This is why the code looks more defensive than a throwaway script.

The taxonomy it offers is the consolidated one (see [[DR-003-Defect-Taxonomy-Consolidation]]) and must stay in sync with the notebook's copy.

# Golden-Set Labelling

The intent of this workflow is to build a small, human-verified [[golden set]] of defect labels that seeds everything downstream — not to label exhaustively.

For each video, a few evenly-spaced frames are sampled and the annotator draws a box around each defect and tags its class. The class must be supplied by a human because [[sam2-as-engine|SAM 2 cannot classify]]; the box is what SAM 2 will later be prompted with.

Two design intents are worth recording:

- **Multi-pass perturbation sweep.** Labelling runs in passes; each pass shifts the frame-sampling offset. The reason is that defects are *not* uniformly distributed in time — a class confined to one short segment can be missed by any single evenly-spaced sample, so passes accumulate until every class is hit.
- **Human-in-the-loop with AI assistance.** The annotator is not a domain expert, so the tool exports sampled frames for an assistant to identify likely defects and locations before boxes are drawn.

Output accumulates in the [[GoldenSet]]. See [[label_defects.py]] for the tool and [[label-amplification]] for what consumes the result.

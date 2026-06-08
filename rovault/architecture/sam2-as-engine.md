# SAM 2 as the Engine

The whole project is shaped by one fact about SAM 2: it is a **promptable, class-agnostic, instance** segmenter and tracker. Three consequences drive every downstream decision.

- **It does not classify.** Given a prompt (point/box/mask) it segments and tracks *that thing*, but it has no concept of "corrosion" or any category. Class always comes from the human or the trained detector, never from SAM 2.
- **It does not find things autonomously.** It needs a prompt per object per video. Hence a labelling stage and, later, a detector to generate prompts.
- **Its colours are instance identity, not class.** Distinct tracked objects get distinct `obj_id`s and colours; this reflects "which individual," not "what kind."

SAM 2's contribution is turning a prompt into a pixel-accurate, temporally-tracked [[masklet]] — valuable for *quantifying* defect extent, not for naming defects. Every other component exists to supply the "what" and "where" SAM 2 lacks. This framing is why the architecture is [[detect-then-segment]] rather than asking SAM 2 to do more than it can (see [[DR-001-Detect-Then-Segment-Architecture]]), and why the [[pipeline-overview|pipeline]] wraps it in labelling, amplification, and detection.

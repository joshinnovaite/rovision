# GoldenSet

The hand-labelled seed set (`rovision/labelling/labels.json`) — the human-verified ground truth that everything downstream is built from. One record per drawn box: a source video, a frame, a class, a bounding box, and a centre point. See [[golden-set-labelling]] for how it is produced.

The design intents worth recording (the rest is readable in the file):

- **Box is the prompt; point is supplementary.** SAM 2 is prompted with the box because a box is a more robust prompt and avoids the failure mode where a non-convex object's centre point lands off the object. The point (box centre) is retained only as metadata.
- **One box, one class; repetition is wanted.** Multiple boxes of the same class on the same frame are expected — more examples are better, and SAM 2 tracks them as separate instances.
- **Counts are seed prompts, not training volume.** The record count reflects human effort, not dataset size; [[label-amplification]] multiplies it into the [[AmplifiedDataset]].

The class set follows the consolidated taxonomy (see [[DR-003-Defect-Taxonomy-Consolidation]]), spanning defects and [[artefact|artefacts]].

# DR-006: Drive Persistence and Resumable Batch

## Context
The pipeline runs on Colab, where the `/content` filesystem is ephemeral and runtimes expire (idle or time-capped) — often mid-run on the long [[label-amplification]] step. See [[repository-topology]] for why everything heavy is on Colab.

## Decision
Read inputs and write outputs (both the frame images and the label JSON) to Google Drive, and have the batch amplification checkpoint after each video, skipping already-completed videos on re-run.

## Rationale
Persistence must survive runtime death. Saving only the label JSON would orphan the frames, which live on the ephemeral disk — so images must go to Drive too. Per-video checkpointing makes a long run resumable across disconnects rather than restartable from scratch. It also removes the per-video manual upload step.

## Consequences
Drive I/O is slower than local disk, so amplification pays an overhead for durability. The workflow requires a fixed Drive folder layout. Trained weights are likewise copied to Drive, since the rest of the training run output stays ephemeral.

## Related
- [[repository-topology]]
- [[label-amplification]]
- [[subsea_defect_demo.ipynb]]

# Detector-Training Diagnostic Playbook (+ Domain/Footage Viability Checklist)

Bringing up new detectors burned days on a baffling failure: **training loss falls normally but
validation mAP is *exactly* 0 every epoch, and the saved `best.pt` is dead** (zero detections even on its
own training frames). It struck pylons and insulators v1/v2 alike. We mis-diagnosed it for a long time as
an object-shape problem; the true cause was a **leaked global autocast** corrupting YOLO's EMA validation
weights ([[DR-015-Leaked-Global-Autocast-Corrupted-Detector-Training]]). This note is the distilled,
reusable playbook — lead with the leaked-global-state hypothesis.

## The core lesson (read this first)

When you combine libraries that each manipulate **global runtime state** — autocast, `inference_mode`,
grad mode, default dtype, `eval()`/`train()` — one library's setup can leak that state into another
library's training and silently corrupt it. The most insidious target is the **EMA** (exponential moving
average) copy of the weights that Ultralytics validates each epoch and exports as `best.pt`: the **raw**
weights learn fine while the **EMA** is garbage. Here, SAM 2's setup entered a global
`torch.autocast('cuda', bf16)` and never exited it; §16's YOLO training inherited it. The fix was to wrap
training in `with torch.autocast('cuda', enabled=False):`.

**Failure signature:** training loss falls (box/cls/dfl all decreasing) **but** the validation metric is
**exactly 0** *and* the exported model produces zero detections. That conjunction = a **train-vs-eval
divergence** — suspect the EMA-vs-raw split or the validation pipeline, not the data.

## Diagnostic playbook — "loss falls but val mAP is 0 / the model is dead"

Check **in this order** (cheapest/most-decisive first):

1. **Visualise the loaded labels.** `train_batch0.jpg` + denormalise the YOLO `.txt` labels back onto the
   images. Rules out data/conversion bugs. *(Here: labels were correct.)*
2. **Re-run a known-good recipe verbatim.** Reproduce the collapse with the proven subsea recipe. If it
   still fails, the **recipe is ruled out** — the fault is in data or environment.
3. **Probe a known-good baseline.** Run the **base, untrained `yolo11n.pt`** on a training frame. If it
   detects the objects (e.g. workers as COCO `person`), the footage/objects are detectable and your
   fine-tuning is **destroying a working capability** → the fault is training/environment, not data.
4. **Find the case your current hypothesis can't explain.** An **easy** class (here `worker`, a
   COCO-pretrained person) failing to **exactly** 0 disconfirms any "thin/repeated/small object"
   hypothesis — an easy class can't fail for object-shape reasons. Exactly-0-across-the-board is
   *structural*, not weak.
5. **Audit for leaked global state.** Read the notebook/setup for context managers entered and never
   exited (`autocast`, `inference_mode`, `torch.set_grad_enabled`, `set_default_dtype`, a stray `.eval()`).
   Cross-check dependency changelogs — a version bump that "consolidates validation autocast" / "protects
   EMA during mixed-precision" can stop *compensating* for a latent leak (the latent-bug-meets-dep-change
   shape).

## Heuristics worth keeping
- **"Exactly 0" ≠ small/weak — it's structural.** A hard object gives low mAP; a pipeline/state fault gives
  zero across all classes.
- **Loss-down-but-val-flat = train-vs-eval divergence.** Suspect EMA-vs-raw weights or the val pipeline.
- **Know which weights you ship** (EMA vs raw) and which one validation/export uses.
- **Keep a known-good baseline probe** (base weights on a real frame) to localise faults fast.
- **Visualise artifacts early** instead of theorising.
- **Pin ML dependencies** — unpinned `pip install` drift is how a latent bug suddenly turns fatal.
- **Confirmation-bias guard:** when a plausible hypothesis survives several iterations, deliberately hunt
  the case it cannot explain. That is the move that breaks the loop.

## Domain/footage viability screen (secondary — still worth a quick pass)
These are *real but secondary* concerns; they did **not** cause the zero-mAP collapse (that was the
autocast leak). Treat as quality hygiene, not a gate that explains training death:
- **SAM 2-segmentability affects amplified-label quality.** Amplification ([[label-amplification]],
  [[DR-002-SAM2-Propagation-For-Label-Amplification]]) derives YOLO labels from SAM 2 masks; if SAM 2
  fragments/oscillates on a target (e.g. repetitive ceramic disc-chains), the labels degrade. Spot-check an
  amplified-box overlay across consecutive frames. See [[sam2-as-engine]].
- **Object shape:** thin / elongated / diagonal / parallel-repeated structures (`conductor`, cables) are
  awkward as axis-aligned boxes. `conductor` was dropped partly on this reasoning — now **revisitable**,
  since the real blocker was the autocast bug, not object shape.
- **Footage curation:** prefer short (<20s) single-continuous-pan clips for stable propagation.
- **Taxonomy hygiene:** exclude swarm classes (dozens of tiny repeats/frame) and sparse classes; prefer
  **COCO-pretrained** classes where they fit (`worker` ← `person`).

## Related
- [[DR-015-Leaked-Global-Autocast-Corrupted-Detector-Training]] — the root cause + generalisable lesson this distills.
- [[DR-014-Domain-Viability-Gated-By-Object-Scale]] — the *superseded* object-shape hypothesis, kept as a cautionary record.
- [[DR-002-SAM2-Propagation-For-Label-Amplification]] — why corrupt SAM 2 masks degrade labels (secondary, not the collapse).
- [[label-amplification]] · [[golden-set-labelling]] — the stages screened.
- [[subsea_defect_demo.ipynb]] — cell 4 leaks the autocast; §16 is the fix site.
- [[sam2-as-engine]] — SAM 2's instability on repeated/thin structures and the 1024px resize.

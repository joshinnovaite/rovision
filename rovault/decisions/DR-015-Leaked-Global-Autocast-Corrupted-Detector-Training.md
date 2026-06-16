# DR-015: A Leaked Global Autocast (SAM 2 setup) Silently Corrupted YOLO Training via the EMA

## Context
For three successive detector attempts — aerial pylons, insulators v1, insulators v2 — YOLO11n training
in the Colab notebook ([[subsea_defect_demo.ipynb]]) showed the same baffling signature: **training loss
fell normally (box/cls/dfl all decreasing) but validation mAP was *exactly* 0 every epoch, and the saved
`best.pt` produced zero detections** — even on its own training frames at conf 0.01, and even for the
trivially-easy `worker` class (a COCO-pretrained `person`).

[[DR-014-Domain-Viability-Gated-By-Object-Scale]] had attributed this collapse to **object scale / shape /
SAM 2-segmentability** (thin disc-chains and conductors being box-hostile and SAM-2-fragmentation-prone).
That hypothesis was **wrong as a root cause** — a red herring that survived several iterations through
confirmation bias. This session found the true cause and shipped the insulators demo.

## Decision
**Root cause: a leaked global autocast.** Cell 4 (§2 Imports) enters a *global*
`torch.autocast('cuda', dtype=torch.bfloat16)` via `.__enter__()` to speed up SAM 2, and **never exits
it** — so it stays active for the entire session. When §16 trains YOLO, training runs *inside* that leaked
bf16 autocast. This corrupts the **EMA** (exponential-moving-average) copy of the weights, which
Ultralytics validates each epoch and saves as `best.pt`. So the **raw** weights learned fine (loss fell)
while the **EMA** used for validation + export was garbage → **val mAP exactly 0 and a dead `best.pt`**.

**The fix:** wrap the §16 training call in `with torch.autocast('cuda', enabled=False):`, shielding it
from the leaked autocast (YOLO manages its own AMP internally). Result: `cls_loss` ~0.5, **mAP50 0.994**,
and the insulators demo now ships ([[BOW-09-Insulators-Domain-Pipeline]]).

**This DR supersedes the root-cause claim of [[DR-014-Domain-Viability-Gated-By-Object-Scale]].** DR-014 is
retained as a cautionary record of the wrong hypothesis.

## Rationale
- **Why latent then suddenly fatal.** The leak was always present; subsea trained fine under it because an
  older Ultralytics computed EMA/validation in a way immune to a stray *outer* autocast. Ultralytics
  **8.4.63–8.4.66** refactored exactly that path (release notes: *"Consolidates validation autocast…"* and
  *"EMA validation protection: validation changes prevented EMA corruption during mixed-precision
  training"*), removing the tolerance that had masked our leak. An **unpinned** `pip install ultralytics`
  drifted us onto 8.4.66. Classic shape: **a latent bug in our code + a dependency change that stops
  compensating for it = sudden, dramatic, "no code change on our side" breakage.**
- **The disconfirming move that cracked it.** The object-shape hypothesis could not explain `worker`
  (a compact, COCO-pretrained person) *also* failing to **exactly** 0. Deliberately seeking the case the
  hypothesis couldn't cover is what broke the confirmation-bias loop.
- **"Exactly 0" is structural, not weak.** A small/thin/repeated object produces a *low* mAP, not a *zero*
  one across all classes including an easy one. Exactly-zero across the board points at a pipeline/state
  fault, not the data.

## Consequences
- **Generalisable lesson (lead with this):** *A global context manager leaked from one library's setup
  (autocast, `inference_mode`, grad mode, default dtype, eval/train) can silently corrupt another
  library's training — most visibly the **EMA** model used for validation/export. Signature: training loss
  falls but the val metric is **exactly 0** and the saved model is dead. When combining libraries (here
  SAM 2 + YOLO), audit for leaked global state before blaming the data.*
- **Supporting heuristics** (now in [[domain-viability-and-detector-diagnostics]]): exactly-0 ≠ small/weak
  (it's structural); loss-down-but-val-flat = a train-vs-eval divergence (suspect EMA-vs-raw or the val
  pipeline); know which weights you ship (EMA vs raw); keep a known-good baseline probe (base `yolo11n.pt`
  detecting COCO `person`); visualise artifacts early instead of theorising; **pin ML dependencies.**
- **Meta-lesson:** a plausible-but-wrong hypothesis (object shape) survived several iterations via
  confirmation bias; the corrective is to deliberately hunt the case it cannot explain.
- **DR-014 corrected, not deleted.** Its object-shape/segmentability claim is **retracted as a root
  cause**. The *secondary* nuances survive (SAM 2 mask quality does affect amplified-label quality;
  `conductor` is genuinely awkward as thin boxes) — but neither caused the zero-mAP collapse. `conductor`
  was dropped partly on the now-corrected reasoning, so it is **revisitable**.
- The diagnostic playbook in [[domain-viability-and-detector-diagnostics]] is rewritten around
  leaked-global-state as its core, demoting the object-shape framing.

## Related
- [[DR-014-Domain-Viability-Gated-By-Object-Scale]] — the superseded root-cause claim, kept as a cautionary record.
- [[domain-viability-and-detector-diagnostics]] — the reusable playbook, rebuilt around this chain.
- [[subsea_defect_demo.ipynb]] — cell 4 leaks the autocast; §16 is the fix site.
- [[DR-004-YOLO11n-Detector-Choice]] — the detector this affects; YOLO manages its own AMP.
- [[BOW-09-Insulators-Domain-Pipeline]] — the demo that now ships (mAP50 0.994).
- [[DR-002-SAM2-Propagation-For-Label-Amplification]] — amplification is sound; it was not the cause.

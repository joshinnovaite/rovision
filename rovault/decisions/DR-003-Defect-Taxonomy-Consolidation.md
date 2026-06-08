# DR-003: Defect Taxonomy Consolidation

## Context
The initial taxonomy had ~22 classes, including several visually near-identical material defects and several classes with no labelled examples at all. The labels are reviewed in the [[GoldenSet]].

## Decision
Consolidate to 15 classes: merge `biofilm`, `calcareous_deposits`, and `sediment_debris` into a single [[surface deposit]] class, and drop the empty classes (`concrete_crack`, `concrete_spalling`, `pitting`, `exposed_rebar`, `structural_deformation`).

## Rationale
In murky 720p footage the three deposit classes are inseparable even to an expert, so distinct labels were contradictory supervision. `calcareous_deposits` was additionally sourced 100% from one video, so it would teach "that video's appearance," not a transferable concept. The dropped classes had zero examples and cannot be trained or detected.

## Consequences
A cleaner, more separable label set, at the cost of granularity. [[surface deposit]] now dominates the distribution (class imbalance). Concrete-surface defects are out of scope until clearer footage is sourced. The taxonomy is defined in code in two places (the labelling tool and the notebook conversion) that must stay in sync.

## Related
- [[GoldenSet]]
- [[surface deposit]]
- [[artefact]]

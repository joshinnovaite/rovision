# Label Amplification

This workflow turns a few hundred seed boxes from the [[GoldenSet]] into thousands of labelled frames — the volume a detector needs but hand-labelling cannot cheaply produce.

For each seed box, SAM 2's video predictor is prompted with the box and propagates it forward across a short window of frames; a tight box is derived from each propagated [[masklet]] and recorded with the seed's class. The result is the [[AmplifiedDataset]].

Key intents behind the shape of the process:

- **Windowed, not whole-video.** Propagation is bounded to a short forward window per seed. This caps compute and limits drift — the further a propagated mask travels from its verified seed, the looser it gets, especially for diffuse classes like [[surface deposit]].
- **Batch, via Drive, resumable.** All videos are processed in one loop reading from and writing to Google Drive, checkpointing after each video, because Colab runtimes expire mid-run (see [[DR-006-Drive-Persistence-And-Resumable-Batch]]).

See [[DR-002-SAM2-Propagation-For-Label-Amplification]] for why propagation was chosen over the alternatives, and [[subsea_defect_demo.ipynb]] for the implementation sections.

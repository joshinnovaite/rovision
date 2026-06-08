# detect-then-segment

The chosen runtime architecture: a fast detector proposes boxes + class on each frame, then SAM 2 refines each box into a precise mask for quantification. Contrast with segment-then-classify, which was rejected. See [[DR-001-Detect-Then-Segment-Architecture]].

import { useEffect } from 'react'
import { usePlaybackStore } from '../state/playbackStore'

// Drive currentFrame from the <video> clock. A single rAF loop runs while
// mounted and reads videoEl/encFps from the store each tick (via getState), so
// it's immune to the order in which VideoStage registers the element vs. when
// PlaybackScreen resets — it simply picks up whatever element is current.
// setFrame only mutates the store when the integer frame changes, so React
// re-renders the overlay/timeline at most once per video frame, not per tick.
export function useFrameSync(encFps: number) {
  useEffect(() => {
    let raf = 0
    const loop = () => {
      const { videoEl, setFrame, encFps: storeFps } = usePlaybackStore.getState()
      if (videoEl) setFrame(Math.round(videoEl.currentTime * (storeFps || encFps || 30)))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [encFps])
}

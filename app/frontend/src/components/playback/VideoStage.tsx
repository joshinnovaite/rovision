import { useEffect, useRef } from 'react'
import { api } from '../../lib/api'
import { useVideoStore } from '../../state/videoStore'
import { usePlaybackStore } from '../../state/playbackStore'
import { OverlayLayer } from './OverlayLayer'

// Raw <video> (native controls for play/seek) with the SVG overlay on top. The
// stage keeps the source aspect ratio so the overlay's viewBox aligns 1:1 with
// the displayed frame (no letterbox maths). Range-seeking is served by the backend.
export function VideoStage() {
  const meta = useVideoStore((s) => s.meta)
  const hash = useVideoStore((s) => s.hash)
  const setVideoEl = usePlaybackStore((s) => s.setVideoEl)
  const setPlaying = usePlaybackStore((s) => s.setPlaying)
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    setVideoEl(ref.current)
    return () => setVideoEl(null)
  }, [setVideoEl, hash])

  if (!meta || !hash) return null

  return (
    <div className="stage-wrap">
      <div className="stage" style={{ aspectRatio: `${meta.width} / ${meta.height}` }}>
        <video
          ref={ref}
          src={api.clipUrl(hash)}
          controls
          playsInline
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        <OverlayLayer />
      </div>
    </div>
  )
}

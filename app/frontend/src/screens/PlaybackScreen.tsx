import { useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useVideoStore } from '../state/videoStore'
import { usePlaybackStore } from '../state/playbackStore'
import { useFrameSync } from '../hooks/useFrameSync'
import { VideoHeader } from '../components/playback/VideoHeader'
import { VideoStage } from '../components/playback/VideoStage'
import { PlaybackToolbar } from '../components/playback/PlaybackToolbar'
import { PlaybackBarCard } from '../components/playback/PlaybackBarCard'

export function PlaybackScreen() {
  const { hash = '' } = useParams()
  const [params] = useSearchParams()
  const load = useVideoStore((s) => s.load)
  const status = useVideoStore((s) => s.status)
  const meta = useVideoStore((s) => s.meta)
  const tracks = useVideoStore((s) => s.tracks)
  const snapToTrack = usePlaybackStore((s) => s.snapToTrack)
  const reset = usePlaybackStore((s) => s.reset)

  useEffect(() => {
    if (hash) {
      reset()
      load(hash)
    }
  }, [hash, load, reset])

  useFrameSync(meta?.enc_fps ?? 30)

  // honour ?select=<trackId> (jump from a work order)
  const selectParam = params.get('select')
  useEffect(() => {
    if (status !== 'ready' || !meta || !selectParam) return
    const t = tracks.find((x) => x.track_id === Number(selectParam))
    if (t) snapToTrack(t, meta.enc_fps)
  }, [status, meta, tracks, selectParam, snapToTrack])

  if (status === 'loading' || !meta) return <div className="screen">Loading…</div>

  return (
    <div className="playback-v">
      <VideoHeader />
      <VideoStage />
      <PlaybackToolbar />
      <PlaybackBarCard />
    </div>
  )
}

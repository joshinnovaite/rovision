#!/usr/bin/env python3
"""Local labelling tool for the rovision defect "golden set".

Runs on your machine (needs a GUI), NOT in Colab. For each video it samples a
few evenly-spaced frames, lets you draw bounding boxes and tag each with a
defect/artefact class, and appends the result to a single JSON of the form:

    {"video": ..., "frame": <int>, "defect": <class>, "point": [x, y],
     "bbox": [x0, y0, x1, y1]}   # bbox is xyxy; point defaults to box centre

Multi-pass workflow (matches the "perturb until all classes hit" idea):
  * Pass 1:  python rovision/labelling/label_defects.py --offset 0.0
  * Check the printed coverage report for UNHIT classes.
  * Pass 2:  python rovision/labelling/label_defects.py --offset 0.15   (shifts all frames)
  * ... repeat, bumping --offset, until every class is hit.
  * Targeted grab:  python rovision/labelling/label_defects.py --video fire_tank --frames 250,800

Frames are also dumped as PNGs to the review dir so they can be inspected
(e.g. shown to Claude) to help identify what each defect actually is.

Deps:  pip install opencv-python matplotlib
GUI note (macOS): if no window appears, run with  MPLBACKEND=TkAgg  prefixed,
or  pip install pyqt5  and use  MPLBACKEND=QtAgg.
"""
import argparse
import functools
import json
import traceback
from pathlib import Path

import cv2
import matplotlib.pyplot as plt
from matplotlib.widgets import RectangleSelector, RadioButtons


ERROR_LOG = Path(__file__).with_name("labeller_error.log")


def guard(fn):
    """Wrap a GUI callback so an exception is logged (to console AND to
    rovision/labelling/labeller_error.log) instead of freezing the matplotlib event loop."""
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except Exception:
            tb = traceback.format_exc()
            msg = f"\n[labeller] error in {fn.__name__} (UI kept alive):\n{tb}"
            print(msg, flush=True)
            try:
                with open(ERROR_LOG, "a") as f:
                    f.write(msg)
            except Exception:
                pass
    return wrapper

# ---------------------------------------------------------------- taxonomy ---
# The class list is no longer hardcoded here: it comes from the canonical domain
# registry at rovision/domains.json (the single source of truth shared by the
# backend, frontend, and notebook). Pick a domain with --domain; its `all_classes`
# drive the radio buttons and the coverage report. (`defect_classes` is only used
# to tag classes in the coverage print — inventory domains like 'pylon' have none.)
DOMAINS_PATH = Path(__file__).resolve().parents[1] / "domains.json"
DOMAINS = json.loads(DOMAINS_PATH.read_text())


def domain_taxonomy(domain):
    """(all_classes, defect_classes) for a registry domain key."""
    if domain not in DOMAINS:
        raise SystemExit(f"Unknown --domain '{domain}'. Known: {', '.join(DOMAINS)}")
    d = DOMAINS[domain]
    return d["all_classes"], d.get("defect_classes", [])


def domain_defaults(domain, videos_dir, out):
    """Per-domain default footage dir + output path (overridable via CLI)."""
    videos_dir = videos_dir or ("test_footage" if domain == "subsea"
                                else f"test_footage_{domain}")
    out = out or (f"rovision/labelling/labels.json" if domain == "subsea"
                  else f"rovision/labelling/labels_{domain}.json")
    return videos_dir, out


VIDEO_EXTS = {".mp4", ".mov", ".avi", ".mkv", ".m4v"}


# ------------------------------------------------------------- video utils ---
def list_videos(videos_dir, only=None):
    vids = sorted(p for p in Path(videos_dir).iterdir()
                  if p.suffix.lower() in VIDEO_EXTS)
    if only:
        vids = [p for p in vids if only.lower() in p.name.lower()]
    return vids


def sample_indices(total, n, offset_frac):
    """n evenly-spaced frame indices, all shifted by offset_frac (wraps)."""
    idxs = []
    for i in range(n):
        frac = ((i + 0.5) / n + offset_frac) % 1.0
        idxs.append(min(total - 1, max(0, int(frac * total))))
    return sorted(set(idxs))


def read_frame(cap, idx):
    cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
    ok, frame = cap.read()
    return cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) if ok else None


def build_tasks(videos, n, offset, explicit_frames, review_dir):
    """Return [(video_path, frame_idx, rgb_frame)], also exporting PNGs."""
    tasks = []
    for vp in videos:
        cap = cv2.VideoCapture(str(vp))
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
        idxs = explicit_frames if explicit_frames else sample_indices(total, n, offset)
        outdir = Path(review_dir) / vp.stem
        outdir.mkdir(parents=True, exist_ok=True)
        for idx in idxs:
            if idx >= total:
                continue
            fr = read_frame(cap, idx)
            if fr is None:
                continue
            cv2.imwrite(str(outdir / f"frame_{idx:06d}.png"),
                        cv2.cvtColor(fr, cv2.COLOR_RGB2BGR))
            tasks.append((vp, idx, fr))
        cap.release()
        print(f"{vp.name}: {len(idxs)} frames -> {outdir}")
    return tasks


# ------------------------------------------------------------ labels store ---
def load_labels(path):
    p = Path(path)
    return json.loads(p.read_text()) if p.exists() else []


def save_labels(path, records):
    Path(path).write_text(json.dumps(records, indent=2))


def print_coverage(records, classes, defect_classes):
    hit = {r["defect"] for r in records}
    print("\n=== coverage so far ===")
    for c in classes:
        mark = "x" if c in hit else " "
        cnt = sum(1 for r in records if r["defect"] == c)
        tag = "defect" if c in defect_classes else "context"
        print(f"    [{mark}] {c} ({cnt})  [{tag}]")
    unhit = [c for c in classes if c not in hit]
    print(f"\n  UNHIT: {unhit or 'none - all hit!'}\n")


# -------------------------------------------------------------- labeller -----
class Labeller:
    def __init__(self, tasks, records, out_path, classes):
        self.tasks, self.records, self.out_path = tasks, records, out_path
        self.classes = classes
        self.i = 0
        self.current_class = classes[0]
        self._pan = None          # right-drag pan snapshot
        self._w = self._h = 1     # current frame dims (set in _show)
        self._build_fig()
        self._show()

    def _build_fig(self):
        self.fig = plt.figure(figsize=(15, 9))
        self.ax = self.fig.add_axes([0.02, 0.05, 0.70, 0.90])
        self.ax.axis("off")
        rax = self.fig.add_axes([0.75, 0.05, 0.23, 0.90])
        rax.set_title("class (click)", fontsize=9)
        self.radio = RadioButtons(rax, self.classes, active=0)
        for lbl in self.radio.labels:
            lbl.set_fontsize(8)
        self.radio.on_clicked(self._on_class)
        self.rs = None    # RectangleSelector is (re)created per frame in _show
        self.fig.canvas.mpl_connect("key_press_event", self._on_key)
        # zoom / pan (do not conflict with left-drag box drawing)
        self.fig.canvas.mpl_connect("scroll_event", self._on_scroll)
        self.fig.canvas.mpl_connect("button_press_event", self._on_press)
        self.fig.canvas.mpl_connect("motion_notify_event", self._on_motion)
        self.fig.canvas.mpl_connect("button_release_event", self._on_release)

    @guard
    def _on_class(self, label):
        self.current_class = label

    # ---- zoom / pan -------------------------------------------------------
    @guard
    def _on_scroll(self, e):
        """Wheel up = zoom in, down = zoom out, centred on the cursor."""
        if e.inaxes != self.ax or e.xdata is None:
            return
        scale = 1 / 1.2 if e.button == "up" else 1.2
        x0, x1 = self.ax.get_xlim()
        y0, y1 = self.ax.get_ylim()
        relx = (e.xdata - x0) / (x1 - x0)
        rely = (e.ydata - y0) / (y1 - y0)
        nw, nh = (x1 - x0) * scale, (y1 - y0) * scale
        self.ax.set_xlim(e.xdata - nw * relx, e.xdata + nw * (1 - relx))
        self.ax.set_ylim(e.ydata - nh * rely, e.ydata + nh * (1 - rely))
        self.fig.canvas.draw_idle()

    @guard
    def _on_press(self, e):
        if e.button == 3 and e.inaxes == self.ax:        # right button = pan
            self._pan = (e.x, e.y, self.ax.get_xlim(), self.ax.get_ylim(),
                         self.ax.get_window_extent())

    @guard
    def _on_motion(self, e):
        if not self._pan or e.x is None:
            return
        px, py, xl, yl, bbox = self._pan
        dx = (e.x - px) / bbox.width * (xl[1] - xl[0])
        dy = (e.y - py) / bbox.height * (yl[1] - yl[0])
        self.ax.set_xlim(xl[0] - dx, xl[1] - dx)
        self.ax.set_ylim(yl[0] - dy, yl[1] - dy)
        self.fig.canvas.draw_idle()

    @guard
    def _on_release(self, e):
        if e.button == 3:
            self._pan = None

    def _reset_view(self):
        self.ax.set_xlim(0, self._w)
        self.ax.set_ylim(self._h, 0)
        self.fig.canvas.draw_idle()

    @guard
    def _on_box(self, eclick, erelease):
        if None in (eclick.xdata, erelease.xdata):
            return
        x0, x1 = sorted([eclick.xdata, erelease.xdata])
        y0, y1 = sorted([eclick.ydata, erelease.ydata])
        vp, idx, _ = self.tasks[self.i]
        rec = {
            "video": vp.name, "frame": int(idx), "defect": self.current_class,
            "point": [int((x0 + x1) / 2), int((y0 + y1) / 2)],
            "bbox": [int(x0), int(y0), int(x1), int(y1)],
        }
        self.records.append(rec)
        save_labels(self.out_path, self.records)   # autosave every box
        self._draw_box(rec)

    def _draw_box(self, rec):
        x0, y0, x1, y1 = rec["bbox"]
        self.ax.add_patch(plt.Rectangle((x0, y0), x1 - x0, y1 - y0,
                                         ec="yellow", fc="none", lw=1.5))
        self.ax.text(x0, max(0, y0 - 4), rec["defect"], color="yellow",
                     fontsize=8, weight="bold")
        self.fig.canvas.draw_idle()

    @guard
    def _on_key(self, e):
        if e.key in ("n", " "):
            self._step(+1)
        elif e.key == "b":
            self._step(-1)
        elif e.key == "u":
            self._undo()
        elif e.key == "r":
            self._reset_view()
        elif e.key == "q":
            plt.close(self.fig)

    def _undo(self):
        vp, idx, _ = self.tasks[self.i]
        for k in range(len(self.records) - 1, -1, -1):
            r = self.records[k]
            if r["video"] == vp.name and r["frame"] == idx:
                self.records.pop(k)
                save_labels(self.out_path, self.records)
                self._show()
                break

    def _step(self, d):
        self.i = (self.i + d) % len(self.tasks)
        self._show()

    @guard
    def _show(self):
        vp, idx, fr = self.tasks[self.i]
        self._h, self._w = fr.shape[:2]
        # ax.clear() invalidates the old selector's artists, so drop it first.
        if self.rs is not None:
            try:
                self.rs.disconnect_events()
            except Exception:
                pass
            self.rs = None
        self.ax.clear()
        self.ax.axis("off")
        self.ax.imshow(fr)        # resets view to full frame on each frame change
        # Recreate the box selector for this frame. useblit=False avoids the
        # stale-background crash that blitting hits after zoom/pan + clear.
        self.rs = RectangleSelector(
            self.ax, self._on_box, useblit=False, button=[1],
            minspanx=5, minspany=5, spancoords="pixels", interactive=True)
        n_here = sum(1 for r in self.records
                     if r["video"] == vp.name and r["frame"] == idx)
        self.ax.set_title(
            f"[{self.i + 1}/{len(self.tasks)}] {vp.name}  frame {idx}  "
            f"({n_here} boxes)   scroll=zoom  R-drag=pan  r=reset  "
            f"n/b=nav  u=undo  q=quit",
            fontsize=9)
        for r in self.records:
            if r["video"] == vp.name and r["frame"] == idx:
                self._draw_box(r)
        # synchronous draw so any render error is raised inside this guarded
        # method (and thus logged) rather than swallowed by the event loop
        self.fig.canvas.draw()


# ------------------------------------------------------------------ main -----
def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--domain", default="subsea",
                    help="registry domain key (taxonomy + default footage/out path)")
    ap.add_argument("--videos-dir", default=None,
                    help="override; defaults per domain (subsea->test_footage, else test_footage_<domain>)")
    ap.add_argument("--out", default=None,
                    help="override; defaults per domain (subsea->labels.json, else labels_<domain>.json)")
    ap.add_argument("--review-dir", default="label_review")
    ap.add_argument("--n-frames", type=int, default=3)
    ap.add_argument("--offset", type=float, default=0.0,
                    help="fraction [0,1) to shift all sampled frames (bump per pass)")
    ap.add_argument("--video", default=None,
                    help="substring filter to label a single video")
    ap.add_argument("--frames", default=None,
                    help="explicit comma-separated frame indices (overrides sampling)")
    ap.add_argument("--extract-only", action="store_true",
                    help="just export sampled frames as PNGs; no GUI")
    args = ap.parse_args()

    classes, defect_classes = domain_taxonomy(args.domain)
    videos_dir, out_path = domain_defaults(args.domain, args.videos_dir, args.out)
    print(f"[labeller] domain={args.domain}  classes={classes}\n"
          f"           videos-dir={videos_dir}  out={out_path}")

    videos = list_videos(videos_dir, args.video)
    if not videos:
        raise SystemExit(f"No videos found in {videos_dir}")
    explicit = [int(x) for x in args.frames.split(",")] if args.frames else None

    records = load_labels(out_path)
    print_coverage(records, classes, defect_classes)

    tasks = build_tasks(videos, args.n_frames, args.offset, explicit, args.review_dir)
    if args.extract_only:
        print(f"\nExtracted {len(tasks)} frames to '{args.review_dir}/'. "
              f"Review them, then run again without --extract-only to label.")
        return
    if not tasks:
        raise SystemExit("No frames to label.")

    if ERROR_LOG.exists():
        ERROR_LOG.unlink()          # start each session with a clean error log
    print(f"\nLabelling {len(tasks)} frames. Pick a class on the right, drag a "
          f"box, repeat. Boxes autosave to {out_path}.")
    print(f"Any errors are written to {ERROR_LOG}")
    try:
        Labeller(tasks, records, out_path, classes)
        plt.show()
    except Exception:
        tb = traceback.format_exc()
        print(tb, flush=True)
        with open(ERROR_LOG, "a") as f:
            f.write("\n[labeller] top-level error:\n" + tb)

    records = load_labels(out_path)
    print_coverage(records, classes, defect_classes)
    print(f"Saved {len(records)} total records to {out_path}")


if __name__ == "__main__":
    main()

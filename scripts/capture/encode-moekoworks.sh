#!/usr/bin/env bash
# Encodes the Moeko Works screencast (from moekoworks.mts) into the preview video, a hover loop and WebP stills.
# Times are seconds in raw-30fps.mp4 (check marks.json + a timeline sheet after a new capture).
# FFMPEG / no ImageMagick: set FFMPEG=/path/to/ffmpeg (e.g. from the ffmpeg-static npm package); stills use sharp.
set -euo pipefail
FFMPEG="${FFMPEG:-ffmpeg}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$(dirname "$0")/out/moekoworks"

# 1. variable-rate screencast frames → constant 30 fps
"$FFMPEG" -hide_banner -loglevel error -y -f concat -safe 0 -i frames.ffconcat -vf "fps=30,format=yuv420p" -c:v libx264 -preset veryfast -crf 16 raw-30fps.mp4

# 2. edit: splash → home → latest → works | history hover preview → project page → features | about | contact | end card
"$FFMPEG" -hide_banner -loglevel error -y -i raw-30fps.mp4 -loop 1 -framerate 30 -t 2.2 -i endcard.png -filter_complex "
  [0:v]trim=start=0.8:end=10.0,setpts=PTS-STARTPTS,fps=30[a];
  [0:v]trim=start=12.6:end=21.0,setpts=PTS-STARTPTS,fps=30[b];
  [0:v]trim=start=22.4:end=24.2,setpts=PTS-STARTPTS,fps=30[c];
  [0:v]trim=start=25.2:end=27.0,setpts=PTS-STARTPTS,fps=30[d];
  [0:v]trim=start=27.5:end=29.3,setpts=PTS-STARTPTS,fps=30[e];
  [1:v]scale=1280:720,format=yuv420p,setsar=1,fps=30[f];
  [a][b]xfade=transition=fade:duration=0.4:offset=8.8[ab];
  [ab][c]xfade=transition=fade:duration=0.4:offset=16.8[abc];
  [abc][d]xfade=transition=fade:duration=0.4:offset=18.2[abcd];
  [abcd][e]xfade=transition=fade:duration=0.4:offset=19.6[abcde];
  [abcde][f]xfade=transition=fade:duration=0.5:offset=20.9,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -preset slow -crf 21 -profile:v high -pix_fmt yuv420p -movflags +faststart -an moekoworks-preview.mp4

# 3. hover loop (~480p, 8 s): home arrival → scroll to the Latest card
"$FFMPEG" -hide_banner -loglevel error -y -ss 2.4 -t 8 -i raw-30fps.mp4 -vf "scale=854:-2,format=yuv420p" -c:v libx264 -preset slow -crf 25 -movflags +faststart -an moekoworks-hover.mp4

# 4. stills → WebP (Cloudinary serves f_auto anyway; smaller uploads)
node -e '
const sharp = require("module").createRequire(process.argv[1] + "/package.json")("sharp");
const files = require("fs").readdirSync(".").filter((f) => /^(d|m)\d.*\.png$/.test(f) || /^admin\/.*\.png$/.test(f));
Promise.all(files.map((f) => sharp(f).webp({ quality: 90, effort: 6 }).toFile(f.replace(/\.png$/, ".webp")))).then(() => console.log(files.length, "stills → webp"));
' "$ROOT"

ls -la moekoworks-preview.mp4 moekoworks-hover.mp4 ./*.webp

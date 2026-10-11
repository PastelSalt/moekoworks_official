#!/usr/bin/env bash
# Encodes the Hanon screencast (from hanon.mts) into the preview video, a hover loop and WebP stills.
# Times are seconds in raw-30fps.mp4 (check marks.json + a timeline sheet after a new capture).
# FFMPEG / no ImageMagick: set FFMPEG=/path/to/ffmpeg (e.g. from the ffmpeg-static npm package); stills use sharp.
set -euo pipefail
FFMPEG="${FFMPEG:-ffmpeg}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$(dirname "$0")/out/hanon"

# 1. variable-rate screencast frames → constant 30 fps
"$FFMPEG" -hide_banner -loglevel error -y -f concat -safe 0 -i frames.ffconcat -vf "fps=30,format=yuv420p" -c:v libx264 -preset veryfast -crf 16 raw-30fps.mp4

# 2. edit: loader → home → about → news → discography → gallery + lightbox | home switching to Japanese | end card
"$FFMPEG" -hide_banner -loglevel error -y -i raw-30fps.mp4 -loop 1 -framerate 30 -t 2.2 -i endcard.png -filter_complex "
  [0:v]trim=start=0.6:end=23.6,setpts=PTS-STARTPTS,fps=30[a];
  [0:v]trim=start=26.4:end=30.3,setpts=PTS-STARTPTS,fps=30[b];
  [1:v]scale=1280:720,format=yuv420p,setsar=1,fps=30[c];
  [a][b]xfade=transition=fade:duration=0.4:offset=22.6[ab];
  [ab][c]xfade=transition=fade:duration=0.5:offset=26.0,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -preset slow -crf 21 -profile:v high -pix_fmt yuv420p -movflags +faststart -an hanon-preview.mp4

# 3. hover loop (~480p, 8 s): home intro → glide to About
"$FFMPEG" -hide_banner -loglevel error -y -ss 5.5 -t 8 -i raw-30fps.mp4 -vf "scale=854:-2,format=yuv420p" -c:v libx264 -preset slow -crf 25 -movflags +faststart -an hanon-hover.mp4

# 4. stills → WebP (Cloudinary serves f_auto anyway; smaller uploads)
node -e '
const sharp = require("module").createRequire(process.argv[1] + "/package.json")("sharp");
const files = require("fs").readdirSync(".").filter((f) => /^(d|m)\d.*\.png$/.test(f) || /^admin\/.*\.png$/.test(f));
Promise.all(files.map((f) => sharp(f).webp({ quality: 90, effort: 6 }).toFile(f.replace(/\.png$/, ".webp")))).then(() => console.log(files.length, "stills → webp"));
' "$ROOT"

ls -la hanon-preview.mp4 hanon-hover.mp4 ./*.webp

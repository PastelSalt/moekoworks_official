#!/usr/bin/env bash
# Encodes the Aqua Iro Archive screencast (from aqua.mts) into the preview video, a hover loop and WebP stills.
# Times are seconds in raw-30fps.mp4 (check marks.json + a timeline sheet after a new capture).
# FFMPEG / no ImageMagick: set FFMPEG=/path/to/ffmpeg (e.g. from the ffmpeg-static npm package); stills use sharp.
set -euo pipefail
FFMPEG="${FFMPEG:-ffmpeg}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$(dirname "$0")/out/aqua"

# 1. variable-rate screencast frames → constant 30 fps
"$FFMPEG" -hide_banner -loglevel error -y -f concat -safe 0 -i frames.ffconcat -vf "fps=30,format=yuv420p" -c:v libx264 -preset veryfast -crf 16 raw-30fps.mp4

# 2. edit: loading + PRESS START title | Home with the Talk box | About | Discography → Streaming → Events → Arts
#    (page-switch shutters kept) | Message Board | end card
"$FFMPEG" -hide_banner -loglevel error -y -i raw-30fps.mp4 -loop 1 -framerate 30 -t 2.2 -i endcard.png -filter_complex "
  [0:v]trim=start=0.8:end=4.9,setpts=PTS-STARTPTS,fps=30[a];
  [0:v]trim=start=7.8:end=12.8,setpts=PTS-STARTPTS,fps=30[b];
  [0:v]trim=start=16.6:end=19.0,setpts=PTS-STARTPTS,fps=30[c];
  [0:v]trim=start=20.6:end=34.7,setpts=PTS-STARTPTS,fps=30[d];
  [0:v]trim=start=34.9:end=38.5,setpts=PTS-STARTPTS,fps=30[e];
  [1:v]scale=1280:720,format=yuv420p,setsar=1,fps=30[g];
  [a][b]xfade=transition=fade:duration=0.4:offset=3.7[ab];
  [ab][c]xfade=transition=fade:duration=0.4:offset=8.3[ac];
  [ac][d]xfade=transition=fade:duration=0.4:offset=10.3[ad];
  [ad][e]xfade=transition=fade:duration=0.4:offset=24.0[ae];
  [ae][g]xfade=transition=fade:duration=0.5:offset=27.1,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -preset slow -crf 21 -profile:v high -pix_fmt yuv420p -movflags +faststart -an aqua-preview.mp4

# 3. hover loop (~480p, 8 s): the Discography and Streaming shutters with their chapter banners
"$FFMPEG" -hide_banner -loglevel error -y -ss 20.6 -t 8 -i raw-30fps.mp4 -vf "scale=854:-2,format=yuv420p" -c:v libx264 -preset slow -crf 25 -movflags +faststart -an aqua-hover.mp4

# 4. stills → WebP (Cloudinary serves f_auto anyway; smaller uploads)
node -e '
const sharp = require("module").createRequire(process.argv[1] + "/package.json")("sharp");
const files = require("fs").readdirSync(".").filter((f) => /^(d|m)\d.*\.png$/.test(f));
Promise.all(files.map((f) => sharp(f).webp({ quality: 90, effort: 6 }).toFile(f.replace(/\.png$/, ".webp")))).then(() => console.log(files.length, "stills → webp"));
' "$ROOT"

ls -la aqua-preview.mp4 aqua-hover.mp4 ./*.webp

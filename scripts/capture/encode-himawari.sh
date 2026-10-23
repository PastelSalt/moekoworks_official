#!/usr/bin/env bash
# Encodes the Himawari website screencast (from himawari.mts) into the preview video, a hover loop and WebP stills.
# Times are seconds in raw-30fps.mp4 (check marks.json + a timeline sheet after a new capture).
# FFMPEG / no ImageMagick: set FFMPEG=/path/to/ffmpeg (e.g. from the ffmpeg-static npm package); stills use sharp.
# The Studio screenshots (app-*.png) are copied by hand from the engine repo's docs/images before running this.
set -euo pipefail
FFMPEG="${FFMPEG:-ffmpeg}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$(dirname "$0")/out/himawari"

# 1. variable-rate screencast frames → constant 30 fps
"$FFMPEG" -hide_banner -loglevel error -y -f concat -safe 0 -i frames.ffconcat -vf "fps=30,format=yuv420p" -c:v libx264 -preset veryfast -crf 16 raw-30fps.mp4

# 2. edit: typing hero → about + features scroll | download | learn | news | Japanese hero | end card
"$FFMPEG" -hide_banner -loglevel error -y -i raw-30fps.mp4 -loop 1 -framerate 30 -t 2.2 -i endcard.png -filter_complex "
  [0:v]trim=start=1.0:end=7.0,setpts=PTS-STARTPTS,fps=30[a];
  [0:v]trim=start=10.4:end=22.4,setpts=PTS-STARTPTS,fps=30[b];
  [0:v]trim=start=24.3:end=26.3,setpts=PTS-STARTPTS,fps=30[c];
  [0:v]trim=start=28.4:end=30.2,setpts=PTS-STARTPTS,fps=30[d];
  [0:v]trim=start=32.0:end=34.0,setpts=PTS-STARTPTS,fps=30[e];
  [0:v]trim=start=35.5:end=39.5,setpts=PTS-STARTPTS,fps=30[f];
  [1:v]scale=1280:720,format=yuv420p,setsar=1,fps=30[g];
  [a][b]xfade=transition=fade:duration=0.4:offset=5.6[ab];
  [ab][c]xfade=transition=fade:duration=0.4:offset=17.2[ac];
  [ac][d]xfade=transition=fade:duration=0.4:offset=18.8[ad];
  [ad][e]xfade=transition=fade:duration=0.4:offset=20.2[ae];
  [ae][f]xfade=transition=fade:duration=0.4:offset=21.8[af];
  [af][g]xfade=transition=fade:duration=0.5:offset=25.3,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -preset slow -crf 21 -profile:v high -pix_fmt yuv420p -movflags +faststart -an himawari-preview.mp4

# 3. hover loop (~480p, 8 s): the feature rows (Studio screenshots) sliding past; the hero alone looks static on a card
"$FFMPEG" -hide_banner -loglevel error -y -ss 12.4 -t 8 -i raw-30fps.mp4 -vf "scale=854:-2,format=yuv420p" -c:v libx264 -preset slow -crf 25 -movflags +faststart -an himawari-hover.mp4

# 4. stills → WebP (Cloudinary serves f_auto anyway; smaller uploads). d06 (FAQ, all closed) is skipped.
node -e '
const sharp = require("module").createRequire(process.argv[1] + "/package.json")("sharp");
const files = require("fs").readdirSync(".").filter((f) => (/^(d|m)\d.*\.png$/.test(f) && !f.startsWith("d06")) || /^app-.*\.png$/.test(f));
Promise.all(files.map((f) => sharp(f).webp({ quality: 90, effort: 6 }).toFile(f.replace(/\.png$/, ".webp")))).then(() => console.log(files.length, "stills → webp"));
' "$ROOT"

ls -la himawari-preview.mp4 himawari-hover.mp4 ./*.webp

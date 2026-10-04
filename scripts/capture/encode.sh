#!/usr/bin/env bash
# Encodes the Kotoha screencast (from kotoha.mts) into the preview video, a hover loop and WebP stills.
# Times are seconds in raw-30fps.mp4 (check marks.json after a new capture).
set -euo pipefail
cd "$(dirname "$0")/out/kotoha"

# 1. variable-rate screencast frames → constant 30 fps
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i frames.ffconcat -vf "fps=30,format=yuv420p" -c:v libx264 -preset veryfast -crf 16 raw-30fps.mp4

# 2. edit: loader → home → about → news → discography → gallery + lightbox | home in Japanese | end card
ffmpeg -hide_banner -loglevel error -y -i raw-30fps.mp4 -loop 1 -framerate 30 -t 2.2 -i endcard.png -filter_complex "
  [0:v]trim=start=1.2:end=24.6,setpts=PTS-STARTPTS,fps=30[a];
  [0:v]trim=start=27.6:end=32.0,setpts=PTS-STARTPTS,fps=30[b];
  [1:v]scale=1280:720,format=yuv420p,setsar=1,fps=30[c];
  [a][b]xfade=transition=fade:duration=0.4:offset=23.0[ab];
  [ab][c]xfade=transition=fade:duration=0.5:offset=26.9,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -preset slow -crf 21 -profile:v high -pix_fmt yuv420p -movflags +faststart -an kotoha-preview.mp4

# 3. hover loop (~480p, 8 s): home → glide to About → News
ffmpeg -hide_banner -loglevel error -y -ss 6.0 -t 8 -i raw-30fps.mp4 -vf "scale=854:-2,format=yuv420p" -c:v libx264 -preset slow -crf 25 -movflags +faststart -an kotoha-hover.mp4

# 4. stills → WebP (Cloudinary serves f_auto anyway; smaller uploads)
for f in d0*.png m0*.png; do magick "$f" -quality 90 -define webp:method=6 "${f%.png}.webp"; done

ls -la kotoha-preview.mp4 kotoha-hover.mp4 ./*.webp
ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate -of compact kotoha-preview.mp4

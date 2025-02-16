```
ffmpeg \
-y \
-i etc/audio_short.mp3 \
-loop 1 -i etc/bg.png \
-filter_complex "[0:a]showwaves=s=1920x300:colors=0xffffff:mode=line,format=rgba[v];[1:v][v]overlay=0:780[outv]" \
-map "[outv]" \
-map 0:a \
-c:v png -c:a copy -shortest -vcodec libx264 -acodec aac output.mp4
```

ffmpeg -re -stream_loop -1 -i input.mp4 -c copy -f flv
rtmp://your_rtmp_server/live/stream_key

ffmpeg -loop 1 -re -i bg.png -f mpegts -c:v libx264 -b:v 2M -maxrate 2M -bufsize
4M -preset ultrafast -tune stillimage -pix_fmt yuv420p -x264opts
keyint=30:no-scenecut -bsf:v h264_mp4toannexb -an
"udp://0.0.0.0:8088?pkt_size=1316"

locals {
  live_container_name = "${var.name}-live"
  live_container_port = 3000

  rtmp_container_name = "${var.name}-rtmp"
  rtmp_api_port       = 3001
  rtmp_stream_port    = var.rtmp_stream_port

  generate_container_name = "${var.name}-generate"
  generate_container_port = 3002
}


# - PORT=3000
# - VAR_DIR=/var/studio
# - PRIVATE_URL=http://live:3000
# - GENERATE_API_URL=http://generate:3000
# - RTMP_API_URL=http://rtmp:3000
# - RTMP_STREAM_PORT=1935
# - RTMP_UDP_RANGE=9000-9999

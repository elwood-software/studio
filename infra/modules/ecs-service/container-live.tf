

locals {
  live_container_definition = {
    name      = local.live_container_name
    image     = "${var.live_repo_url}:latest"
    essential = true

    portMappings = [{
      protocol      = "tcp"
      containerPort = local.live_container_port
      hostPort      = local.live_container_port
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.this.name
        awslogs-stream-prefix = "live"
        awslogs-region        = var.aws_region
      }
    }

    environment = [
      {
        name  = "NODE_ENV",
        value = "production"
      },
      {
        name  = "PORT",
        value = tostring(local.live_container_port)
      },
      {
        name  = "PRIVATE_URL",
        value = "http://live:${local.live_container_port}"
      },
      {
        name  = "GENERATE_API_URL",
        value = "http://generate:${local.generate_container_port}"
      },
      {
        name  = "RTMP_API_URL",
        value = "http://rtmp:${local.rtmp_api_port}"
      },
      {
        name  = "RTMP_STREAM_PORT",
        value = tostring(local.rtmp_stream_port)
      }
    ]
  }
}




locals {
  rtmp_container_definition = {
    name      = local.rtmp_container_name
    image     = "${var.rtmp_repo_url}:latest"
    essential = true

    portMappings = [
      {
        protocol      = "tcp"
        containerPort = local.rtmp_api_port
        hostPort      = local.rtmp_api_port
      },
      {
        protocol      = "tcp"
        containerPort = local.rtmp_stream_port
        hostPort      = local.rtmp_stream_port
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.this.name
        awslogs-stream-prefix = "rtmp"
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
        value = tostring(local.rtmp_api_port)
      }
    ]
  }
}


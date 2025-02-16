resource "aws_cloudwatch_log_group" "this" {
  name              = "/ecs/${var.name}"
  retention_in_days = 1
}

resource "aws_ecs_task_definition" "this" {
  family                   = "${var.name}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 1024
  memory                   = 4096
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  runtime_platform {
    operating_system_family = "LINUX"
    # cpu_architecture = "ARM64"
  }

  container_definitions = jsonencode([
    local.live_container_definition,
    local.rtmp_container_definition
  ])

  tags = {
    Name = "${var.name}-task"
  }
}


resource "aws_ecs_service" "this" {
  name                               = "${var.name}-service"
  cluster                            = var.cluster_id
  task_definition                    = aws_ecs_task_definition.this.arn
  desired_count                      = 1
  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200
  health_check_grace_period_seconds  = 60
  launch_type                        = "FARGATE"
  scheduling_strategy                = "REPLICA"

  network_configuration {
    security_groups  = var.source_security_group_ids
    subnets          = var.subnet_ids
    assign_public_ip = false
  }

  # live
  load_balancer {
    target_group_arn = aws_alb_target_group.http.arn
    container_name   = local.live_container_name
    container_port   = local.live_container_port
  }

  # rtmp
  load_balancer {
    target_group_arn = aws_lb_target_group.rtmp.arn
    container_name   = local.rtmp_container_name
    container_port   = local.rtmp_stream_port
  }


  # we ignore task_definition changes as the revision changes on deploy
  # of a new version of the application
  # desired_count is ignored as it can change due to autoscaling policy
  lifecycle {
    ignore_changes = [desired_count]
  }
}

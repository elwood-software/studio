
# HTTP
resource "aws_alb_target_group" "http" {
  name        = "${var.name}-tg-http"
  port        = local.live_container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    healthy_threshold   = "3"
    interval            = "30"
    protocol            = "HTTP"
    matcher             = "200"
    timeout             = "3"
    path                = "/health"
    unhealthy_threshold = "2"
  }

  tags = {
    Name = "${var.name}-tg-http"
  }
}

resource "aws_lb_listener_rule" "http" {
  listener_arn = var.https_listener_arn
  priority     = var.listener_rule_priority

  action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.http.arn
  }

  condition {
    host_header {
      values = [var.hostname]
    }
  }
}




# RTMP
resource "aws_lb_target_group" "rtmp" {
  name        = "${var.name}-tg-rtmp"
  port        = local.rtmp_stream_port
  protocol    = "TCP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    healthy_threshold   = "3"
    interval            = "30"
    protocol            = "TCP"
    timeout             = "3"
    unhealthy_threshold = "2"
  }

  tags = {
    Name = "${var.name}-tg-rtmp"
  }
}


resource "aws_lb_listener" "rtmp" {
  load_balancer_arn = var.rtmp_listener_arn
  port              = local.rtmp_stream_port
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.rtmp.arn
  }
}


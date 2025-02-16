
## HTTP
resource "aws_lb" "main" {
  name                       = "${var.name}-alb"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.ecs_tasks.id]
  subnets                    = aws_subnet.public[*].id
  enable_deletion_protection = false

  tags = {
    Name = "${var.name}-alb"
  }
}

resource "aws_alb_listener" "http" {
  load_balancer_arn = aws_lb.main.id
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = 443
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}


resource "aws_alb_listener" "https" {
  load_balancer_arn = aws_lb.main.id
  port              = 443
  protocol          = "HTTPS"

  ssl_policy      = "ELBSecurityPolicy-2016-08"
  certificate_arn = data.aws_acm_certificate.domain.arn

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = ":)"
      status_code  = "200"
    }
  }
}

resource "aws_route53_record" "studio" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "*.${var.subdomain_hostname}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = false
  }
}


## RTMP
resource "aws_lb" "nlb" {
  name                       = "${var.name}-nlb"
  internal                   = false
  load_balancer_type         = "network"
  subnets                    = aws_subnet.public[*].id
  enable_deletion_protection = false
}


resource "aws_lb_listener" "rtmp" {
  load_balancer_arn = aws_lb.nlb.arn
  port              = 80
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.rtmp.arn
  }
}

resource "aws_lb_target_group" "rtmp" {
  name     = "${var.name}-tg-default-rtmp"
  port     = 1935
  protocol = "TCP"
  vpc_id   = aws_vpc.main.id

  tags = {
    Name = "${var.name}-tg-default-rtmp"
  }
}



resource "aws_route53_record" "studio_rtmp" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "rtmp.${var.subdomain_hostname}"
  type    = "A"

  alias {
    name                   = aws_lb.nlb.dns_name
    zone_id                = aws_lb.nlb.zone_id
    evaluate_target_health = false
  }
}

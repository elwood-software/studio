resource "aws_ecs_cluster" "this" {
  name = "${var.name}-cluster"
}

# zeus service
module "zeus" {
  source                 = "../modules/ecs-service"
  cluster_id             = aws_ecs_cluster.this.id
  name                   = "${var.name}-zeus"
  live_repo_url          = module.live_repo.url
  rtmp_repo_url          = module.rtmp_repo.url
  subnet_ids             = aws_subnet.private[*].id
  stream_port            = local.zeus_stream_port
  aws_region             = var.aws_region
  hostname               = "zeus.${var.subdomain_hostname}"
  listener_rule_priority = 1
  https_listener_arn     = aws_alb_listener.https.arn
  rtmp_listener_arn      = aws_lb.nlb.arn
  rtmp_stream_port       = 1935
  vpc_id                 = aws_vpc.main.id

  source_security_group_ids = [
    aws_security_group.ecs_tasks.id
  ]
}

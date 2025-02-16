
locals {
  zeus_stream_port = 3000

  private_subnets = [for k, v in var.aws_azs : cidrsubnet(var.aws_vpc_cidr, 4, k)]
  public_subnets  = [for k, v in var.aws_azs : cidrsubnet(var.aws_vpc_cidr, 8, k + 48)]
}
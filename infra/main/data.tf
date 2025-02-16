data "aws_acm_certificate" "domain" {
  domain   = "${var.root_hostname}"
  most_recent = true
}

data "aws_route53_zone" "main" {
  name         = "${var.root_hostname}."
  private_zone = false
}

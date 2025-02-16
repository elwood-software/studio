provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

terraform {
  required_version = ">= 1.0"


  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.66.1"
    }
  }
}

module "main" {
  source = "./main"

  name               = "elwood-studio"
  root_hostname      = "elwood-dns.link"
  subdomain_hostname = "studio.elwood-dns.link"
  aws_region         = var.aws_region
  aws_vpc_cidr       = "10.0.0.0/16"
  aws_azs            = slice(data.aws_availability_zones.available.names, 0, 2)
}

data "aws_availability_zones" "available" {}

output "ecr_repo_urls" {
  value = module.elwood_studio.repo_urls
}

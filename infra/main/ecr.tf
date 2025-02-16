
# distribute
module "rtmp_repo" {
  source = "../modules/ecr-repo"
  name   = "${var.name}-rtmp"
}

# generate
module "generate_repo" {
  source = "../modules/ecr-repo"
  name   = "${var.name}-generate"
}

# stream
module "live_repo" {
  source = "../modules/ecr-repo"
  name   = "${var.name}-live"
}

output "repo_urls" {
  value = {
    live     = module.live_repo.url
    generate = module.generate_repo.url
    rtmp     = module.rtmp_repo.url
  }
}

job "sandbox-ai-orchestrator" {
  datacenters = ["dc1"]
  type = "service"

  group "orchestrator" {
    count = 3

    network {
      port "http" {
        static = 3000
      }
    }

    service {
      name = "sandbox-ai-orchestrator"
      port = "http"
      
      check {
        type     = "http"
        path     = "/health"
        interval = "10s"
        timeout  = "2s"
      }
    }

    task "app" {
      driver = "docker"

      config {
        image = "sandbox-ai-orchestrator:latest"
        ports = ["http"]
        
        volumes = [
          "/var/run/docker.sock:/var/run/docker.sock"
        ]
      }

      env {
        NODE_ENV = "production"
        PORT = "3000"
      }

      resources {
        cpu    = 500
        memory = 1024
      }
    }

    task "docker-daemon" {
      driver = "docker"

      config {
        image = "docker:dind"
        privileged = true
        
        volumes = [
          "/var/run/docker.sock:/var/run/docker.sock"
        ]
      }

      resources {
        cpu    = 200
        memory = 512
      }
    }

    scaling {
      enabled = true
      min     = 3
      max     = 10

      policy {
        cooldown            = "1m"
        evaluation_interval = "10s"

        check "cpu_usage" {
          source = "nomad-apm"
          query  = "avg_cpu"

          strategy "target-value" {
            target = 70
          }
        }

        check "memory_usage" {
          source = "nomad-apm"
          query  = "avg_memory"

          strategy "target-value" {
            target = 80
          }
        }
      }
    }
  }
}

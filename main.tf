terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "eu-west-3" # Paris
}

resource "aws_vpc" "neuro_vpc" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "Neuro-OS-VPC"
  }
}

# Example Auto-Scaling Group for Brain Modules
resource "aws_launch_template" "neuro_brain_node" {
  name_prefix   = "neuro-node-"
  image_id      = "ami-0abcdef1234567890" # Example AMI
  instance_type = "g4dn.xlarge" # GPU instance for AI

  tags = {
    Name = "Neuro-OS Node"
  }
}

resource "aws_autoscaling_group" "neuro_asg" {
  vpc_zone_identifier = [aws_vpc.neuro_vpc.id]
  desired_capacity    = 2
  max_size            = 10
  min_size            = 1

  launch_template {
    id      = aws_launch_template.neuro_brain_node.id
    version = "$Latest"
  }
}

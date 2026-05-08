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
  enable_dns_hostnames = true
  tags = { Name = "Neuro-OS-VPC" }
}

resource "aws_subnet" "neuro_subnet" {
  vpc_id            = aws_vpc.neuro_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "eu-west-3a"
  tags = { Name = "Neuro-OS-Subnet" }
}

resource "aws_launch_template" "neuro_brain_node" {
  name_prefix   = "neuro-node-"
  image_id      = "ami-08461dc8cd9e834e0" # Ubuntu 22.04 LTS (eu-west-3)
  instance_type = "g4dn.xlarge" # GPU instance for high-performance AI

  network_interfaces {
    associate_public_ip_address = true
    subnet_id                  = aws_subnet.neuro_subnet.id
  }

  tags = { Name = "Neuro-OS Node" }
}

resource "aws_autoscaling_group" "neuro_asg" {
  vpc_zone_identifier = [aws_subnet.neuro_subnet.id] # Fixed: List of Subnet IDs, not VPC
  desired_capacity    = 2
  max_size            = 10
  min_size            = 1

  launch_template {
    id      = aws_launch_template.neuro_brain_node.id
    version = "$Latest"
  }
}

# Assignment 1

## Run

This project has a docker-compose.yml file defining a Cassandra service running along Consul and NodeJs server

To use it just create the services:

> $ docker-compose up -d

Then scale the cassandra cluster to the number of nodes desired:

> $ docker-compose scale cassandra=3

When all nodes are up and running you can verify the cluster is created properly:

> $ docker-compose exec cassandra nodetool status

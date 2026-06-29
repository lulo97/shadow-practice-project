Install docker on wsl
    sudo apt update
    sudo apt install docker.io -y
    sudo service docker start
    docker ps

Install redis
    docker run -d --name my-redis -p 6379:6379 redis
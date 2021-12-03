#!/bin/sh

if [ ! -f index.html ]; then
    echo "*** index.html is not here, are you in the right place? ***"
else
    docker stop msam-browser-app
    docker container rm msam-browser-app
    docker run --name msam-browser-app -v `pwd`:/var/www/html:ro -d -p 38080:80 public.ecr.aws/ubuntu/nginx:latest
fi

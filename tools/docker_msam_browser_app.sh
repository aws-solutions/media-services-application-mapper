#!/bin/sh

if [ ! -f index.html ]; then
    echo "*** index.html is not here, are you in the right place? ***"
else
    docker run --name msam-browser-app -v `pwd`:/usr/share/nginx/html:ro -d -p 38080:80 nginx:stable-alpine
fi

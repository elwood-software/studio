
# base
ARG NODE_VERSION=22.7.0
FROM node:alpine as base
LABEL fly_launch_runtime="NodeJS"
WORKDIR /app
ENV NODE_ENV=production
ENV APOLLO_STREAMS_DIR=/data

# build stage
FROM base as build
COPY --link package.json .
RUN npm install
COPY --link src/ .

# build nginx
FROM alpine as nginx
RUN apk add --update build-base git bash gcc make g++ zlib-dev linux-headers pcre-dev openssl-dev
RUN git config --global http.version HTTP/1.1 && \
  git clone https://github.com/arut/nginx-rtmp-module.git && \
  git clone https://github.com/nginx/nginx.git
RUN cd nginx && ./auto/configure --add-module=../nginx-rtmp-module && make && make install

# Final image
FROM base

# copy nginx
RUN apk add --update pcre ffmpeg curl bash
COPY --from=nginx /usr/local/nginx /usr/local/nginx
COPY --from=nginx nginx-rtmp-module/stat.xsl /usr/local/nginx/html/stat.xsl

COPY --from=build /app /app

RUN mkdir -p ${APOLLO_STREAMS_DIR}

# stream files
COPY ./nginx.conf /usr/local/nginx/conf/nginx.conf
COPY ./docker-entrypoint.sh /docker-entrypoint.sh
COPY ./relay.sh /usr/local/bin/relay.sh

RUN chmod +x /usr/local/bin/relay.sh
RUN chmod +x /docker-entrypoint.sh
RUN node -v && npm -v && ffmpeg -version

RUN bash -v

RUN mkdir -p /usr/local/nginx/html/streams \
  && chmod 777 /usr/local/nginx/html/streams \
  && echo "hello" > /usr/local/nginx/html/streams/index.html

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD []
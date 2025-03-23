
# base 
FROM linuxserver/ffmpeg

ENV DENO_BIN /usr/local/bin/deno
ENV APOLLO_WORKSPACE_DIR /var/apollo-workspace

WORKDIR /app

COPY --from=denoland/deno:bin-2.1.10 /deno /usr/local/bin/deno
RUN chmod 755 /usr/local/bin/deno

RUN /usr/local/bin/deno --help

COPY ./deno.json /app/deno.json
COPY ./src /app/src

RUN ffmpeg -version
RUN mkdir -p ${APOLLO_WORKSPACE_DIR} \
  && chmod 777 ${APOLLO_WORKSPACE_DIR}

ENTRYPOINT ["/usr/local/bin/deno"]

CMD ["run", "-A", "-q", "--watch", "/app/src/serve.ts"]
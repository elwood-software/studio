
# base
ARG NODE_VERSION=22.7.0
FROM node:alpine AS base
LABEL fly_launch_runtime="NodeJS"
WORKDIR /app
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=1

# build stage
FROM base AS build
COPY --link package.json .
RUN npm install
COPY --link src/ src/
COPY --link tsconfig.json .


# Final image
FROM base

WORKDIR /app

# copy nginx
RUN apk add --update pcre ffmpeg curl bash
RUN node -v && npm -v && ffmpeg -version

COPY --from=build /app /app

RUN npm i -g puppeteer && npm run install-chrome

RUN mkdir -p /var/studio

CMD ["npm", "run", "start"]
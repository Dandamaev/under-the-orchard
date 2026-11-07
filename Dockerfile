# Dev image for the web prototype. Dependencies are installed at container
# start into the node_modules volume (see docker-compose.yml), not baked in.
FROM node:24-bookworm-slim

WORKDIR /app

EXPOSE 5173

CMD ["npm", "run", "dev"]

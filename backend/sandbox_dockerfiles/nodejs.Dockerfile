# Node.js Sandbox Dockerfile
# Used when projects don't have their own Dockerfile

FROM node:20-slim

WORKDIR /workspace

# Install package managers
RUN npm install -g yarn pnpm

# Create non-root user for security
RUN useradd -m -s /bin/bash sandbox
USER sandbox

CMD ["bash"]

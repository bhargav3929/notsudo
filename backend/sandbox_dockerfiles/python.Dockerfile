# Python Sandbox Dockerfile
# Used when projects don't have their own Dockerfile

FROM python:3.11-slim

WORKDIR /workspace

# Install common Python development tools
RUN pip install --no-cache-dir \
    pytest \
    pytest-cov \
    black \
    flake8 \
    mypy

# Create non-root user for security
RUN useradd -m -s /bin/bash sandbox
USER sandbox

CMD ["bash"]

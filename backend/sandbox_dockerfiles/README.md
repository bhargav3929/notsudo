# Sandbox Dockerfiles

These Dockerfiles are used as fallbacks when a project doesn't have its own Docker configuration.

## When are these used?

1. **Project has Dockerfile**: We build and use the project's image (preferred)
2. **No Dockerfile found**: We use these generic images based on detected stack

## Files

- `python.Dockerfile` - Python 3.11 with pytest, black, flake8
- `nodejs.Dockerfile` - Node 20 with npm, yarn, pnpm

## Building manually

```bash
# Python image
docker build -f python.Dockerfile -t sandbox-python .

# Node.js image  
docker build -f nodejs.Dockerfile -t sandbox-nodejs .
```

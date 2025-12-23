from dataclasses import dataclass
from typing import Optional


@dataclass
class StackConfig:
    stack_type: str
    runtime: str
    package_manager: str
    install_command: str
    test_command: str
    build_command: Optional[str] = None


STACK_CONFIGS = {
    'python': StackConfig(
        stack_type='python',
        runtime='python:3.11-slim',
        package_manager='pip',
        install_command='pip install -r requirements.txt',
        test_command='pytest',
        build_command=None
    ),
    'python-poetry': StackConfig(
        stack_type='python',
        runtime='python:3.11-slim',
        package_manager='poetry',
        install_command='pip install poetry && poetry install',
        test_command='poetry run pytest',
        build_command=None
    ),
    'nodejs-npm': StackConfig(
        stack_type='nodejs',
        runtime='node:20-slim',
        package_manager='npm',
        install_command='npm install',
        test_command='npm test',
        build_command='npm run build'
    ),
    'nodejs-yarn': StackConfig(
        stack_type='nodejs',
        runtime='node:20-slim',
        package_manager='yarn',
        install_command='yarn install',
        test_command='yarn test',
        build_command='yarn build'
    ),
    'nodejs-pnpm': StackConfig(
        stack_type='nodejs',
        runtime='node:20-slim',
        package_manager='pnpm',
        install_command='pnpm install',
        test_command='pnpm test',
        build_command='pnpm build'
    ),
}


class StackDetectorService:
    MARKER_FILES = {
        'requirements.txt': 'python',
        'pyproject.toml': 'python-poetry',
        'setup.py': 'python',
        'package.json': 'nodejs',
        'pom.xml': 'java',
        'build.gradle': 'java',
        'go.mod': 'go',
        'Cargo.toml': 'rust',
    }

    def detect_from_file_list(self, file_paths: list[str]) -> Optional[StackConfig]:
        filenames = {path.split('/')[-1] for path in file_paths}
        
        if 'package.json' in filenames:
            if 'yarn.lock' in filenames:
                return STACK_CONFIGS['nodejs-yarn']
            elif 'pnpm-lock.yaml' in filenames:
                return STACK_CONFIGS['nodejs-pnpm']
            else:
                return STACK_CONFIGS['nodejs-npm']
        
        if 'pyproject.toml' in filenames:
            return STACK_CONFIGS['python-poetry']
        
        if 'requirements.txt' in filenames or 'setup.py' in filenames:
            return STACK_CONFIGS['python']
        
        return None

    def detect_from_github_repo(self, github_service, repo) -> Optional[StackConfig]:
        structure = github_service.get_directory_structure(repo, path='', ref='main')
        file_paths = [item['path'] for item in structure if item['type'] == 'file']
        return self.detect_from_file_list(file_paths)

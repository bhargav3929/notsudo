"""
Formatter Detection Service

Detects code formatters in a project (Prettier, ESLint, Black, etc.)
and returns the appropriate format commands to run on files.
"""
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
from utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class FormatterConfig:
    """Configuration for a detected formatter."""
    formatter_type: str  # 'prettier', 'eslint', 'black', 'isort', etc.
    format_command: str  # Command template with {file} placeholder
    file_extensions: list[str]  # Which file extensions this formatter handles


# Mapping of file extensions to formatter types
EXTENSION_TO_FORMATTER = {
    # JavaScript/TypeScript/Web
    '.js': 'prettier',
    '.jsx': 'prettier',
    '.ts': 'prettier',
    '.tsx': 'prettier',
    '.json': 'prettier',
    '.css': 'prettier',
    '.scss': 'prettier',
    '.html': 'prettier',
    '.md': 'prettier',
    '.yaml': 'prettier',
    '.yml': 'prettier',
    # Python
    '.py': 'black',
}


class FormatterDetectorService:
    """Detects and configures code formatters for a project."""
    
    # Prettier config files
    PRETTIER_CONFIG_FILES = {
        '.prettierrc',
        '.prettierrc.json',
        '.prettierrc.js',
        '.prettierrc.cjs',
        '.prettierrc.mjs',
        '.prettierrc.yaml',
        '.prettierrc.yml',
        '.prettierrc.toml',
        'prettier.config.js',
        'prettier.config.cjs',
        'prettier.config.mjs',
    }
    
    # ESLint config files
    ESLINT_CONFIG_FILES = {
        '.eslintrc',
        '.eslintrc.json',
        '.eslintrc.js',
        '.eslintrc.cjs',
        '.eslintrc.yaml',
        '.eslintrc.yml',
        'eslint.config.js',
        'eslint.config.mjs',
        'eslint.config.cjs',
    }
    
    # Python formatter config indicators
    PYTHON_FORMATTER_INDICATORS = {
        'black': ['[tool.black]', '[tool.black.'],
        'isort': ['[tool.isort]', '[tool.isort.'],
        'autopep8': ['[tool.autopep8]', '[autopep8]'],
    }
    
    def detect_formatters(self, repo_path: str) -> list[FormatterConfig]:
        """
        Detect all formatters configured in the repository.
        
        Args:
            repo_path: Path to the cloned repository
            
        Returns:
            List of FormatterConfig for each detected formatter
        """
        formatters = []
        file_list = self._get_file_list(repo_path)
        filenames = {Path(f).name for f in file_list}
        
        # Check for Prettier
        prettier_config = self._detect_prettier(repo_path, filenames)
        if prettier_config:
            formatters.append(prettier_config)
            logger.info("formatter_detected", formatter="prettier")
        
        # Check for ESLint (as a fallback for JS/TS if no Prettier)
        if not prettier_config:
            eslint_config = self._detect_eslint(filenames)
            if eslint_config:
                formatters.append(eslint_config)
                logger.info("formatter_detected", formatter="eslint")
        
        # Check for Python formatters
        python_formatters = self._detect_python_formatters(repo_path, filenames)
        formatters.extend(python_formatters)
        
        if not formatters:
            logger.info("no_formatters_detected")
        
        return formatters
    
    def _get_file_list(self, repo_path: str) -> list[str]:
        """Get list of all files in the repo (relative paths)."""
        files = []
        for root, dirs, filenames in os.walk(repo_path):
            # Skip .git and node_modules directories
            dirs[:] = [d for d in dirs if d not in {'.git', 'node_modules', '__pycache__', 'venv', '.venv'}]
            for filename in filenames:
                full_path = os.path.join(root, filename)
                rel_path = os.path.relpath(full_path, repo_path)
                files.append(rel_path)
        return files
    
    def _detect_prettier(self, repo_path: str, filenames: set[str]) -> Optional[FormatterConfig]:
        """Detect Prettier configuration."""
        # Check for Prettier config files
        has_prettier_config = bool(filenames & self.PRETTIER_CONFIG_FILES)
        
        # Also check package.json for prettier key
        if not has_prettier_config and 'package.json' in filenames:
            try:
                package_json_path = Path(repo_path) / 'package.json'
                if package_json_path.exists():
                    with open(package_json_path, 'r') as f:
                        package_data = json.load(f)
                    # Check for prettier key or prettier in devDependencies
                    if 'prettier' in package_data:
                        has_prettier_config = True
                    elif 'devDependencies' in package_data and 'prettier' in package_data['devDependencies']:
                        has_prettier_config = True
                    elif 'dependencies' in package_data and 'prettier' in package_data['dependencies']:
                        has_prettier_config = True
            except (json.JSONDecodeError, IOError) as e:
                logger.warning("package_json_parse_error", error=str(e))
        
        if has_prettier_config:
            return FormatterConfig(
                formatter_type='prettier',
                format_command='npx prettier --write {file}',
                file_extensions=['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss', '.html', '.md', '.yaml', '.yml']
            )
        
        return None
    
    def _detect_eslint(self, filenames: set[str]) -> Optional[FormatterConfig]:
        """Detect ESLint configuration."""
        if filenames & self.ESLINT_CONFIG_FILES:
            return FormatterConfig(
                formatter_type='eslint',
                format_command='npx eslint --fix {file}',
                file_extensions=['.js', '.jsx', '.ts', '.tsx']
            )
        return None
    
    def _detect_python_formatters(self, repo_path: str, filenames: set[str]) -> list[FormatterConfig]:
        """Detect Python formatters (Black, isort, autopep8)."""
        formatters = []
        
        # Check pyproject.toml for Black/isort config
        if 'pyproject.toml' in filenames:
            try:
                pyproject_path = Path(repo_path) / 'pyproject.toml'
                if pyproject_path.exists():
                    content = pyproject_path.read_text()
                    
                    # Check for Black
                    if '[tool.black]' in content or 'black' in content.lower():
                        formatters.append(FormatterConfig(
                            formatter_type='black',
                            format_command='black {file}',
                            file_extensions=['.py']
                        ))
                        logger.info("formatter_detected", formatter="black")
                    
                    # Check for isort
                    if '[tool.isort]' in content:
                        formatters.append(FormatterConfig(
                            formatter_type='isort',
                            format_command='isort {file}',
                            file_extensions=['.py']
                        ))
                        logger.info("formatter_detected", formatter="isort")
            except IOError as e:
                logger.warning("pyproject_parse_error", error=str(e))
        
        # Check for setup.cfg or .flake8 (common with autopep8)
        if not formatters and ('.flake8' in filenames or 'setup.cfg' in filenames):
            # Could indicate autopep8 usage, but we'll default to black since it's more common
            pass
        
        # If Python files exist but no formatter detected, suggest black as default
        # (Not adding by default since it might not be installed)
        
        return formatters
    
    def get_formatter_for_file(self, file_path: str, formatters: list[FormatterConfig]) -> Optional[FormatterConfig]:
        """
        Get the appropriate formatter for a specific file.
        
        Args:
            file_path: Path to the file
            formatters: List of available formatters
            
        Returns:
            FormatterConfig if a formatter matches, None otherwise
        """
        ext = Path(file_path).suffix.lower()
        
        for formatter in formatters:
            if ext in formatter.file_extensions:
                return formatter
        
        return None
    
    def get_format_command(self, file_path: str, formatter: FormatterConfig) -> str:
        """
        Get the format command for a specific file.
        
        Args:
            file_path: Path to the file to format
            formatter: The formatter configuration
            
        Returns:
            The complete command to run
        """
        return formatter.format_command.replace('{file}', file_path)


# Singleton instance
_formatter_detector_service: Optional[FormatterDetectorService] = None


def get_formatter_detector_service() -> FormatterDetectorService:
    """Get or create the formatter detector service singleton."""
    global _formatter_detector_service
    if _formatter_detector_service is None:
        _formatter_detector_service = FormatterDetectorService()
    return _formatter_detector_service

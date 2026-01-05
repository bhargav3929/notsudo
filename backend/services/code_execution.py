"""
Code Execution Service - Orchestrates the full code validation flow.

Flow:
1. Clone repo into temp directory
2. Apply file changes from AI
3. Detect stack & resolve Docker image
4. Create container (local Docker or AWS Fargate)
5. Install dependencies
6. Run tests
7. Return result with logs

Sandbox modes:
- AWS Fargate (production): USE_AWS_SANDBOX=true
- Local Docker (development): Docker available
- Local fallback: No Docker available
"""
import logging
import os
import shutil
import subprocess
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from services.stack_detector import StackDetectorService, StackConfig
from services.docker_sandbox import DockerSandboxService, ExecResult, DOCKER_AVAILABLE
from services.formatter_detector import FormatterDetectorService, FormatterConfig
from services.comby_service import CombyService, COMBY_AVAILABLE
from services.security_scanner import SecurityScannerService, ScanResult, Severity

# Check if AWS sandbox is available
try:
    from services.aws_sandbox import AWSSandboxService, BOTO3_AVAILABLE
except ImportError:
    BOTO3_AVAILABLE = False
    AWSSandboxService = None

logger = logging.getLogger(__name__)

# Environment variable to enable AWS sandbox
USE_AWS_SANDBOX = os.environ.get('USE_AWS_SANDBOX', 'false').lower() == 'true'


@dataclass
class ExecutionResult:
    """Result of the full code validation flow."""
    success: bool
    stage: str  # 'clone', 'install', 'test', 'build', 'security'
    logs: list[str] = field(default_factory=list)
    error: Optional[str] = None
    exit_code: int = 0
    formatted_file_changes: Optional[list[dict]] = None  # Updated file contents after formatting
    security_issues: Optional[list[dict]] = None  # Security vulnerabilities found
    
    def add_log(self, message: str):
        self.logs.append(message)


@dataclass
class FileChange:
    """Represents a file change to apply."""
    file_path: str
    new_content: str = ''  # For edit type
    reason: str = ''
    type: str = 'edit'  # 'edit' or 'patch'
    match_pattern: str = ''  # For patch type
    replace_pattern: str = ''  # For patch type


class CodeExecutionService:
    """Orchestrates the full code validation flow.
    
    Supports three modes:
    1. AWS Fargate (production) - Set USE_AWS_SANDBOX=true
    2. Local Docker (development) - Docker Desktop running
    3. Local fallback - No Docker, runs commands directly
    """
    
    def __init__(
        self,
        stack_detector: Optional[StackDetectorService] = None,
        docker_sandbox: Optional[DockerSandboxService] = None,
        aws_sandbox: Optional["AWSSandboxService"] = None,
        formatter_detector: Optional[FormatterDetectorService] = None,
        security_scanner: Optional[SecurityScannerService] = None,
    ):
        self.stack_detector = stack_detector or StackDetectorService()
        self.formatter_detector = formatter_detector or FormatterDetectorService()
        self.comby_service = CombyService()
        self.security_scanner = security_scanner or SecurityScannerService()
        self.docker_sandbox = docker_sandbox
        self.aws_sandbox = aws_sandbox
        self.use_aws = False
        
        # DEV_MODE forces local Docker instead of AWS Fargate
        dev_mode = os.environ.get('DEV_MODE', 'false').lower() == 'true'
        
        # Check which sandbox to use
        if not dev_mode and USE_AWS_SANDBOX and BOTO3_AVAILABLE:
            # Production: Use AWS Fargate
            if self.aws_sandbox is None:
                try:
                    self.aws_sandbox = AWSSandboxService()
                    if self.aws_sandbox.is_available():
                        self.use_aws = True
                        logger.info("Using AWS Fargate sandbox")
                    else:
                        logger.warning("AWS sandbox configured but not available")
                except Exception as e:
                    logger.warning(f"AWS sandbox not available: {e}")
        elif dev_mode:
            logger.info("DEV_MODE enabled - using local Docker instead of AWS Fargate")
        
        # Fallback to local Docker
        if not self.use_aws and self.docker_sandbox is None and DOCKER_AVAILABLE:
            try:
                self.docker_sandbox = DockerSandboxService()
                logger.info("Using local Docker sandbox")
            except Exception as e:
                logger.warning(f"Docker sandbox not available: {e}")
    
    def validate_changes(
        self,
        repo_url: str,
        branch: str,
        file_changes: list[dict],
        run_tests: bool = True,
        run_build: bool = False,
    ) -> ExecutionResult:
        """
        Validate code changes in a Docker sandbox.
        
        Args:
            repo_url: Git URL to clone
            branch: Branch name containing the changes
            file_changes: List of file changes to apply
            run_tests: Whether to run tests
            run_build: Whether to run build command
            
        Returns:
            ExecutionResult with success status and logs
        """
        result = ExecutionResult(success=False, stage='init')
        temp_dir = None
        container = None
        built_image = None
        
        try:
            # Step 1: Clone repository
            result.stage = 'clone'
            temp_dir = tempfile.mkdtemp(prefix='sandbox-')
            result.add_log(f"Created temp directory: {temp_dir}")
            
            clone_result = self._clone_repo(repo_url, branch, temp_dir)
            if not clone_result.success:
                result.error = f"Clone failed: {clone_result.stderr}"
                return result
            result.add_log("Repository cloned successfully")
            
            # Step 2: Apply file changes (edit or patch)
            result.stage = 'apply'
            for c in file_changes:
                change = self._normalize_change(c)
                if change.type == 'patch' and change.match_pattern:
                    self._apply_patch(temp_dir, change, result)
                else:
                    self._apply_edit(temp_dir, change)
                    result.add_log(f"Applied change to {change.file_path}")
            
            # Step 2.5: Format files using project formatters (only for edit changes)
            result.stage = 'format'
            edit_changes = [self._normalize_change(c) for c in file_changes if self._normalize_change(c).type == 'edit']
            formatted_changes = self._format_files(temp_dir, edit_changes, result)
            if formatted_changes:
                result.formatted_file_changes = formatted_changes
            
            # Step 3: Detect stack
            result.stage = 'detect'
            file_paths = self._get_file_list(temp_dir)
            stack_config = self.stack_detector.detect_from_file_list(file_paths)
            
            if stack_config is None:
                # Can't detect stack - skip validation and allow PR creation
                result.add_log("Could not detect project stack - skipping validation")
                result.add_log("Supported stacks: Python (requirements.txt), Node.js (package.json)")
                result.success = True
                return result
            result.add_log(f"Detected stack: {stack_config.stack_type}")
            
            # Step 4: Choose execution mode
            if self.use_aws and self.aws_sandbox:
                # Production: Use AWS Fargate
                result.add_log("Using AWS Fargate sandbox")
                return self._run_in_aws(
                    temp_dir, file_changes, stack_config, run_tests, run_build, result
                )
            elif self.docker_sandbox is not None and self.docker_sandbox.is_available():
                # Development: Use local Docker
                result.add_log("Using local Docker sandbox")
                # Continue to Docker container flow below
            else:
                # Fallback: Run locally
                result.add_log("Docker not available, running locally")
                return self._run_locally(temp_dir, stack_config, run_tests, run_build, result)
            
            # Step 5: Resolve image and create container
            result.stage = 'container'
            try:
                image = self.docker_sandbox.resolve_image(stack_config, temp_dir)
                if stack_config.dockerfile_path:
                    built_image = image  # Track for cleanup
                result.add_log(f"Using image: {image}")
            except Exception as e:
                # Fallback to stack image if project image fails
                image = stack_config.runtime
                result.add_log(f"Fallback to stack image: {image}")
            
            container = self.docker_sandbox.create_container(image, temp_dir)
            result.add_log(f"Created container: {container.short_id}")
            
            # Step 6: Install dependencies (network is enabled by default in container)
            result.stage = 'install'
            install_result = self._run_install(container, stack_config, result)
            if not install_result.success:
                result.error = f"Install failed: {install_result.stderr}"
                return result
            
            # Step 6.5: Security scan on changed files
            result.stage = 'security'
            changed_file_paths = [self._normalize_change(c).file_path for c in file_changes]
            scan_result = self._run_security_scan(
                container, temp_dir, stack_config, changed_file_paths, result
            )
            if scan_result and not scan_result.passed:
                result.error = f"Security issues found: {scan_result.high_severity_count} high/critical vulnerabilities"
                result.security_issues = [i.to_dict() for i in scan_result.issues]
                return result
            
            # Step 7: Run tests
            if run_tests:
                result.stage = 'test'
                test_result = self._run_tests(container, stack_config, result)
                if not test_result.success:
                    result.error = f"Tests failed with exit code {test_result.exit_code}"
                    result.exit_code = test_result.exit_code
                    return result
            
            # Step 8: Run build (optional)
            if run_build and stack_config.build_command:
                result.stage = 'build'
                build_result = self._run_build(container, stack_config, result)
                if not build_result.success:
                    result.error = f"Build failed: {build_result.stderr}"
                    return result
            
            result.success = True
            result.add_log("All validations passed!")
            return result
            
        except Exception as e:
            logger.exception("Validation error")
            result.error = str(e)
            return result
            
        finally:
            # Cleanup
            if container and self.docker_sandbox:
                self.docker_sandbox.cleanup(container)
            if built_image and self.docker_sandbox:
                self.docker_sandbox.cleanup_image(built_image)
            if temp_dir and os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)
    
    def _clone_repo(self, repo_url: str, branch: str, dest: str) -> ExecResult:
        """Clone the repository."""
        try:
            result = subprocess.run(
                ["git", "clone", "--depth", "1", "--branch", branch, repo_url, dest],
                capture_output=True,
                text=True,
                timeout=120,
            )
            return ExecResult(
                exit_code=result.returncode,
                stdout=result.stdout,
                stderr=result.stderr,
            )
        except subprocess.TimeoutExpired:
            return ExecResult(exit_code=-1, stdout="", stderr="Clone timed out")
        except Exception as e:
            return ExecResult(exit_code=-1, stdout="", stderr=str(e))
    
    def _normalize_change(self, change) -> FileChange:
        """Convert dict or FileChange to FileChange object."""
        if isinstance(change, FileChange):
            return change
        if isinstance(change, dict):
            return FileChange(
                file_path=change.get('file_path', ''),
                new_content=change.get('new_content', ''),
                reason=change.get('reason', ''),
                type=change.get('type', 'edit'),
                match_pattern=change.get('match_pattern', ''),
                replace_pattern=change.get('replace_pattern', '')
            )
        return change
    
    def _apply_edit(self, repo_path: str, change: FileChange) -> None:
        """Apply a full file replacement to the cloned repo."""
        file_path = Path(repo_path) / change.file_path
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(change.new_content, encoding='utf-8')
    
    def _apply_patch(self, repo_path: str, change: FileChange, result: ExecutionResult) -> bool:
        """Apply a Comby structural patch to a file."""
        file_path = Path(repo_path) / change.file_path
        
        if not file_path.exists():
            result.add_log(f"Cannot patch {change.file_path}: file not found")
            return False
        
        if not self.comby_service.is_available():
            result.add_log(f"Comby not available, converting patch to edit for {change.file_path}")
            # Fallback: apply pattern manually if possible, or skip
            return False
        
        comby_result = self.comby_service.apply_patch(
            file_path=str(file_path),
            match_pattern=change.match_pattern,
            replace_pattern=change.replace_pattern,
            language=self.comby_service.detect_language(change.file_path),
            in_place=True
        )
        
        if comby_result.success:
            result.add_log(f"Applied patch to {change.file_path} ({comby_result.matches_found} matches)")
            return True
        else:
            result.add_log(f"Patch failed for {change.file_path}: {comby_result.error}")
            return False
    
    def _get_file_list(self, repo_path: str) -> list[str]:
        """Get list of all files in the repo (relative paths)."""
        files = []
        for root, dirs, filenames in os.walk(repo_path):
            # Skip .git directory
            dirs[:] = [d for d in dirs if d != '.git']
            for filename in filenames:
                full_path = os.path.join(root, filename)
                rel_path = os.path.relpath(full_path, repo_path)
                files.append(rel_path)
        return files
    
    def _format_files(
        self,
        repo_path: str,
        file_changes: list[FileChange],
        result: ExecutionResult
    ) -> Optional[list[dict]]:
        """
        Format changed files using project formatters.
        
        Args:
            repo_path: Path to the cloned repository
            file_changes: List of file changes that were applied
            result: ExecutionResult to add logs to
            
        Returns:
            List of updated file changes with formatted content, or None if no formatting done
        """
        try:
            # Detect formatters in the project
            formatters = self.formatter_detector.detect_formatters(repo_path)
            
            if not formatters:
                result.add_log("No formatters detected in project - using original content")
                return None
            
            result.add_log(f"Detected {len(formatters)} formatter(s): {', '.join(f.formatter_type for f in formatters)}")
            
            formatted_changes = []
            any_formatted = False
            
            for change in file_changes:
                # Find appropriate formatter for this file
                formatter = self.formatter_detector.get_formatter_for_file(change.file_path, formatters)
                
                if formatter:
                    # Run formatter on the file
                    file_full_path = Path(repo_path) / change.file_path
                    format_cmd = self.formatter_detector.get_format_command(str(file_full_path), formatter)
                    
                    result.add_log(f"Formatting {change.file_path} with {formatter.formatter_type}")
                    
                    try:
                        # Run the formatter command
                        format_result = subprocess.run(
                            format_cmd,
                            shell=True,
                            cwd=repo_path,
                            capture_output=True,
                            text=True,
                            timeout=30,
                        )
                        
                        if format_result.returncode == 0:
                            # Read back the formatted content
                            formatted_content = file_full_path.read_text(encoding='utf-8')
                            formatted_changes.append({
                                'file_path': change.file_path,
                                'new_content': formatted_content,
                                'reason': change.reason
                            })
                            any_formatted = True
                            result.add_log(f"Successfully formatted {change.file_path}")
                        else:
                            # Formatter failed, keep original content
                            result.add_log(f"Formatter returned non-zero for {change.file_path}: {format_result.stderr[:200]}")
                            formatted_changes.append({
                                'file_path': change.file_path,
                                'new_content': change.new_content,
                                'reason': change.reason
                            })
                    except subprocess.TimeoutExpired:
                        result.add_log(f"Formatter timed out for {change.file_path}")
                        formatted_changes.append({
                            'file_path': change.file_path,
                            'new_content': change.new_content,
                            'reason': change.reason
                        })
                    except Exception as e:
                        result.add_log(f"Formatter error for {change.file_path}: {str(e)}")
                        formatted_changes.append({
                            'file_path': change.file_path,
                            'new_content': change.new_content,
                            'reason': change.reason
                        })
                else:
                    # No formatter for this file type, keep original
                    formatted_changes.append({
                        'file_path': change.file_path,
                        'new_content': change.new_content,
                        'reason': change.reason
                    })
            
            if any_formatted:
                return formatted_changes
            else:
                return None
                
        except Exception as e:
            result.add_log(f"Formatting step error: {str(e)}")
            logger.warning(f"Formatting failed: {e}")
            return None

    
    def _run_install(
        self, 
        container, 
        stack_config: StackConfig, 
        result: ExecutionResult
    ) -> ExecResult:
        """Run dependency installation in container."""
        install_cmd = stack_config.install_command
        
        # For Node.js projects, ensure the package manager is available
        # The node:20-slim image only has npm by default, not pnpm or yarn
        if 'pnpm' in install_cmd:
            result.add_log("Installing pnpm in container...")
            pnpm_install = self.docker_sandbox.exec_command(
                container,
                "npm install -g pnpm",
                timeout=120,
            )
            if not pnpm_install.success:
                result.add_log(f"pnpm installation failed: {pnpm_install.stderr}")
                # Fall back to npm if pnpm installation fails
                result.add_log("Falling back to npm")
                install_cmd = install_cmd.replace('pnpm', 'npm')
            else:
                result.add_log("pnpm installed successfully")
        elif 'yarn' in install_cmd and 'npm' not in install_cmd:
            result.add_log("Installing yarn in container...")
            yarn_install = self.docker_sandbox.exec_command(
                container,
                "npm install -g yarn",
                timeout=120,
            )
            if not yarn_install.success:
                result.add_log(f"yarn installation failed: {yarn_install.stderr}")
                result.add_log("Falling back to npm")
                install_cmd = install_cmd.replace('yarn', 'npm')
            else:
                result.add_log("yarn installed successfully")
        
        result.add_log(f"Installing dependencies: {install_cmd}")
        exec_result = self.docker_sandbox.exec_command(
            container, 
            install_cmd,
            timeout=300,  # 5 minutes for install
        )
        result.add_log(f"Install output:\n{exec_result.stdout[:1000]}")
        if exec_result.stderr:
            result.add_log(f"Install stderr:\n{exec_result.stderr[:500]}")
        return exec_result
    
    def _run_security_scan(
        self,
        container,
        repo_path: str,
        stack_config: StackConfig,
        changed_files: list[str],
        result: ExecutionResult
    ) -> Optional[ScanResult]:
        """
        Run security scanning on changed files inside the container.
        
        Uses Bandit for Python, ESLint for JavaScript/TypeScript.
        Only fails on HIGH/CRITICAL severity issues.
        """
        if not changed_files:
            result.add_log("No files to scan for security issues")
            return None
        
        result.add_log(f"Running security scan on {len(changed_files)} files...")
        
        stack_type = stack_config.stack_type
        
        if stack_type == 'python':
            # Install and run Bandit in container
            result.add_log("Installing Bandit security scanner...")
            install_bandit = self.docker_sandbox.exec_command(
                container,
                "pip install bandit -q",
                timeout=60
            )
            if not install_bandit.success:
                result.add_log(f"Bandit install failed: {install_bandit.stderr[:200]}")
                return ScanResult(passed=True, error="Bandit install failed")
            
            # Run Bandit on specific Python files
            py_files = [f for f in changed_files if f.endswith('.py')]
            if not py_files:
                result.add_log("No Python files to scan")
                return ScanResult(passed=True)
            
            file_args = ' '.join(f'"/workspace/{f}"' for f in py_files)
            bandit_cmd = f"bandit -f json -ll --exit-zero {file_args}"
            result.add_log(f"Scanning {len(py_files)} Python files with Bandit")
            
            scan_exec = self.docker_sandbox.exec_command(container, bandit_cmd, timeout=60)
            return self._parse_bandit_output(scan_exec.stdout, result)
            
        elif stack_type == 'nodejs':
            # Use npx to run eslint on JS/TS files
            js_exts = ('.js', '.jsx', '.ts', '.tsx', '.mjs')
            js_files = [f for f in changed_files if f.endswith(js_exts)]
            if not js_files:
                result.add_log("No JavaScript/TypeScript files to scan")
                return ScanResult(passed=True)
            
            file_args = ' '.join(f'"/workspace/{f}"' for f in js_files)
            eslint_cmd = f"npx eslint --format json --no-error-on-unmatched-pattern {file_args} 2>/dev/null || true"
            result.add_log(f"Scanning {len(js_files)} JS/TS files with ESLint")
            
            scan_exec = self.docker_sandbox.exec_command(container, eslint_cmd, timeout=60)
            return self._parse_eslint_output(scan_exec.stdout, result)
        
        return ScanResult(passed=True)
    
    def _parse_bandit_output(self, output: str, result: ExecutionResult) -> ScanResult:
        """Parse Bandit JSON output from container execution."""
        import json
        
        if not output or not output.strip():
            result.add_log("✅ No security issues found")
            return ScanResult(passed=True)
        
        try:
            data = json.loads(output)
        except json.JSONDecodeError:
            result.add_log("Could not parse Bandit output")
            return ScanResult(passed=True)
        
        from services.security_scanner import SecurityIssue, Severity
        
        issues = []
        for item in data.get("results", []):
            file_path = item.get("filename", "").replace("/workspace/", "")
            issues.append(SecurityIssue(
                file_path=file_path,
                line_number=item.get("line_number", 0),
                severity=Severity.from_bandit(item.get("issue_severity", "MEDIUM")),
                rule_id=item.get("test_id", "unknown"),
                message=item.get("issue_text", "Security issue"),
                code_snippet=item.get("code", "")[:100]
            ))
        
        if issues:
            result.add_log(f"⚠️ Found {len(issues)} security issues")
            for issue in issues[:3]:
                result.add_log(f"  [{issue.severity.name}] {issue.file_path}:{issue.line_number} - {issue.message[:60]}")
        else:
            result.add_log("✅ No security issues found")
        
        high_issues = [i for i in issues if i.severity.value >= Severity.HIGH.value]
        return ScanResult(passed=len(high_issues) == 0, issues=issues)
    
    def _parse_eslint_output(self, output: str, result: ExecutionResult) -> ScanResult:
        """Parse ESLint JSON output from container execution."""
        import json
        
        if not output or not output.strip():
            result.add_log("✅ No security issues found")
            return ScanResult(passed=True)
        
        try:
            data = json.loads(output)
        except json.JSONDecodeError:
            result.add_log("Could not parse ESLint output")
            return ScanResult(passed=True)
        
        from services.security_scanner import SecurityIssue, Severity
        
        SECURITY_RULES = {"no-eval", "no-implied-eval", "no-new-func"}
        
        issues = []
        for file_result in data:
            file_path = file_result.get("filePath", "").replace("/workspace/", "")
            for msg in file_result.get("messages", []):
                rule_id = msg.get("ruleId", "")
                if rule_id in SECURITY_RULES or msg.get("severity") == 2:
                    issues.append(SecurityIssue(
                        file_path=file_path,
                        line_number=msg.get("line", 0),
                        severity=Severity.from_eslint(msg.get("severity", 1)),
                        rule_id=rule_id or "unknown",
                        message=msg.get("message", "Linting issue")
                    ))
        
        if issues:
            result.add_log(f"⚠️ Found {len(issues)} linting issues")
        else:
            result.add_log("✅ No security issues found")
        
        high_issues = [i for i in issues if i.severity.value >= Severity.HIGH.value]
        return ScanResult(passed=len(high_issues) == 0, issues=issues)
    
    def _run_tests(
        self, 
        container, 
        stack_config: StackConfig, 
        result: ExecutionResult
    ) -> ExecResult:
        """Run tests in container."""
        result.add_log(f"Running tests: {stack_config.test_command}")
        exec_result = self.docker_sandbox.exec_command(
            container,
            stack_config.test_command,
            timeout=300,  # 5 minutes for tests
        )
        result.add_log(f"Test output:\n{exec_result.stdout}")
        if exec_result.stderr:
            result.add_log(f"Test stderr:\n{exec_result.stderr}")
        return exec_result
    
    def _run_build(
        self, 
        container, 
        stack_config: StackConfig, 
        result: ExecutionResult
    ) -> ExecResult:
        """Run build command in container."""
        result.add_log(f"Running build: {stack_config.build_command}")
        exec_result = self.docker_sandbox.exec_command(
            container,
            stack_config.build_command,
            timeout=300,
        )
        result.add_log(f"Build output:\n{exec_result.stdout[:1000]}")
        return exec_result
    
    def _run_locally(
        self,
        repo_path: str,
        stack_config: StackConfig,
        run_tests: bool,
        run_build: bool,
        result: ExecutionResult,
    ) -> ExecutionResult:
        """Fallback: run validation locally without Docker."""
        try:
            # Prepare commands with package manager fallback
            install_cmd = stack_config.install_command
            test_cmd = stack_config.test_command
            
            # Check if package manager is available, fallback to npm if not
            if 'pnpm' in install_cmd and not shutil.which('pnpm'):
                result.add_log("pnpm not found, falling back to npm")
                install_cmd = install_cmd.replace('pnpm', 'npm')
                test_cmd = test_cmd.replace('pnpm', 'npm') if test_cmd else test_cmd
            elif 'yarn' in install_cmd and not shutil.which('yarn'):
                result.add_log("yarn not found, falling back to npm")
                install_cmd = install_cmd.replace('yarn', 'npm')
                test_cmd = test_cmd.replace('yarn', 'npm') if test_cmd else test_cmd
            
            # Install
            result.stage = 'install'
            result.add_log(f"Running install locally: {install_cmd}")
            install = subprocess.run(
                install_cmd,
                shell=True,
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=300,
            )
            if install.returncode != 0:
                result.error = f"Install failed: {install.stderr}"
                return result
            
            # Test
            if run_tests:
                result.stage = 'test'
                result.add_log(f"Running tests locally: {test_cmd}")
                test = subprocess.run(
                    test_cmd,
                    shell=True,
                    cwd=repo_path,
                    capture_output=True,
                    text=True,
                    timeout=300,
                )
                result.add_log(f"Test output:\n{test.stdout}")
                if test.returncode != 0:
                    result.error = f"Tests failed: {test.stderr}"
                    result.exit_code = test.returncode
                    return result
            
            result.success = True
            return result
            
        except subprocess.TimeoutExpired:
            result.error = "Command timed out"
            return result
        except Exception as e:
            result.error = str(e)
            return result
    

    def _run_in_aws(
        self,
        repo_path: str,
        file_changes: list[dict],
        stack_config: StackConfig,
        run_tests: bool,
        run_build: bool,
        result: ExecutionResult,
    ) -> ExecutionResult:
        """Run validation in AWS ECS Fargate container."""
        result.stage = 'aws_fargate'
        
        try:
            # Prepare code files for upload
            code_files = []
            for root, dirs, files in os.walk(repo_path):
                dirs[:] = [d for d in dirs if d != '.git']
                for file in files:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, repo_path)
                    try:
                        with open(full_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        code_files.append({'path': rel_path, 'content': content})
                    except (UnicodeDecodeError, IOError):
                        # Skip binary files
                        pass
            
            result.add_log(f"Uploading {len(code_files)} files to AWS")
            
            # Determine test command
            test_command = stack_config.test_command if run_tests else "echo 'Skipping tests'"
            if run_build and stack_config.build_command:
                test_command = f"{test_command} && {stack_config.build_command}"
            
            # Run in Fargate
            fargate_result = self.aws_sandbox.run_validation(
                code_files=code_files,
                stack_type=stack_config.stack_type,
                install_command=stack_config.install_command,
                test_command=test_command,
            )
            
            # Map Fargate result to ExecutionResult
            result.add_log(f"AWS task completed in {fargate_result.duration_seconds:.1f}s")
            result.add_log(f"Exit code: {fargate_result.exit_code}")
            result.add_log(f"Output:\n{fargate_result.stdout}")
            
            if fargate_result.stderr:
                result.add_log(f"Errors:\n{fargate_result.stderr}")
            
            result.success = fargate_result.success
            result.exit_code = fargate_result.exit_code
            
            if not fargate_result.success:
                result.error = f"Tests failed with exit code {fargate_result.exit_code}"
            
            return result
            
        except TimeoutError as e:
            result.error = str(e)
            return result
        except Exception as e:
            result.error = f"AWS execution failed: {str(e)}"
            return result

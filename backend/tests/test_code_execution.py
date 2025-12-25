"""
Tests for CodeExecutionService.
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from dataclasses import dataclass

from services.code_execution import CodeExecutionService, ExecutionResult, FileChange


class TestFileChange:
    def test_file_change_from_dict(self):
        """FileChange should work with dict input."""
        change = FileChange(
            file_path='src/main.py',
            new_content='print("hello")',
            reason='Add greeting'
        )
        assert change.file_path == 'src/main.py'


class TestExecutionResult:
    def test_add_log(self):
        """Should accumulate logs."""
        result = ExecutionResult(success=False, stage='init')
        result.add_log("Step 1")
        result.add_log("Step 2")
        
        assert len(result.logs) == 2
        assert "Step 1" in result.logs


class TestCodeExecutionService:
    def setup_method(self):
        self.service = CodeExecutionService()

    def test_init_with_custom_services(self):
        """Should accept custom stack detector and sandbox."""
        mock_detector = Mock()
        mock_sandbox = Mock()
        
        service = CodeExecutionService(
            stack_detector=mock_detector,
            docker_sandbox=mock_sandbox
        )
        
        assert service.stack_detector is mock_detector
        assert service.docker_sandbox is mock_sandbox

    def test_get_file_list(self, tmp_path):
        """Should list all files in repo."""
        # Create test structure
        (tmp_path / "src").mkdir()
        (tmp_path / "src" / "main.py").write_text("print('hi')")
        (tmp_path / "requirements.txt").write_text("pytest")
        (tmp_path / ".git").mkdir()
        (tmp_path / ".git" / "config").write_text("git config")
        
        files = self.service._get_file_list(str(tmp_path))
        
        assert "src/main.py" in files
        assert "requirements.txt" in files
        # .git should be excluded
        assert ".git/config" not in files

    def test_apply_change_creates_file(self, tmp_path):
        """Should create file with content."""
        change = FileChange(
            file_path='new_file.py',
            new_content='print("created")',
            reason='test'
        )
        
        self.service._apply_change(str(tmp_path), change)
        
        assert (tmp_path / "new_file.py").exists()
        assert (tmp_path / "new_file.py").read_text() == 'print("created")'

    def test_apply_change_creates_directories(self, tmp_path):
        """Should create parent directories."""
        change = FileChange(
            file_path='deep/nested/dir/file.py',
            new_content='content',
            reason='test'
        )
        
        self.service._apply_change(str(tmp_path), change)
        
        assert (tmp_path / "deep" / "nested" / "dir" / "file.py").exists()

    @patch('services.code_execution.subprocess.run')
    def test_clone_repo_success(self, mock_run):
        """Should return success on successful clone."""
        mock_run.return_value = Mock(returncode=0, stdout='', stderr='')
        
        result = self.service._clone_repo(
            'https://github.com/test/repo.git',
            'main',
            '/tmp/test'
        )
        
        assert result.success
        assert result.exit_code == 0

    @patch('services.code_execution.subprocess.run')
    def test_clone_repo_failure(self, mock_run):
        """Should return failure on clone error."""
        mock_run.return_value = Mock(
            returncode=1,
            stdout='',
            stderr='fatal: repository not found'
        )
        
        result = self.service._clone_repo(
            'https://github.com/test/nonexistent.git',
            'main',
            '/tmp/test'
        )
        
        assert not result.success
        assert 'repository not found' in result.stderr

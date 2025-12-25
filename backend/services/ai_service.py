import json
import os
from openai import OpenAI
from utils.logger import get_logger

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = os.environ.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-exp:free")

logger = get_logger(__name__)


class AIService:
    def __init__(self, api_key, model=None):
        self.client = OpenAI(
            api_key=api_key,
            base_url=OPENROUTER_BASE_URL
        )
        self.model = model or DEFAULT_MODEL
        logger.info("ai_service_initialized", model=self.model, base_url=OPENROUTER_BASE_URL)
        
    def analyze_issue_and_plan_changes(self, issue_title, issue_body, comment_body, codebase_files):
        logger.info(
            "analyzing_issue",
            issue_title=issue_title,
            comment_length=len(comment_body),
            codebase_files_count=len(codebase_files)
        )
        
        codebase_context = "\n\n".join([
            f"File: {file['path']}\n```\n{file['content'][:2000]}\n```"
            for file in codebase_files
        ])
        
        logger.debug("codebase_context_built", context_length=len(codebase_context))
        
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "edit_file",
                    "description": "Edit a file in the codebase with new content",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_path": {
                                "type": "string",
                                "description": "The path to the file to edit"
                            },
                            "new_content": {
                                "type": "string",
                                "description": "The complete new content for the file"
                            },
                            "reason": {
                                "type": "string",
                                "description": "Explanation of why this change is needed"
                            }
                        },
                        "required": ["file_path", "new_content", "reason"]
                    }
                }
            }
        ]
        
        system_prompt = """You are an expert software engineer. Analyze the GitHub issue and suggest code changes by calling the edit_file function.
        
Rules:
1. Only suggest changes that directly address the issue
2. Maintain code style and conventions from the existing codebase
3. Make minimal, focused changes
4. Provide complete file content in new_content, not just diffs
5. Call edit_file for each file that needs to be changed"""

        user_prompt = f"""GitHub Issue: {issue_title}

Issue Description:
{issue_body}

User Comment:
{comment_body}

Available Codebase Files:
{codebase_context}

Analyze this issue and determine what code changes are needed. Use the edit_file function to specify the exact changes."""

        logger.info("calling_llm", model=self.model, prompt_length=len(user_prompt))
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                tools=tools,
                tool_choice="auto"
            )
            
            message = response.choices[0].message
            
            logger.info(
                "llm_response_received",
                has_tool_calls=bool(message.tool_calls),
                tool_calls_count=len(message.tool_calls) if message.tool_calls else 0,
                content_length=len(message.content) if message.content else 0
            )
            
            file_changes = []
            if message.tool_calls:
                for tool_call in message.tool_calls:
                    if tool_call.function.name == "edit_file":
                        args = json.loads(tool_call.function.arguments)
                        file_path = args.get('file_path')
                        reason = args.get('reason')
                        
                        logger.info(
                            "file_change_suggested",
                            file_path=file_path,
                            reason=reason,
                            content_length=len(args.get('new_content', ''))
                        )
                        
                        file_changes.append({
                            'file_path': file_path,
                            'new_content': args.get('new_content'),
                            'reason': reason
                        })
            
            logger.info("analysis_complete", total_changes=len(file_changes))
            
            return {
                'file_changes': file_changes,
                'analysis': message.content or "AI suggested file changes via tool calls"
            }
            
        except Exception as e:
            logger.error("llm_call_failed", error=str(e), model=self.model)
            raise
    
    def fix_test_failures(self, original_changes, error_logs, codebase_files=None):
        """Analyze test failures and suggest fixes."""
        logger.info(
            "fixing_test_failures",
            original_changes_count=len(original_changes),
            error_logs_length=len(error_logs)
        )
        
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "edit_file",
                    "description": "Edit a file to fix the test failures",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_path": {
                                "type": "string",
                                "description": "The path to the file to edit"
                            },
                            "new_content": {
                                "type": "string",
                                "description": "The complete new content for the file"
                            },
                            "reason": {
                                "type": "string",
                                "description": "Explanation of the fix"
                            }
                        },
                        "required": ["file_path", "new_content", "reason"]
                    }
                }
            }
        ]
        
        changes_context = "\n\n".join([
            f"File: {c['file_path']}\n```\n{c['new_content'][:1500]}\n```"
            for c in original_changes
        ])
        
        system_prompt = """You are an expert at debugging test failures. Analyze the error logs and fix the code.

Rules:
1. Focus on the actual error, not unrelated changes
2. Maintain the original intent of the changes
3. Provide complete file content, not diffs"""

        user_prompt = f"""The following code changes were made, but tests failed.

Original Changes:
{changes_context}

Test Error Logs:
{error_logs[-3000:]}

Analyze the errors and provide fixed versions of the files using edit_file."""

        logger.info("calling_llm_for_fix", model=self.model)

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                tools=tools,
                tool_choice="auto"
            )
            
            message = response.choices[0].message
            
            file_changes = []
            if message.tool_calls:
                for tool_call in message.tool_calls:
                    if tool_call.function.name == "edit_file":
                        args = json.loads(tool_call.function.arguments)
                        file_path = args.get('file_path')
                        reason = args.get('reason', 'Fix test failure')
                        
                        logger.info("fix_suggested", file_path=file_path, reason=reason)
                        
                        file_changes.append({
                            'file_path': file_path,
                            'new_content': args.get('new_content'),
                            'reason': reason
                        })
            
            if file_changes:
                logger.info("fixes_complete", fixes_count=len(file_changes))
                return file_changes
            else:
                logger.warning("no_fixes_suggested", returning_original=True)
                return original_changes
                
        except Exception as e:
            logger.error("fix_call_failed", error=str(e))
            raise

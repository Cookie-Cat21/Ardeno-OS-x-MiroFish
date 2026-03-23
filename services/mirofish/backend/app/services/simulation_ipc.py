"""
Simulation IPC Communication Module
Used for inter-process communication between the Flask backend and simulation scripts.

Implements a simple command/response pattern via the filesystem:
1. Flask writes commands to the commands/ directory.
2. Simulation scripts poll the commands directory, execute commands, and write responses to the responses/ directory.
3. Flask polls the responses directory to retrieve results.
"""

import os
import json
import time
import uuid
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

from ..utils.logger import get_logger

logger = get_logger('mirofish.simulation_ipc')


class CommandType(str, Enum):
    """Command Types"""
    INTERVIEW = "interview"           # Single Agent interview
    BATCH_INTERVIEW = "batch_interview"  # Batch interview
    CLOSE_ENV = "close_env"           # Close environment


class CommandStatus(str, Enum):
    """Command Status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class IPCCommand:
    """IPC命令"""
    command_id: str
    command_type: CommandType
    args: Dict[str, Any]
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "command_id": self.command_id,
            "command_type": self.command_type.value,
            "args": self.args,
            "timestamp": self.timestamp
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'IPCCommand':
        return cls(
            command_id=data["command_id"],
            command_type=CommandType(data["command_type"]),
            args=data.get("args", {}),
            timestamp=data.get("timestamp", datetime.now().isoformat())
        )


@dataclass
class IPCResponse:
    """IPC响应"""
    command_id: str
    status: CommandStatus
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "command_id": self.command_id,
            "status": self.status.value,
            "result": self.result,
            "error": self.error,
            "timestamp": self.timestamp
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'IPCResponse':
        return cls(
            command_id=data["command_id"],
            status=CommandStatus(data["status"]),
            result=data.get("result"),
            error=data.get("error"),
            timestamp=data.get("timestamp", datetime.now().isoformat())
        )


class SimulationIPCClient:
    """
    Simulation IPC Client (Used on Flask side)
    
    Used to send commands to simulation processes and wait for responses.
    """
    
    def __init__(self, simulation_dir: str):
        """
        初始化IPC客户端
        
        Args:
            simulation_dir: 模拟数据目录
        """
        self.simulation_dir = simulation_dir
        self.commands_dir = os.path.join(simulation_dir, "ipc_commands")
        self.responses_dir = os.path.join(simulation_dir, "ipc_responses")
        
        # 确保目录存在
        os.makedirs(self.commands_dir, exist_ok=True)
        os.makedirs(self.responses_dir, exist_ok=True)
    
    def send_command(
        self,
        command_type: CommandType,
        args: Dict[str, Any],
        timeout: float = 60.0,
        poll_interval: float = 0.5
    ) -> IPCResponse:
        """
        Send command and wait for response
        
        Args:
            command_type: Command type
            args: Command arguments
            timeout: Timeout in seconds
            poll_interval: Polling interval in seconds
            
        Returns:
            IPCResponse
            
        Raises:
            TimeoutError: Wait for response timed out
        """
        command_id = str(uuid.uuid4())
        command = IPCCommand(
            command_id=command_id,
            command_type=command_type,
            args=args
        )
        
        # 写入命令文件
        command_file = os.path.join(self.commands_dir, f"{command_id}.json")
        with open(command_file, 'w', encoding='utf-8') as f:
            json.dump(command.to_dict(), f, ensure_ascii=False, indent=2)
        
        logger.info(f"发送IPC命令: {command_type.value}, command_id={command_id}")
        
        # 等待响应
        response_file = os.path.join(self.responses_dir, f"{command_id}.json")
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            if os.path.exists(response_file):
                try:
                    with open(response_file, 'r', encoding='utf-8') as f:
                        response_data = json.load(f)
                    response = IPCResponse.from_dict(response_data)
                    
                    # 清理命令和响应文件
                    try:
                        os.remove(command_file)
                        os.remove(response_file)
                    except OSError:
                        pass
                    
                    logger.info(f"收到IPC响应: command_id={command_id}, status={response.status.value}")
                    return response
                except (json.JSONDecodeError, KeyError) as e:
                    logger.warning(f"解析响应失败: {e}")
            
            time.sleep(poll_interval)
        
        # 超时
        logger.error(f"等待IPC响应超时: command_id={command_id}")
        
        # 清理命令文件
        try:
            os.remove(command_file)
        except OSError:
            pass
        
        raise TimeoutError(f"等待命令响应超时 ({timeout}秒)")
    
    def send_interview(
        self,
        agent_id: int,
        prompt: str,
        platform: str = None,
        timeout: float = 60.0
    ) -> IPCResponse:
        """
        Send single Agent interview command
        
        Args:
            agent_id: Agent ID
            prompt: Interview question
            platform: Specified platform (optional)
                - "twitter": Interview on Twitter only
                - "reddit": Interview on Reddit only  
                - None: Interview on both during dual-platform simulation, or the active single platform
            timeout: Timeout duration
            
        Returns:
            IPCResponse, result field contains interview results
        """
        args = {
            "agent_id": agent_id,
            "prompt": prompt
        }
        if platform:
            args["platform"] = platform
            
        return self.send_command(
            command_type=CommandType.INTERVIEW,
            args=args,
            timeout=timeout
        )
    
    def send_batch_interview(
        self,
        interviews: List[Dict[str, Any]],
        platform: str = None,
        timeout: float = 120.0
    ) -> IPCResponse:
        """
        Send batch interview command
        
        Args:
            interviews: Interview list, each item contains {"agent_id": int, "prompt": str, "platform": str(optional)}
            platform: Default platform (optional, overridden by individual platform settings)
                - "twitter": Default to Twitter only
                - "reddit": Default to Reddit only
                - None: Interview on both simultaneously for dual-platform simulations
            timeout: Timeout duration
            
        Returns:
            IPCResponse, result field contains all interview results
        """
        args = {"interviews": interviews}
        if platform:
            args["platform"] = platform
            
        return self.send_command(
            command_type=CommandType.BATCH_INTERVIEW,
            args=args,
            timeout=timeout
        )
    
    def send_close_env(self, timeout: float = 30.0) -> IPCResponse:
        """
        发送关闭环境命令
        
        Args:
            timeout: 超时时间
            
        Returns:
            IPCResponse
        """
        return self.send_command(
            command_type=CommandType.CLOSE_ENV,
            args={},
            timeout=timeout
        )
    
    def check_env_alive(self) -> bool:
        """
        检查模拟环境是否存活
        
        通过检查 env_status.json 文件来判断
        """
        status_file = os.path.join(self.simulation_dir, "env_status.json")
        if not os.path.exists(status_file):
            return False
        
        try:
            with open(status_file, 'r', encoding='utf-8') as f:
                status = json.load(f)
            return status.get("status") == "alive"
        except (json.JSONDecodeError, OSError):
            return False


class SimulationIPCServer:
    """
    Simulation IPC Server (Used on simulation script side)
    
    Polls commands directory, executes commands, and returns responses.
    """
    
    def __init__(self, simulation_dir: str):
        """
        初始化IPC服务器
        
        Args:
            simulation_dir: 模拟数据目录
        """
        self.simulation_dir = simulation_dir
        self.commands_dir = os.path.join(simulation_dir, "ipc_commands")
        self.responses_dir = os.path.join(simulation_dir, "ipc_responses")
        
        # 确保目录存在
        os.makedirs(self.commands_dir, exist_ok=True)
        os.makedirs(self.responses_dir, exist_ok=True)
        
        # 环境状态
        self._running = False
    
    def start(self):
        """标记服务器为运行状态"""
        self._running = True
        self._update_env_status("alive")
    
    def stop(self):
        """标记服务器为停止状态"""
        self._running = False
        self._update_env_status("stopped")
    
    def _update_env_status(self, status: str):
        """更新环境状态文件"""
        status_file = os.path.join(self.simulation_dir, "env_status.json")
        with open(status_file, 'w', encoding='utf-8') as f:
            json.dump({
                "status": status,
                "timestamp": datetime.now().isoformat()
            }, f, ensure_ascii=False, indent=2)
    
    def poll_commands(self) -> Optional[IPCCommand]:
        """
        Polls commands directory and returns the first pending command
        
        Returns:
            IPCCommand or None
        """
        if not os.path.exists(self.commands_dir):
            return None
        
        # 按时间排序获取命令文件
        command_files = []
        for filename in os.listdir(self.commands_dir):
            if filename.endswith('.json'):
                filepath = os.path.join(self.commands_dir, filename)
                command_files.append((filepath, os.path.getmtime(filepath)))
        
        command_files.sort(key=lambda x: x[1])
        
        for filepath, _ in command_files:
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                return IPCCommand.from_dict(data)
            except (json.JSONDecodeError, KeyError, OSError) as e:
                logger.warning(f"读取命令文件失败: {filepath}, {e}")
                continue
        
        return None
    
    def send_response(self, response: IPCResponse):
        """
        发送响应
        
        Args:
            response: IPC响应
        """
        response_file = os.path.join(self.responses_dir, f"{response.command_id}.json")
        with open(response_file, 'w', encoding='utf-8') as f:
            json.dump(response.to_dict(), f, ensure_ascii=False, indent=2)
        
        # 删除命令文件
        command_file = os.path.join(self.commands_dir, f"{response.command_id}.json")
        try:
            os.remove(command_file)
        except OSError:
            pass
    
    def send_success(self, command_id: str, result: Dict[str, Any]):
        """发送成功响应"""
        self.send_response(IPCResponse(
            command_id=command_id,
            status=CommandStatus.COMPLETED,
            result=result
        ))
    
    def send_error(self, command_id: str, error: str):
        """发送错误响应"""
        self.send_response(IPCResponse(
            command_id=command_id,
            status=CommandStatus.FAILED,
            error=error
        ))

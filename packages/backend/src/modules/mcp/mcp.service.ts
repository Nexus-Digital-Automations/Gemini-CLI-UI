import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { spawn, type ChildProcess } from 'child_process';
import type {
  GeminiMCPConfig,
  MCPServer,
  MCPServerWithStatus,
  MCPServerStatus,
} from '@gemini-ui/shared';

/**
 * MCP Service handles MCP server configuration and process management
 */

// Track running MCP server processes
const runningProcesses = new Map<string, ChildProcess>();

/**
 * Get path to ~/.gemini.json config file
 */
function getConfigPath(): string {
  return path.join(os.homedir(), '.gemini.json');
}

/**
 * Read Gemini CLI config file
 */
export async function getConfig(): Promise<GeminiMCPConfig> {
  try {
    const configPath = getConfigPath();
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // If file doesn't exist, return empty config
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

/**
 * Save Gemini CLI config file
 */
export async function saveConfig(config: GeminiMCPConfig): Promise<void> {
  const configPath = getConfigPath();
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * List all MCP servers (global + project-specific)
 */
export async function listServers(
  projectPath?: string
): Promise<MCPServerWithStatus[]> {
  const config = await getConfig();
  const servers: MCPServerWithStatus[] = [];

  // Add global servers
  if (config.mcpServers) {
    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      servers.push({
        name,
        ...serverConfig,
        scope: 'global',
        status: getServerStatus(name),
      });
    }
  }

  // Add project-specific servers if projectPath provided
  if (projectPath && config.geminiProjects?.[projectPath]?.mcpServers) {
    for (const [name, serverConfig] of Object.entries(
      config.geminiProjects[projectPath].mcpServers
    )) {
      servers.push({
        name,
        ...serverConfig,
        scope: 'project',
        status: getServerStatus(name),
      });
    }
  }

  return servers;
}

/**
 * Get a specific MCP server
 */
export async function getServer(
  name: string,
  projectPath?: string
): Promise<MCPServerWithStatus | null> {
  const servers = await listServers(projectPath);
  return servers.find((s) => s.name === name) || null;
}

/**
 * Add or update an MCP server
 */
export async function addServer(
  server: MCPServer,
  projectPath?: string
): Promise<void> {
  const config = await getConfig();

  // Remove scope from server config (it's determined by projectPath)
  const { name, scope: _scope, ...serverConfig } = server;

  if (projectPath) {
    // Add to project-specific servers
    if (!config.geminiProjects) {
      config.geminiProjects = {};
    }
    if (!config.geminiProjects[projectPath]) {
      config.geminiProjects[projectPath] = {};
    }
    if (!config.geminiProjects[projectPath].mcpServers) {
      config.geminiProjects[projectPath].mcpServers = {};
    }
    config.geminiProjects[projectPath].mcpServers[name] = serverConfig;
  } else {
    // Add to global servers
    if (!config.mcpServers) {
      config.mcpServers = {};
    }
    config.mcpServers[name] = serverConfig;
  }

  await saveConfig(config);
}

/**
 * Remove an MCP server
 */
export async function removeServer(
  name: string,
  projectPath?: string
): Promise<void> {
  // Stop the server if it's running
  stopServer(name);

  const config = await getConfig();

  if (projectPath && config.geminiProjects?.[projectPath]?.mcpServers) {
    delete config.geminiProjects[projectPath].mcpServers[name];
  } else if (config.mcpServers) {
    delete config.mcpServers[name];
  }

  await saveConfig(config);
}

/**
 * Get status of a running MCP server process
 */
function getServerStatus(name: string): MCPServerStatus {
  const process = runningProcesses.get(name);

  if (!process) {
    return 'stopped';
  }

  if (process.killed || process.exitCode !== null) {
    return 'stopped';
  }

  return 'running';
}

/**
 * Start an MCP server process (stdio only)
 */
export function startServer(name: string, server: MCPServer): void {
  // Only stdio transport can be hosted
  if (server.transport !== 'stdio') {
    throw new Error('Only stdio transport servers can be started');
  }

  if (!server.command) {
    throw new Error('Command is required for stdio transport');
  }

  // Check if already running
  if (getServerStatus(name) === 'running') {
    throw new Error(`Server '${name}' is already running`);
  }

  // Spawn the process
  const childProcess = spawn(server.command, server.args || [], {
    env: { ...process.env, ...server.env },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Store the process
  runningProcesses.set(name, childProcess);

  // Handle process exit
  childProcess.on('exit', (code: number | null) => {
    console.log(`MCP server '${name}' exited with code ${code}`);
    runningProcesses.delete(name);
  });

  // Handle errors
  childProcess.on('error', (error: Error) => {
    console.error(`MCP server '${name}' error:`, error);
    runningProcesses.delete(name);
  });
}

/**
 * Stop an MCP server process
 */
export function stopServer(name: string): void {
  const process = runningProcesses.get(name);

  if (!process) {
    return;
  }

  process.kill('SIGTERM');
  runningProcesses.delete(name);
}

/**
 * Get server process status details
 */
export function getServerProcessStatus(name: string): {
  status: MCPServerStatus;
  pid?: number;
  uptime?: number;
} {
  const process = runningProcesses.get(name);

  if (!process) {
    return { status: 'stopped' };
  }

  if (process.killed || process.exitCode !== null) {
    return { status: 'stopped' };
  }

  return {
    status: 'running',
    pid: process.pid,
  };
}

/**
 * MCP (Model Context Protocol) types for Gemini CLI integration
 */

export type MCPTransport = 'stdio' | 'sse' | 'http';
export type MCPScope = 'global' | 'project';
export type MCPServerStatus = 'running' | 'stopped' | 'error' | 'unknown';

/**
 * MCP Server configuration
 */
export interface MCPServer {
  name: string;
  transport: MCPTransport;
  command?: string; // For stdio (e.g., 'node', 'python', 'npx')
  args?: string[]; // For stdio command arguments
  url?: string; // For SSE/HTTP
  env?: Record<string, string>; // Environment variables
  enabled: boolean;
  scope: MCPScope; // Where the config is stored (global or project-specific)
}

/**
 * MCP Server with runtime status
 */
export interface MCPServerWithStatus extends MCPServer {
  status: MCPServerStatus;
  pid?: number; // Process ID if running
  error?: string; // Error message if status is 'error'
}

/**
 * Gemini CLI MCP configuration structure (~/.gemini.json)
 */
export interface GeminiMCPConfig {
  mcpServers?: Record<string, Omit<MCPServer, 'name' | 'scope'>>;
  geminiProjects?: Record<
    string,
    {
      mcpServers?: Record<string, Omit<MCPServer, 'name' | 'scope'>>;
    }
  >;
}

/**
 * Request to add/update an MCP server
 */
export interface MCPServerRequest {
  name: string;
  transport: MCPTransport;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  enabled: boolean;
  projectPath?: string; // If omitted, server is global
}

/**
 * Response for MCP server operations
 */
export interface MCPServerResponse {
  server: MCPServerWithStatus;
}

/**
 * Response for listing MCP servers
 */
export interface MCPServerListResponse {
  servers: MCPServerWithStatus[];
}

/**
 * MCP server process status response
 */
export interface MCPServerStatusResponse {
  name: string;
  status: MCPServerStatus;
  pid?: number;
  uptime?: number; // Seconds since process started
  error?: string;
}

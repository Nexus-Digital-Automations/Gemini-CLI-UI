import type { Request, Response } from 'express';
import * as mcpService from './mcp.service.js';
import type { MCPServer } from '@gemini-ui/shared';

/**
 * GET /api/mcp/servers
 * List all MCP servers
 */
export async function listServers(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { projectPath } = req.query;
    const servers = await mcpService.listServers(
      projectPath as string | undefined
    );

    res.json({
      success: true,
      data: { servers },
    });
  } catch (error) {
    console.error('Failed to list MCP servers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list MCP servers',
    });
  }
}

/**
 * GET /api/mcp/servers/:name
 * Get a specific MCP server
 */
export async function getServer(req: Request, res: Response): Promise<void> {
  try {
    const name = Array.isArray(req.params.name)
      ? req.params.name[0]
      : req.params.name;
    const { projectPath } = req.query;

    const server = await mcpService.getServer(
      name,
      projectPath as string | undefined
    );

    if (!server) {
      res.status(404).json({
        success: false,
        error: `Server '${name}' not found`,
      });
      return;
    }

    res.json({
      success: true,
      data: { server },
    });
  } catch (error) {
    console.error('Failed to get MCP server:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get MCP server',
    });
  }
}

/**
 * POST /api/mcp/servers
 * Add a new MCP server
 */
export async function addServer(req: Request, res: Response): Promise<void> {
  try {
    const { projectPath, ...serverData } = req.body;

    // Validate required fields
    if (!serverData.name || !serverData.transport) {
      res.status(400).json({
        success: false,
        error: 'Name and transport are required',
      });
      return;
    }

    // Validate stdio servers have command
    if (serverData.transport === 'stdio' && !serverData.command) {
      res.status(400).json({
        success: false,
        error: 'Command is required for stdio transport',
      });
      return;
    }

    // Validate SSE/HTTP servers have URL
    if (
      (serverData.transport === 'sse' || serverData.transport === 'http') &&
      !serverData.url
    ) {
      res.status(400).json({
        success: false,
        error: 'URL is required for SSE/HTTP transport',
      });
      return;
    }

    const server: MCPServer = {
      name: serverData.name,
      transport: serverData.transport,
      command: serverData.command,
      args: serverData.args,
      url: serverData.url,
      env: serverData.env,
      enabled: serverData.enabled ?? true,
      scope: projectPath ? 'project' : 'global',
    };

    await mcpService.addServer(server, projectPath);

    // Get the added server with status
    const addedServer = await mcpService.getServer(server.name, projectPath);

    res.status(201).json({
      success: true,
      data: { server: addedServer },
    });
  } catch (error) {
    console.error('Failed to add MCP server:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add MCP server',
    });
  }
}

/**
 * PUT /api/mcp/servers/:name
 * Update an MCP server
 */
export async function updateServer(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const name = Array.isArray(req.params.name)
      ? req.params.name[0]
      : req.params.name;
    const { projectPath, ...updates } = req.body;

    // Get existing server
    const existing = await mcpService.getServer(
      name,
      projectPath as string | undefined
    );

    if (!existing) {
      res.status(404).json({
        success: false,
        error: `Server '${name}' not found`,
      });
      return;
    }

    // Merge updates
    const updatedServer: MCPServer = {
      ...existing,
      ...updates,
      name, // Don't allow renaming via update
    };

    await mcpService.addServer(updatedServer, projectPath);

    // Get the updated server with status
    const server = await mcpService.getServer(name, projectPath);

    res.json({
      success: true,
      data: { server },
    });
  } catch (error) {
    console.error('Failed to update MCP server:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update MCP server',
    });
  }
}

/**
 * DELETE /api/mcp/servers/:name
 * Remove an MCP server
 */
export async function deleteServer(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const name = Array.isArray(req.params.name)
      ? req.params.name[0]
      : req.params.name;
    const { projectPath } = req.query;

    await mcpService.removeServer(name, projectPath as string | undefined);

    res.json({
      success: true,
      message: `Server '${name}' removed`,
    });
  } catch (error) {
    console.error('Failed to delete MCP server:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete MCP server',
    });
  }
}

/**
 * POST /api/mcp/servers/:name/start
 * Start an MCP server process
 */
export async function startServer(req: Request, res: Response): Promise<void> {
  try {
    const name = Array.isArray(req.params.name)
      ? req.params.name[0]
      : req.params.name;
    const { projectPath } = req.query;

    const server = await mcpService.getServer(
      name,
      projectPath as string | undefined
    );

    if (!server) {
      res.status(404).json({
        success: false,
        error: `Server '${name}' not found`,
      });
      return;
    }

    mcpService.startServer(name, server);

    res.json({
      success: true,
      message: `Server '${name}' started`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to start MCP server';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

/**
 * POST /api/mcp/servers/:name/stop
 * Stop an MCP server process
 */
export async function stopServer(req: Request, res: Response): Promise<void> {
  try {
    const name = Array.isArray(req.params.name)
      ? req.params.name[0]
      : req.params.name;

    mcpService.stopServer(name);

    res.json({
      success: true,
      message: `Server '${name}' stopped`,
    });
  } catch (error) {
    console.error('Failed to stop MCP server:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop MCP server',
    });
  }
}

/**
 * GET /api/mcp/servers/:name/status
 * Get MCP server process status
 */
export async function getServerStatus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const name = Array.isArray(req.params.name)
      ? req.params.name[0]
      : req.params.name;

    const status = mcpService.getServerProcessStatus(name);

    res.json({
      success: true,
      data: {
        name,
        ...status,
      },
    });
  } catch (error) {
    console.error('Failed to get MCP server status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get MCP server status',
    });
  }
}

/**
 * GET /api/mcp/config
 * Get full ~/.gemini.json config
 */
export async function getConfig(_req: Request, res: Response): Promise<void> {
  try {
    const config = await mcpService.getConfig();

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Failed to get MCP config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get MCP config',
    });
  }
}

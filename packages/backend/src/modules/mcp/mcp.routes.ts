import { Router } from 'express';
import * as controller from './mcp.controller.js';

const router = Router();

/**
 * GET /api/mcp/config
 * Get full ~/.gemini.json config
 */
router.get('/config', controller.getConfig);

/**
 * GET /api/mcp/servers
 * List all MCP servers
 */
router.get('/servers', controller.listServers);

/**
 * GET /api/mcp/servers/:name
 * Get a specific MCP server
 */
router.get('/servers/:name', controller.getServer);

/**
 * POST /api/mcp/servers
 * Add a new MCP server
 */
router.post('/servers', controller.addServer);

/**
 * PUT /api/mcp/servers/:name
 * Update an MCP server
 */
router.put('/servers/:name', controller.updateServer);

/**
 * DELETE /api/mcp/servers/:name
 * Remove an MCP server
 */
router.delete('/servers/:name', controller.deleteServer);

/**
 * POST /api/mcp/servers/:name/start
 * Start an MCP server process
 */
router.post('/servers/:name/start', controller.startServer);

/**
 * POST /api/mcp/servers/:name/stop
 * Stop an MCP server process
 */
router.post('/servers/:name/stop', controller.stopServer);

/**
 * GET /api/mcp/servers/:name/status
 * Get MCP server process status
 */
router.get('/servers/:name/status', controller.getServerStatus);

export default router;

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  MCPServerWithStatus,
  MCPServerRequest,
  MCPServerListResponse,
} from '@gemini-ui/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4010';

/**
 * Fetch all MCP servers
 */
async function fetchMCPServers(
  projectPath?: string
): Promise<MCPServerListResponse> {
  const url = new URL(`${API_BASE_URL}/api/mcp/servers`);
  if (projectPath) {
    url.searchParams.set('projectPath', projectPath);
  }

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch MCP servers');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Add an MCP server
 */
async function addMCPServer(
  server: MCPServerRequest
): Promise<MCPServerWithStatus> {
  const response = await fetch(`${API_BASE_URL}/api/mcp/servers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(server),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add MCP server');
  }

  const data = await response.json();
  return data.data.server;
}

/**
 * Update an MCP server
 */
async function updateMCPServer(params: {
  name: string;
  updates: Partial<MCPServerRequest>;
  projectPath?: string;
}): Promise<MCPServerWithStatus> {
  const response = await fetch(
    `${API_BASE_URL}/api/mcp/servers/${params.name}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        ...params.updates,
        projectPath: params.projectPath,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update MCP server');
  }

  const data = await response.json();
  return data.data.server;
}

/**
 * Delete an MCP server
 */
async function deleteMCPServer(params: {
  name: string;
  projectPath?: string;
}): Promise<void> {
  const url = new URL(`${API_BASE_URL}/api/mcp/servers/${params.name}`);
  if (params.projectPath) {
    url.searchParams.set('projectPath', params.projectPath);
  }

  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete MCP server');
  }
}

/**
 * Start an MCP server
 */
async function startMCPServer(name: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/mcp/servers/${name}/start`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start MCP server');
  }
}

/**
 * Stop an MCP server
 */
async function stopMCPServer(name: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/mcp/servers/${name}/stop`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to stop MCP server');
  }
}

/**
 * Hook to fetch all MCP servers
 */
export function useListMCPServers(projectPath?: string) {
  return useQuery({
    queryKey: ['mcp', 'servers', projectPath],
    queryFn: () => fetchMCPServers(projectPath),
  });
}

/**
 * Hook to add an MCP server
 */
export function useAddMCPServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addMCPServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp', 'servers'] });
    },
  });
}

/**
 * Hook to update an MCP server
 */
export function useUpdateMCPServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMCPServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp', 'servers'] });
    },
  });
}

/**
 * Hook to delete an MCP server
 */
export function useDeleteMCPServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMCPServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp', 'servers'] });
    },
  });
}

/**
 * Hook to start an MCP server
 */
export function useStartServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startMCPServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp', 'servers'] });
    },
  });
}

/**
 * Hook to stop an MCP server
 */
export function useStopServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: stopMCPServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp', 'servers'] });
    },
  });
}

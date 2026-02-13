import { useState } from 'react';
import { useListMCPServers, useAddMCPServer, useStartServer, useStopServer, useDeleteMCPServer } from '../features/mcp/hooks/useMCPServers';
import type { MCPServerRequest } from '@gemini-ui/shared';

export function SettingsPage() {
  const [showAddServer, setShowAddServer] = useState(false);
  const { data: serversData, isLoading } = useListMCPServers();
  const addServerMutation = useAddMCPServer();
  const startServerMutation = useStartServer();
  const stopServerMutation = useStopServer();
  const deleteServerMutation = useDeleteMCPServer();

  const [newServer, setNewServer] = useState<MCPServerRequest>({
    name: '',
    transport: 'stdio',
    command: 'npx',
    args: [],
    enabled: true,
  });

  const handleAddServer = async () => {
    if (!newServer.name || !newServer.command) {
      alert('Name and command are required');
      return;
    }

    try {
      await addServerMutation.mutateAsync(newServer);
      setShowAddServer(false);
      setNewServer({
        name: '',
        transport: 'stdio',
        command: 'npx',
        args: [],
        enabled: true,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add server');
    }
  };

  const servers = serversData?.servers || [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">MCP Server Settings</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage Model Context Protocol servers for Gemini CLI
            </p>
          </div>
          <button
            onClick={() => setShowAddServer(!showAddServer)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showAddServer ? 'Cancel' : '+ Add Server'}
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            ✨ <strong>New Feature!</strong> Full MCP server management:
          </p>
          <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
            <li>Add/remove servers that save to ~/.gemini.json</li>
            <li>Start/stop stdio MCP server processes</li>
            <li>Global and project-specific server scopes</li>
          </ul>
        </div>

        {showAddServer && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Add MCP Server</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Server Name
                </label>
                <input
                  type="text"
                  value={newServer.name}
                  onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                  placeholder="filesystem"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transport
                </label>
                <select
                  value={newServer.transport}
                  onChange={(e) => setNewServer({ ...newServer, transport: e.target.value as 'stdio' | 'sse' | 'http' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="stdio">stdio (can be started/stopped)</option>
                  <option value="sse">SSE (external)</option>
                  <option value="http">HTTP (external)</option>
                </select>
              </div>

              {newServer.transport === 'stdio' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Command
                    </label>
                    <input
                      type="text"
                      value={newServer.command}
                      onChange={(e) => setNewServer({ ...newServer, command: e.target.value })}
                      placeholder="npx"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Arguments (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newServer.args?.join(', ') || ''}
                      onChange={(e) => setNewServer({ ...newServer, args: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      placeholder="-y, @modelcontextprotocol/server-filesystem, /Users/username"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleAddServer}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add Server
              </button>
            </div>
          </div>
        )}

        {/* Servers List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading servers...</div>
        ) : servers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No MCP servers configured</p>
            <p className="text-sm mt-2">Click "Add Server" to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {servers.map((server) => (
              <div
                key={server.name}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{server.name}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        server.status === 'running' ? 'bg-green-100 text-green-700' :
                        server.status === 'stopped' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {server.status}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                        {server.transport}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                        {server.scope}
                      </span>
                    </div>

                    {server.command && (
                      <p className="text-sm text-gray-600 mt-1">
                        <code className="bg-gray-100 px-2 py-0.5 rounded">
                          {server.command} {server.args?.join(' ')}
                        </code>
                      </p>
                    )}

                    {server.url && (
                      <p className="text-sm text-gray-600 mt-1">{server.url}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {server.transport === 'stdio' && (
                      <>
                        {server.status === 'running' ? (
                          <button
                            onClick={() => stopServerMutation.mutate(server.name)}
                            className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                          >
                            Stop
                          </button>
                        ) : (
                          <button
                            onClick={() => startServerMutation.mutate(server.name)}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Start
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Delete server "${server.name}"?`)) {
                          deleteServerMutation.mutate({ name: server.name });
                        }
                      }}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

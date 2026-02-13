import { useState } from 'react';
import { ModelSelector } from '../features/chat/components/ModelSelector';

export function ChatPage() {
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');

    // TODO: Send to backend Gemini API
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Response using ${selectedModel} (integration pending)`,
        },
      ]);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header with Model Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Chat with Gemini</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Model
          </label>
          <ModelSelector
            value={selectedModel}
            onChange={setSelectedModel}
            className="max-w-md"
          />
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            ✨ <strong>New Feature!</strong> You can now select from all available Gemini models including:
          </p>
          <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
            <li>Gemini 3 Preview (Pro & Flash)</li>
            <li>Gemini 2.5 (Pro, Flash, Flash Lite, with TTS variants)</li>
            <li>Gemini 2.0 Flash (deprecated, sunset March 31, 2026)</li>
          </ul>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4 min-h-[400px] max-h-[600px] overflow-y-auto mb-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg">Start a conversation with Gemini!</p>
              <p className="text-sm mt-2">Select a model above and type your message below.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

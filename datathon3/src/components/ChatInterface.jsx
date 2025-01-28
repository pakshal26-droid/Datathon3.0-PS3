import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Minimize2, Maximize2, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const messagesEndRef = useRef(null);
  const userId = useRef('user-' + Math.random().toString(36).substr(2, 9));
const navigate = useNavigate();
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleActionClick = async (action) => {
    switch (action) {
      case "Create Support Ticket":
        // Navigate to ticket form
        setIsMinimized(true);
        navigate('/');
        break;
        
      case "View Documentation":
        // Open documentation in new tab
        window.open('https://motivitylabs.com', '_blank');
        // Add bot response confirming action
        setMessages(prev => [...prev, {
          type: 'bot',
          content: 'I\'ve opened our documentation in a new tab for you. Is there anything specific you\'d like to know about?'
        }]);
        break;

      default:
        // For any other actions, create a bot response
        setMessages(prev => [...prev, {
          type: 'bot',
          content: `I'll help you with "${action}". Please let me know what specific assistance you need.`
        }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    
    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/chat/', {
        user_id: userId.current,
        message: userMessage
      });

      setMessages(prev => [
        ...prev, 
        { 
          type: 'bot', 
          content: response.data.response,
          actions: response.data.suggested_actions 
        }
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    }
    setLoading(false);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-full shadow-xl border border-gray-200 p-4 cursor-pointer"
           onClick={() => setIsMinimized(false)}>
        <div className="relative">
          <MessageCircle size={24} className="text-blue-500" />
          {messages.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {messages.length}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Support Chat</h3>
        <button 
          onClick={() => setIsMinimized(true)}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <Minimize2 size={20} />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${
              message.type === 'user' 
                ? 'bg-blue-500 text-white rounded-br-none' 
                : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }`}>
              <p>{message.content}</p>
              {message.actions && message.actions.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.actions.map((action, idx) => (
                    <button
                      key={idx}
                      className="block w-full text-sm text-left px-2 py-1 hover:bg-gray-200 rounded"
                      onClick={() => handleActionClick(action)}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 p-3 rounded-lg rounded-bl-none">
              Typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import io from 'socket.io-client';
import { apiClient } from '../apiClient';

const Chat = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const data = await apiClient.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const data = await apiClient.getMessages(userId);
      setMessages(data.map(msg => ({
        id: msg.id,
        from_user_id: msg.from_user_id,
        to_user_id: msg.to_user_id,
        text: msg.message,
        timestamp: new Date(msg.created_at),
        sender: msg.from_user
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (isOpen && !socket) {
      const token = localStorage.getItem('token');
      if (token) {
        const newSocket = io('http://localhost:3000', {
          auth: { token }
        });

        newSocket.on('connect', () => {
          console.log('Connected to chat server');
          setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
          console.log('Disconnected from chat server');
          setIsConnected(false);
        });

        newSocket.on('private_message', (message) => {
          setMessages(prev => [...prev, {
            id: message.id,
            from_user_id: message.from_user_id,
            to_user_id: message.to_user_id,
            text: message.message,
            timestamp: new Date(message.created_at),
            sender: message.sender
          }]);
        });

        newSocket.on('message_sent', (data) => {
          console.log('Message sent confirmation:', data);
        });

        setSocket(newSocket);
      }
    }

    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [isOpen, socket]);

  // Load conversations when chat opens
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim() && selectedConversation && socket) {
      socket.emit('private_message', {
        to_user_id: selectedConversation.id,
        message: inputValue.trim()
      });
      setInputValue('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <h3 className="font-semibold">
            {selectedConversation ? `Chat con ${selectedConversation.full_name}` : 'Seleccionar Conversación'}
          </h3>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
        </div>
        <button
          onClick={onClose}
          className="hover:bg-blue-800 p-1 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Conversations List or Messages */}
      {!selectedConversation ? (
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Conversaciones</h4>
          {conversations.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay conversaciones disponibles</p>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors mb-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {conversation.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{conversation.full_name}</p>
                    <p className="text-xs text-gray-500">{conversation.role}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            <button
              onClick={() => setSelectedConversation(null)}
              className="text-blue-600 hover:text-blue-800 text-sm mb-2"
            >
              ← Volver a conversaciones
            </button>
            {messages.map((message) => {
              const isFromCurrentUser = message.from_user_id === JSON.parse(localStorage.getItem('user') || '{}').id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      isFromCurrentUser
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!isConnected || !inputValue.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default Chat;

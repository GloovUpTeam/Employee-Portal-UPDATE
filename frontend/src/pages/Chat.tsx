import React, { useState, useRef, useEffect } from 'react';
import { Send, Phone, Video, Paperclip, MoreVertical, Search, File as FileIcon, X, Users } from 'lucide-react';
import { ChatMessage, ChatAttachment, Profile } from '../types';
import { getAllProfiles, getProfile } from '../services/profileService';
import { supabase } from '../config/supabaseClient';
import { getMessages, sendMessage, subscribeToMessages } from '../services/chatService';

import { useAuth } from '../context/AuthContext';

const Chat: React.FC = () => {
  const [activeChat, setActiveChat] = useState<string | null>('team'); // 'team' or userId
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  // Use global auth context instead of local state
  const { user: currentUser } = useAuth();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        // Fetch team members
        const profiles = await getAllProfiles();
        setTeamMembers(profiles);
      } catch (err) {
        console.error('Error fetching chat data:', err);
      }
    };

    fetchTeamData();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const loadMessages = async () => {
      const receiverId = activeChat === 'team' ? null : activeChat;
      const msgs = await getMessages(currentUser.id, receiverId);
      setMessages(msgs);
    };

    loadMessages();

    const subscription = subscribeToMessages((newMsg) => {
      // Check if the message belongs to the current chat
      const isTeamChat = activeChat === 'team';
      const isRelevant = isTeamChat
        ? !newMsg.receiverId // Public message
        : (newMsg.senderId === activeChat || (newMsg.senderId === currentUser.id && newMsg.receiverId === activeChat)); // DM

      // Note: The subscription logic in chatService might need adjustment to filter by receiver, 
      // but for now we filter on client side or re-fetch.
      // Actually, the simple subscription returns all inserts. 
      // We should ideally filter in the subscription or here.
      // Let's just reload for simplicity or append if it matches.

      // Simple append if it matches context
      // But wait, the `subscribeToMessages` in service doesn't return receiver_id in the payload unless we select it.
      // The payload.new contains the raw table row.

      // Let's just re-fetch to be safe and consistent
      loadMessages();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [activeChat, currentUser]);

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newAttachments: ChatAttachment[] = (Array.from(e.target.files) as File[]).map(file => ({
        id: Math.random().toString(36).slice(2, 11),
        name: file.name,
        type: file.type,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        url: URL.createObjectURL(file) // Create temporary local URL
      }));
      setPendingAttachments(prev => [...prev, ...newAttachments]);
    }
    // Clear input so selecting same file again works
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingAttachment = (id: string) => {
    setPendingAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && pendingAttachments.length === 0) || !currentUser) return;

    const receiverId = activeChat === 'team' ? null : activeChat;

    // Optimistic update
    const tempId = Math.random().toString(36).slice(2);
    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderId: currentUser.id,
      content: inputText,
      createdAt: new Date().toISOString(),
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
      sender: currentUser
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setInputText('');
    setPendingAttachments([]);

    const sentMsg = await sendMessage(optimisticMsg.content, currentUser.id, receiverId);

    if (sentMsg) {
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => m.id === tempId ? sentMsg : m));
    } else {
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert('Failed to send message');
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-[#222] border border-gray-800 rounded-xl overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-800 bg-[#1a1a1a] flex flex-col hidden md:flex">
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search team..."
              className="w-full bg-[#111] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-[#1DCD9C] outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Channels</h3>
            <button
              onClick={() => setActiveChat('team')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-4 ${activeChat === 'team' ? 'bg-[#1DCD9C]/10 text-[#1DCD9C]' : 'text-gray-200 hover:bg-white/5'}`}
            >
              <div className="w-8 h-8 rounded-full bg-[#1DCD9C]/20 flex items-center justify-center text-[#1DCD9C]">
                <Users size={16} />
              </div>
              <span className="font-medium">Team Chat</span>
            </button>

            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Direct Messages</h3>
            {teamMembers.filter(u => u.id !== currentUser?.id).map(user => (
              <button
                key={user.id}
                onClick={() => setActiveChat(user.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 ${activeChat === user.id ? 'bg-[#1DCD9C]/10' : 'hover:bg-white/5'}`}
              >
                <div className="relative">
                  <img src={user.avatar_url || 'https://via.placeholder.com/32'} alt="" className="w-8 h-8 rounded-full" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#1a1a1a] rounded-full"></span>
                </div>
                <div className="text-left">
                  <p className={`font-medium ${activeChat === user.id ? 'text-[#1DCD9C]' : 'text-gray-200'}`}>{user.full_name}</p>
                  <p className="text-xs text-gray-500 truncate w-32">{user.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#222]">
        {/* Header */}
        <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-[#222]">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-lg">
              {activeChat === 'team' ? 'Team Chat' : teamMembers.find(u => u.id === activeChat)?.full_name || 'Chat'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <button className="hover:text-white"><Phone size={20} /></button>
            <button className="hover:text-white"><Video size={20} /></button>
            <button className="hover:text-white"><MoreVertical size={20} /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => {
            const isMe = currentUser && msg.senderId === currentUser.id;
            return (
              <div key={idx} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                <img
                  src={msg.sender?.avatar_url || 'https://via.placeholder.com/32'}
                  alt=""
                  className="w-8 h-8 rounded-full mt-1"
                />
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-300">{msg.sender?.full_name || 'Unknown'}</span>
                    <span className="text-xs text-gray-500">{msg.timestamp}</span>
                  </div>
                  <div className={`p-3 rounded-2xl ${isMe
                      ? 'bg-[#1DCD9C] text-black rounded-tr-none'
                      : 'bg-[#333] text-gray-200 rounded-tl-none'
                    }`}>
                    <p>{msg.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#222] border-t border-gray-800">

          {/* Pending Attachments */}
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 px-1">
              {pendingAttachments.map(att => (
                <div key={att.id} className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-2 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="p-1.5 bg-[#222] rounded text-gray-400">
                    <FileIcon size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-200 font-medium max-w-[150px] truncate">{att.fileName}</span>
                    <span className="text-[10px] text-gray-500">{(att.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                  <button
                    onClick={() => removePendingAttachment(att.id)}
                    className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors text-gray-500 ml-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="bg-[#111] border border-gray-700 rounded-lg flex items-center px-4 py-2 gap-3 focus-within:border-[#1DCD9C] transition-colors">

            {/* Hidden File Input */}
            <input
              type="file"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            <button
              onClick={handleAttachmentClick}
              className={`transition-colors ${pendingAttachments.length > 0 ? 'text-[#1DCD9C]' : 'text-gray-500 hover:text-white'}`}
              title="Attach files"
            >
              <Paperclip size={20} />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={pendingAttachments.length > 0 ? "Add a message..." : "Message team..."}
              className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none"
            />

            <button
              onClick={handleSendMessage}
              disabled={(!inputText.trim() && pendingAttachments.length === 0) || !currentUser}
              className={`p-2 rounded-lg transition-colors ${(inputText.trim() || pendingAttachments.length > 0) && currentUser
                  ? 'bg-[#1DCD9C] text-black hover:bg-[#1abe90]'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

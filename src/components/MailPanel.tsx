import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { mailAPI, Mail } from '../api/client';
import MailComposeForm from './MailComposeForm';
import MailDetailView from './MailDetailView';
import { Hero } from '../types/Hero';

interface MailPanelProps {
  hero: Hero | null;
}

export default function MailPanel({ hero }: MailPanelProps) {
  const { user } = useAuth();
  // Use twitchId for mail (consistent with how recipients are searched/selected)
  const userId = user?.twitchId || user?.id || '';

  const [mails, setMails] = useState<Mail[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (userId) {
      loadMail();
    }
    // Poll for mail updates every 30 seconds
    const interval = setInterval(() => {
      if (userId) loadMail();
    }, 30000);
    return () => clearInterval(interval);
  }, [userId, filter]);

  const loadMail = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await mailAPI.getMail(userId, filter === 'unread');
      if (response.success) {
        setMails(response.mails || []);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error: any) {
      console.error('Failed to load mail:', error);
      
      // If index error, show helpful message with link
      if (error.response?.data?.indexUrl) {
        const indexUrl = error.response.data.indexUrl;
        alert(`Firestore index required. Click OK to open the index creation page:\n\n${indexUrl}`);
        window.open(indexUrl, '_blank');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMailClick = async (mail: Mail) => {
    setSelectedMail(mail);
    
    // Mark as read if unread
    if (!mail.read) {
      try {
        await mailAPI.markAsRead(mail.id, userId);
        loadMail(); // Refresh to update read status
      } catch (error) {
        console.error('Failed to mark mail as read:', error);
      }
    }
  };

  const handleDeleteMail = async (mailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this mail?')) return;

    try {
      const response = await mailAPI.deleteMail(mailId, userId);
      if (response.success) {
        loadMail();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete mail');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) {
      return 'just now';
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 max-h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">📬 Mail</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-blue-400">{unreadCount} unread</p>
          )}
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors"
        >
          + Compose
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
            filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Mail List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {loading ? (
          <div className="p-4 text-center text-gray-400 text-sm">Loading mail...</div>
        ) : mails.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            {filter === 'unread' ? 'No unread mail' : 'No mail yet'}
          </div>
        ) : (
          mails.map((mail) => (
            <div
              key={mail.id}
              onClick={() => handleMailClick(mail)}
              className={`p-3 rounded border cursor-pointer hover:bg-gray-700/50 transition-colors ${
                !mail.read ? 'bg-blue-900/20 border-blue-700' : 'bg-gray-700/30 border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!mail.read && (
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                    )}
                    <span className="font-semibold text-white text-sm truncate">{mail.subject}</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-1 truncate">
                    From: {mail.senderName}
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2 mb-1">{mail.message}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                    <span>{formatDate(mail.createdAt)}</span>
                    {mail.items && mail.items.length > 0 && (
                      <span>📦 {mail.items.length}</span>
                    )}
                    {mail.gold && mail.gold > 0 && <span>💰 {mail.gold}g</span>}
                    {mail.tokens && mail.tokens > 0 && <span>💎 {mail.tokens}t</span>}
                    {mail.codAmount && mail.codAmount > 0 && (
                      <span className="text-yellow-400">COD: {mail.codAmount}g</span>
                    )}
                    {mail.claimed && (
                      <span className="text-green-400">✓ Claimed</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteMail(mail.id, e)}
                  className="text-gray-500 hover:text-red-400 transition-colors text-xs px-1 flex-shrink-0"
                  title="Delete mail"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Compose Form or Detail View */}
      {showCompose ? (
        <MailComposeForm
          onClose={() => setShowCompose(false)}
          onSent={() => {
            setShowCompose(false);
            loadMail();
          }}
        />
      ) : selectedMail ? (
        <MailDetailView
          mail={selectedMail}
          onClose={() => {
            setSelectedMail(null);
            loadMail(); // Refresh after claiming
          }}
          onClaimed={() => {
            setSelectedMail(null);
            loadMail(); // Refresh after claiming
          }}
        />
      ) : null}
    </div>
  );
}

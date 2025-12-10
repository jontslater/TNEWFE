import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { mailAPI, Mail } from '../api/client';
import { partyAPI } from '../api/client';
import MailComposeModal from '../components/MailComposeModal';
import MailDetailModal from '../components/MailDetailModal';

export default function MailPage() {
  const { user } = useAuth();
  const [mails, setMails] = useState<Mail[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const userId = user?.id || user?.twitchId || '';

  useEffect(() => {
    if (userId) {
      loadMail();
    }
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
    } catch (error) {
      console.error('Failed to load mail:', error);
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">📬 Mail</h1>
            <p className="text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : 'No unread messages'}
            </p>
          </div>
          <button
            onClick={() => setShowCompose(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            + Compose Mail
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Mail
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Mail List */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading mail...</div>
          ) : mails.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              {filter === 'unread' ? 'No unread mail' : 'No mail yet. Send someone a message!'}
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {mails.map((mail) => (
                <div
                  key={mail.id}
                  onClick={() => handleMailClick(mail)}
                  className={`p-4 cursor-pointer hover:bg-gray-700/50 transition-colors ${
                    !mail.read ? 'bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!mail.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                        )}
                        <span className="font-semibold text-white">{mail.subject}</span>
                        {mail.claimed && (
                          <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">Claimed</span>
                        )}
                        {mail.codAmount && mail.codAmount > 0 && (
                          <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">
                            COD: {mail.codAmount}g
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 mb-1">
                        From: {mail.senderName}
                      </div>
                      <p className="text-sm text-gray-300 truncate mb-2">{mail.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatDate(mail.createdAt)}</span>
                        {mail.items && mail.items.length > 0 && (
                          <span>📦 {mail.items.length} item{mail.items.length !== 1 ? 's' : ''}</span>
                        )}
                        {mail.gold && mail.gold > 0 && <span>💰 {mail.gold}g</span>}
                        {mail.tokens && mail.tokens > 0 && <span>💎 {mail.tokens}t</span>}
                        {mail.daysUntilExpiry !== undefined && mail.daysUntilExpiry > 0 && (
                          <span className={mail.daysUntilExpiry <= 7 ? 'text-yellow-400' : ''}>
                            Expires in {mail.daysUntilExpiry}d
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteMail(mail.id, e)}
                      className="text-gray-500 hover:text-red-400 transition-colors px-2"
                      title="Delete mail"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <MailComposeModal
          onClose={() => setShowCompose(false)}
          onSent={() => {
            setShowCompose(false);
            loadMail();
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedMail && (
        <MailDetailModal
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
      )}
    </div>
  );
}


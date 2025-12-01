import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { enhancedGuildAPI, heroAPI } from '../api/client';

interface Guild {
  id: string;
  name: string;
  createdBy: string;
  memberIds: string[];
  members?: any[];
  joinMode?: 'open' | 'approval';
  pendingApplications?: any[];
  guildLoot?: any[];
  lootHistory?: any[];
  level?: number;
}

export default function GuildManagementPage() {
  const { user } = useAuth();
  const [guild, setGuild] = useState<Guild | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'applications' | 'loot'>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadGuild();
    }
  }, [user]);

  const loadGuild = async () => {
    try {
      setLoading(true);
      const data = await enhancedGuildAPI.getMyGuild(user!.id);
      setGuild(data);
    } catch (err) {
      console.error('Failed to load guild:', err);
    } finally {
      setLoading(false);
    }
  };

  const isLeader = guild?.createdBy === user?.id;

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!guild) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Guild Management</h1>
        <div className="text-center p-8 bg-gray-100 rounded">
          <p className="mb-4">You are not in a guild.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Guild
          </button>
        </div>
        {showCreateModal && (
          <CreateGuildModal
            userId={user!.id}
            onClose={() => {
              setShowCreateModal(false);
              loadGuild();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">{guild.name}</h1>
        {isLeader && (
          <button
            onClick={() => setActiveTab('applications')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Manage Applications
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 ${activeTab === 'overview' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 ${activeTab === 'members' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Members
        </button>
        {isLeader && (
          <>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-2 ${activeTab === 'applications' ? 'border-b-2 border-blue-500' : ''}`}
            >
              Applications ({guild.pendingApplications?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('loot')}
              className={`px-4 py-2 ${activeTab === 'loot' ? 'border-b-2 border-blue-500' : ''}`}
            >
              Loot Management ({guild.guildLoot?.length || 0})
            </button>
          </>
        )}
      </div>

      {activeTab === 'overview' && <GuildOverview guild={guild} isLeader={isLeader} onUpdate={loadGuild} />}
      {activeTab === 'members' && <GuildMembers guild={guild} isLeader={isLeader} />}
      {activeTab === 'applications' && isLeader && (
        <GuildApplications guild={guild} onUpdate={loadGuild} />
      )}
      {activeTab === 'loot' && isLeader && <GuildLootManagement guild={guild} onUpdate={loadGuild} />}
    </div>
  );
}

function GuildOverview({ guild, isLeader, onUpdate }: any) {
  const [joinMode, setJoinMode] = useState(guild.joinMode || 'open');

  const handleUpdateSettings = async () => {
    try {
      await enhancedGuildAPI.updateGuildSettings(guild.id, guild.createdBy, joinMode);
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update settings');
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Guild Information</h2>
        <div>Level: {guild.level || 1}</div>
        <div>Members: {guild.memberIds?.length || 0}</div>
      </div>

      {isLeader && (
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Guild Settings</h2>
          <div className="mb-2">
            <label className="block mb-2">Join Mode</label>
            <select
              value={joinMode}
              onChange={(e) => setJoinMode(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="open">Open (Auto-join)</option>
              <option value="approval">Approval Required</option>
            </select>
          </div>
          <button
            onClick={handleUpdateSettings}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Settings
          </button>
        </div>
      )}
    </div>
  );
}

function GuildMembers({ guild }: any) {
  return (
    <div>
      <h2 className="font-bold mb-4">Guild Members ({guild.memberIds?.length || 0})</h2>
      <div className="space-y-2">
        {guild.memberIds?.map((memberId: string) => (
          <div key={memberId} className="p-2 bg-gray-100 rounded">
            {memberId === guild.createdBy ? '👑 ' : ''}
            {memberId}
          </div>
        ))}
      </div>
    </div>
  );
}

function GuildApplications({ guild, onUpdate }: any) {
  const applications = guild.pendingApplications || [];

  const handleApprove = async (userId: string) => {
    try {
      await enhancedGuildAPI.approveApplication(guild.id, userId, guild.createdBy);
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await enhancedGuildAPI.rejectApplication(guild.id, userId, guild.createdBy);
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject');
    }
  };

  return (
    <div>
      <h2 className="font-bold mb-4">Pending Applications ({applications.length})</h2>
      {applications.length === 0 ? (
        <p>No pending applications</p>
      ) : (
        <div className="space-y-2">
          {applications.map((app: any) => (
            <div key={app.userId} className="p-4 bg-gray-100 rounded flex justify-between items-center">
              <div>
                <div className="font-bold">{app.username}</div>
                {app.message && <div className="text-sm text-gray-600">{app.message}</div>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(app.userId)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(app.userId)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GuildLootManagement({ guild, onUpdate }: any) {
  const [loot, setLoot] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    loadLoot();
  }, [guild]);

  const loadLoot = async () => {
    try {
      const data = await enhancedGuildAPI.getGuildLoot(guild.id);
      setLoot(data);
      
      // Get participant list from loot items
      const allParticipants = new Set<string>();
      data.forEach((item: any) => {
        if (item.participants) {
          item.participants.forEach((p: string) => allParticipants.add(p));
        }
      });
      setParticipants(Array.from(allParticipants));
    } catch (err) {
      console.error('Failed to load loot:', err);
    }
  };

  const handleAssignLoot = async (itemId: string, assignedTo: string) => {
    try {
      await enhancedGuildAPI.assignLoot(guild.id, guild.createdBy, itemId, assignedTo);
      onUpdate();
      loadLoot();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to assign loot');
    }
  };

  return (
    <div>
      <h2 className="font-bold mb-4">Unassigned Loot ({loot.length})</h2>
      {loot.length === 0 ? (
        <p>No unassigned loot</p>
      ) : (
        <div className="space-y-4">
          {loot.map((item: any) => (
            <div key={item.item?.id} className="p-4 bg-gray-100 rounded">
              <div className="font-bold mb-2">{item.item?.name || 'Unknown Item'}</div>
              <div className="text-sm text-gray-600 mb-2">
                Rarity: {item.item?.rarity} | Participants: {item.participants?.length || 0}
              </div>
              <div className="mb-2">
                <label className="block mb-1">Assign to:</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAssignLoot(item.item.id, e.target.value);
                    }
                  }}
                  className="p-2 border rounded"
                  defaultValue=""
                >
                  <option value="">Select participant...</option>
                  {item.participants?.map((p: string) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateGuildModal({ userId, onClose }: any) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Please enter a guild name');
      return;
    }

    try {
      setLoading(true);
      await enhancedGuildAPI.createGuild(name, userId);
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create guild');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Create Guild</h2>
        <div className="mb-4">
          <label className="block mb-2">Guild Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter guild name..."
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

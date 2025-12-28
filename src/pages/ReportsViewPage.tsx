import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { reportsAPI, Report } from '../api/client';
import Navigation from '../components/Navigation';
import MessageAlert from '../components/MessageAlert';

export default function ReportsViewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [messageAlert, setMessageAlert] = useState<{ message: string } | null>(null);

  const isAdmin = user?.twitchUsername?.toLowerCase() === 'theneverendingwar';

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [statusFilter, user]);

  const loadReports = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        limit: 100,
        orderBy: 'createdAt',
        order: 'desc'
      };
      
      // If not admin, only show user's own reports
      if (!isAdmin) {
        params.userId = user.id || user.twitchId;
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await reportsAPI.getAllReports(params);
      setReports(response.reports);
    } catch (err: any) {
      console.error('Error loading reports:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId: string, newStatus: 'open' | 'in-progress' | 'resolved' | 'closed') => {
    if (!isAdmin || !user) {
      setMessageAlert({ message: 'Only admin can update report status' });
      return;
    }

    setUpdatingStatus(reportId);
    try {
      const notes = adminNotes[reportId] || '';
      await reportsAPI.updateReportStatus(reportId, newStatus, user.twitchUsername || user.username, notes || undefined);
      
      // Reload reports
      await loadReports();
      
      // Clear admin notes for this report
      setAdminNotes(prev => {
        const updated = { ...prev };
        delete updated[reportId];
        return updated;
      });
      
      // Close detail view if open
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
      
      setMessageAlert({ message: 'Report status updated successfully' });
    } catch (err: any) {
      console.error('Error updating report status:', err);
      setMessageAlert({ message: err.response?.data?.error || err.message || 'Failed to update report status' });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleSaveNotes = async (reportId: string) => {
    if (!isAdmin || !user) {
      setMessageAlert({ message: 'Only admin can save notes' });
      return;
    }

    setSavingNotes(reportId);
    try {
      const notes = adminNotes[reportId] || '';
      // Save notes by updating status to current status (no status change, just notes)
      await reportsAPI.updateReportStatus(reportId, selectedReport?.status as any || 'open', user.twitchUsername || user.username, notes || undefined);
      
      // Reload reports to get updated notes
      await loadReports();
      
      setMessageAlert({ message: 'Admin notes saved successfully' });
    } catch (err: any) {
      console.error('Error saving notes:', err);
      setMessageAlert({ message: err.response?.data?.error || err.message || 'Failed to save notes' });
    } finally {
      setSavingNotes(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-900 text-yellow-200 border-yellow-700';
      case 'in-progress':
        return 'bg-blue-900 text-blue-200 border-blue-700';
      case 'resolved':
        return 'bg-green-900 text-green-200 border-green-700';
      case 'closed':
        return 'bg-gray-700 text-gray-300 border-gray-600';
      default:
        return 'bg-gray-800 text-gray-400 border-gray-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {isAdmin ? 'Bug Reports' : 'My Tickets'}
              </h1>
              <p className="text-gray-400">
                {isAdmin ? 'View and manage submitted issues' : 'View your submitted issues and tickets'}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/report-issue')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors font-semibold"
              >
                + New Report
              </button>
              <button
                onClick={loadReports}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors font-semibold"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="mb-6 flex space-x-2">
            {['all', 'open', 'in-progress', 'resolved', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  statusFilter === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {!user ? (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <p className="text-gray-400 text-lg">Please log in to view your tickets</p>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading {isAdmin ? 'reports' : 'your tickets'}...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <p className="text-gray-400 text-lg">
                {isAdmin ? 'No reports found' : 'You haven\'t submitted any tickets yet'}
              </p>
              <button
                onClick={() => navigate('/report-issue')}
                className="mt-4 text-purple-400 hover:text-purple-300"
              >
                Submit a new report
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Reports List */}
              <div className="lg:col-span-2 space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className={`bg-gray-800 rounded-lg p-6 cursor-pointer transition-all hover:bg-gray-750 border-2 ${
                      selectedReport?.id === report.id
                        ? 'border-purple-500'
                        : 'border-transparent'
                    }`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1">{report.title}</h3>
                        <p className="text-sm text-gray-400">
                          by <span className="text-gray-300">{report.username}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            report.status
                          )}`}
                        >
                          {report.status.replace('-', ' ')}
                        </span>
                        <span className={`text-xs font-semibold ${getSeverityColor(report.severity)}`}>
                          {report.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-3 line-clamp-2">{report.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{report.category}</span>
                      <span>{formatDate(report.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Report Detail Sidebar */}
              <div className="lg:col-span-1">
                {selectedReport ? (
                  <div className="bg-gray-800 rounded-lg p-6 sticky top-4">
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-2xl font-bold flex-1">{selectedReport.title}</h2>
                      <button
                        onClick={() => setSelectedReport(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <span className="text-sm text-gray-400">Status:</span>
                        <span
                          className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            selectedReport.status
                          )}`}
                        >
                          {selectedReport.status.replace('-', ' ')}
                        </span>
                      </div>

                      <div>
                        <span className="text-sm text-gray-400">Severity:</span>
                        <span className={`ml-2 font-semibold ${getSeverityColor(selectedReport.severity)}`}>
                          {selectedReport.severity.toUpperCase()}
                        </span>
                      </div>

                      <div>
                        <span className="text-sm text-gray-400">Category:</span>
                        <span className="ml-2 text-gray-300">{selectedReport.category}</span>
                      </div>

                      <div>
                        <span className="text-sm text-gray-400">Submitted by:</span>
                        <span className="ml-2 text-gray-300">{selectedReport.username}</span>
                      </div>

                      <div>
                        <span className="text-sm text-gray-400">Created:</span>
                        <span className="ml-2 text-gray-300">{formatDate(selectedReport.createdAt)}</span>
                      </div>

                      {selectedReport.updatedAt && (
                        <div>
                          <span className="text-sm text-gray-400">Last updated:</span>
                          <span className="ml-2 text-gray-300">{formatDate(selectedReport.updatedAt)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">Description</h3>
                      <p className="text-gray-300 whitespace-pre-wrap">{selectedReport.description}</p>
                    </div>

                    {selectedReport.stepsToReproduce && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Steps to Reproduce</h3>
                        <p className="text-gray-300 whitespace-pre-wrap">{selectedReport.stepsToReproduce}</p>
                      </div>
                    )}

                    {selectedReport.expectedBehavior && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Expected Behavior</h3>
                        <p className="text-gray-300 whitespace-pre-wrap">{selectedReport.expectedBehavior}</p>
                      </div>
                    )}

                    {selectedReport.actualBehavior && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Actual Behavior</h3>
                        <p className="text-gray-300 whitespace-pre-wrap">{selectedReport.actualBehavior}</p>
                      </div>
                    )}

                    {selectedReport.adminNotes && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Admin Notes</h3>
                        <p className="text-gray-300 whitespace-pre-wrap">{selectedReport.adminNotes}</p>
                      </div>
                    )}

                    {isAdmin && (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2">Admin Notes</label>
                          <textarea
                            value={adminNotes[selectedReport.id] || ''}
                            onChange={(e) =>
                              setAdminNotes(prev => ({
                                ...prev,
                                [selectedReport.id]: e.target.value
                              }))
                            }
                            rows={3}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 resize-none text-white"
                            placeholder="Add notes about this report..."
                          />
                          <button
                            onClick={() => handleSaveNotes(selectedReport.id)}
                            disabled={savingNotes === selectedReport.id || !adminNotes[selectedReport.id]?.trim()}
                            className={`mt-2 w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
                              savingNotes === selectedReport.id || !adminNotes[selectedReport.id]?.trim()
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                          >
                            {savingNotes === selectedReport.id ? 'Saving...' : 'Save Notes'}
                          </button>
                          <p className="text-xs text-gray-500 mt-1">
                            Notes will also be saved when updating status
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold mb-2">Update Status</h3>
                          {(['open', 'in-progress', 'resolved', 'closed'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusUpdate(selectedReport.id, status)}
                              disabled={updatingStatus === selectedReport.id || selectedReport.status === status}
                              className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
                                selectedReport.status === status
                                  ? 'bg-purple-600 text-white cursor-default'
                                  : updatingStatus === selectedReport.id
                                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-700 hover:bg-gray-600 text-white'
                              }`}
                            >
                              {updatingStatus === selectedReport.id && status === selectedReport.status
                                ? 'Updating...'
                                : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
                    <p>Select a report to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Message Alert (replaces window.alert) */}
      <MessageAlert
        isOpen={!!messageAlert}
        message={messageAlert?.message || ''}
        onClose={() => setMessageAlert(null)}
      />
    </>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { reportsAPI, SubmitReportData, Report } from '../api/client';
import Navigation from '../components/Navigation';

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousReports, setPreviousReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const [formData, setFormData] = useState<SubmitReportData>({
    userId: user?.id || user?.twitchId || '',
    username: user?.twitchUsername || user?.username || '',
    title: '',
    description: '',
    category: 'general',
    severity: 'medium',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: ''
  });

  useEffect(() => {
    if (user) {
      loadPreviousReports();
    }
  }, [user]);

  const loadPreviousReports = async () => {
    if (!user) return;
    
    setLoadingReports(true);
    try {
      const params: any = {
        userId: user.id || user.twitchId,
        limit: 50,
        orderBy: 'createdAt',
        order: 'desc'
      };

      const response = await reportsAPI.getAllReports(params);
      setPreviousReports(response.reports);
    } catch (err: any) {
      console.error('Error loading previous reports:', err);
      // Don't show error to user - this is just for convenience
    } finally {
      setLoadingReports(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    if (!user) {
      setError('You must be logged in to submit a report');
      return;
    }

    setSubmitting(true);

    try {
      const submitData: SubmitReportData = {
        ...formData,
        userId: user.id || user.twitchId || '',
        username: user.twitchUsername || user.username || ''
      };

      await reportsAPI.submitReport(submitData);
      setSuccess(true);
      
      // Reload previous reports to show the new one
      await loadPreviousReports();
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          userId: submitData.userId,
          username: submitData.username,
          title: '',
          description: '',
          category: 'general',
          severity: 'medium',
          stepsToReproduce: '',
          expectedBehavior: '',
          actualBehavior: ''
        });
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error submitting report:', err);
      setError(err.response?.data?.error || err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Login Required</h1>
            <p className="text-gray-400 mb-4">You must be logged in to submit a report.</p>
            <button
              onClick={() => navigate('/')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8">
            <h1 className="text-3xl font-bold mb-2">Report an Issue</h1>
            <p className="text-gray-400 mb-6">
              Found a bug or have a suggestion? Let us know and we'll look into it!
            </p>

            {success && (
              <div className="mb-6 p-4 bg-green-900 border border-green-700 rounded-lg">
                <p className="text-green-200">
                  ✅ Report submitted successfully! Thank you for your feedback.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
                <p className="text-red-200">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="Brief summary of the issue"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="general">General</option>
                  <option value="bug">Bug</option>
                  <option value="feature">Feature Request</option>
                  <option value="balance">Game Balance</option>
                  <option value="ui">UI/UX</option>
                  <option value="performance">Performance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="severity" className="block text-sm font-medium mb-2">
                  Severity
                </label>
                <select
                  id="severity"
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="low">Low - Minor issue</option>
                  <option value="medium">Medium - Moderate issue</option>
                  <option value="high">High - Significant issue</option>
                  <option value="critical">Critical - Game breaking</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="Describe the issue in detail..."
                />
              </div>

              <div>
                <label htmlFor="stepsToReproduce" className="block text-sm font-medium mb-2">
                  Steps to Reproduce (Optional)
                </label>
                <textarea
                  id="stepsToReproduce"
                  name="stepsToReproduce"
                  value={formData.stepsToReproduce}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                />
              </div>

              <div>
                <label htmlFor="expectedBehavior" className="block text-sm font-medium mb-2">
                  Expected Behavior (Optional)
                </label>
                <textarea
                  id="expectedBehavior"
                  name="expectedBehavior"
                  value={formData.expectedBehavior}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="What should have happened?"
                />
              </div>

              <div>
                <label htmlFor="actualBehavior" className="block text-sm font-medium mb-2">
                  Actual Behavior (Optional)
                </label>
                <textarea
                  id="actualBehavior"
                  name="actualBehavior"
                  value={formData.actualBehavior}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="What actually happened?"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting || success}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  {submitting ? 'Submitting...' : success ? 'Submitted!' : 'Submit Report'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Previous Tickets Section */}
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 mt-8">
            <h2 className="text-2xl font-bold mb-4">Your Previous Tickets</h2>
            <p className="text-gray-400 mb-6">
              View and track the status of your submitted reports
            </p>

            {loadingReports ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Loading your tickets...</p>
              </div>
            ) : previousReports.length === 0 ? (
              <div className="text-center py-8 bg-gray-700 rounded-lg">
                <p className="text-gray-400">You haven't submitted any tickets yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {previousReports.map((report) => (
                  <div
                    key={report.id}
                    className={`bg-gray-700 rounded-lg p-6 cursor-pointer transition-all hover:bg-gray-650 border-2 ${
                      selectedReport?.id === report.id
                        ? 'border-purple-500'
                        : 'border-transparent'
                    }`}
                    onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1">{report.title}</h3>
                        <p className="text-sm text-gray-400">{report.category}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            report.status === 'open'
                              ? 'bg-yellow-900 text-yellow-200 border-yellow-700'
                              : report.status === 'in-progress'
                              ? 'bg-blue-900 text-blue-200 border-blue-700'
                              : report.status === 'resolved'
                              ? 'bg-green-900 text-green-200 border-green-700'
                              : 'bg-gray-700 text-gray-300 border-gray-600'
                          }`}
                        >
                          {report.status.replace('-', ' ')}
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            report.severity === 'critical'
                              ? 'text-red-400'
                              : report.severity === 'high'
                              ? 'text-orange-400'
                              : report.severity === 'medium'
                              ? 'text-yellow-400'
                              : 'text-green-400'
                          }`}
                        >
                          {report.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-3 line-clamp-2">{report.description}</p>
                    <div className="text-xs text-gray-500">
                      Submitted: {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}
                    </div>

                    {/* Expanded Details */}
                    {selectedReport?.id === report.id && (
                      <div className="mt-4 pt-4 border-t border-gray-600 space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Full Description</h4>
                          <p className="text-gray-300 whitespace-pre-wrap">{report.description}</p>
                        </div>

                        {report.stepsToReproduce && (
                          <div>
                            <h4 className="font-semibold mb-2">Steps to Reproduce</h4>
                            <p className="text-gray-300 whitespace-pre-wrap">{report.stepsToReproduce}</p>
                          </div>
                        )}

                        {report.expectedBehavior && (
                          <div>
                            <h4 className="font-semibold mb-2">Expected Behavior</h4>
                            <p className="text-gray-300 whitespace-pre-wrap">{report.expectedBehavior}</p>
                          </div>
                        )}

                        {report.actualBehavior && (
                          <div>
                            <h4 className="font-semibold mb-2">Actual Behavior</h4>
                            <p className="text-gray-300 whitespace-pre-wrap">{report.actualBehavior}</p>
                          </div>
                        )}

                        {report.adminNotes && (
                          <div className="bg-gray-600 rounded p-4">
                            <h4 className="font-semibold mb-2 text-purple-300">Admin Response</h4>
                            <p className="text-gray-200 whitespace-pre-wrap">{report.adminNotes}</p>
                          </div>
                        )}

                        {report.updatedAt && report.updatedAt !== report.createdAt && (
                          <div className="text-xs text-gray-500">
                            Last updated: {new Date(report.updatedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

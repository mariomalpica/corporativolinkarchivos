import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users,
  Target,
  Lightbulb,
  Activity,
  Calendar,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { aiService } from '../utils/aiService';

const AIDashboard = ({ boards, onClose }) => {
  const { t } = useTranslation();
  const [analysis, setAnalysis] = useState(null);
  const [dailyInsight, setDailyInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAIAnalysis();
  }, [boards]);

  const loadAIAnalysis = async () => {
    setLoading(true);
    try {
      // Refresh AI configuration
      aiService.refreshConfig();

      if (!aiService.isAIEnabled()) {
        setLoading(false);
        return;
      }

      // Generate daily insight
      const insight = aiService.generateDailyInsight(boards);
      setDailyInsight(insight);

      // If there are boards, analyze the first one
      if (boards && boards.length > 0) {
        const boardAnalysis = await aiService.analyzeBoard(boards[0]);
        setAnalysis(boardAnalysis);
        setSelectedBoard(boards[0]);
      }
    } catch (error) {
      console.error('Error loading AI analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBoardAnalysis = async (board) => {
    setLoading(true);
    setSelectedBoard(board);
    try {
      const boardAnalysis = await aiService.analyzeBoard(board);
      setAnalysis(boardAnalysis);
    } catch (error) {
      console.error('Error analyzing board:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPriority = (priority) => {
    switch (priority) {
      case 'critical': return { text: t('critical'), color: 'text-red-600 bg-red-100' };
      case 'high': return { text: t('high'), color: 'text-orange-600 bg-orange-100' };
      case 'medium': return { text: t('medium'), color: 'text-yellow-600 bg-yellow-100' };
      case 'low': return { text: t('low'), color: 'text-green-600 bg-green-100' };
      default: return { text: priority, color: 'text-gray-600 bg-gray-100' };
    }
  };

  const formatSeverity = (severity) => {
    switch (severity) {
      case 'high': return { text: t('high'), color: 'text-red-600 bg-red-100' };
      case 'medium': return { text: t('medium'), color: 'text-yellow-600 bg-yellow-100' };
      case 'low': return { text: t('low'), color: 'text-blue-600 bg-blue-100' };
      default: return { text: severity, color: 'text-gray-600 bg-gray-100' };
    }
  };

  if (!aiService.isAIEnabled()) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Brain className="mr-2 text-purple-600" size={24} />
              {t('ai_dashboard')}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          
          <div className="text-center py-8">
            <Brain size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">{t('ai_not_configured')}</h3>
            <p className="text-gray-600 mb-4">{t('ai_not_configured_desc')}</p>
            <button
              onClick={onClose}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              {t('configure_ai_settings')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="text-purple-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">{t('ai_dashboard')}</h2>
              <p className="text-sm text-gray-600">{t('intelligent_insights_and_recommendations')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadAIAnalysis}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-1 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span className="text-sm">{t('refresh')}</span>
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1">
              <X size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full"></div>
              <span className="text-gray-600">{t('analyzing_boards')}</span>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {[
                  { id: 'overview', label: t('overview'), icon: Activity },
                  { id: 'analysis', label: t('board_analysis'), icon: TrendingUp },
                  { id: 'recommendations', label: t('recommendations'), icon: Lightbulb },
                  { id: 'workload', label: t('workload'), icon: Users }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <tab.icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && dailyInsight && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Brain className="mr-2 text-purple-600" size={20} />
                    {t('daily_ai_insight')}
                  </h3>
                  <p className="text-gray-700 text-lg leading-relaxed">{dailyInsight.aiInsight}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{t('total_tasks')}</p>
                        <p className="text-2xl font-bold text-gray-800">{dailyInsight.totalTasks}</p>
                      </div>
                      <Target className="text-blue-600" size={24} />
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{t('completed_today')}</p>
                        <p className="text-2xl font-bold text-green-600">{dailyInsight.completedToday}</p>
                      </div>
                      <CheckCircle className="text-green-600" size={24} />
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{t('due_today')}</p>
                        <p className="text-2xl font-bold text-yellow-600">{dailyInsight.dueTasks}</p>
                      </div>
                      <Calendar className="text-yellow-600" size={24} />
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{t('overdue_tasks')}</p>
                        <p className="text-2xl font-bold text-red-600">{dailyInsight.overdueTasks}</p>
                      </div>
                      <AlertTriangle className="text-red-600" size={24} />
                    </div>
                  </div>
                </div>

                {dailyInsight.focusAreas.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                      <Target className="mr-2" size={16} />
                      {t('todays_focus_areas')}
                    </h4>
                    <ul className="space-y-1">
                      {dailyInsight.focusAreas.map((area, index) => (
                        <li key={index} className="text-yellow-700 flex items-center">
                          <ArrowRight size={14} className="mr-2" />
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Board Analysis Tab */}
            {activeTab === 'analysis' && (
              <div className="space-y-6">
                {/* Board Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('select_board_to_analyze')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {boards.map(board => (
                      <button
                        key={board.id}
                        onClick={() => handleBoardAnalysis(board)}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          selectedBoard?.id === board.id
                            ? 'bg-purple-100 border-purple-500 text-purple-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {board.title}
                      </button>
                    ))}
                  </div>
                </div>

                {analysis && (
                  <>
                    {/* Board Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-800">{analysis.metrics.totalTasks}</div>
                        <div className="text-sm text-gray-600">{t('total_tasks')}</div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{analysis.metrics.completedTasks}</div>
                        <div className="text-sm text-gray-600">{t('completed')}</div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{analysis.metrics.overdueTasks}</div>
                        <div className="text-sm text-gray-600">{t('overdue')}</div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{analysis.metrics.dueSoonTasks}</div>
                        <div className="text-sm text-gray-600">{t('due_soon')}</div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{analysis.metrics.progressPercentage}%</div>
                        <div className="text-sm text-gray-600">{t('progress')}</div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{analysis.metrics.averageTaskAge}d</div>
                        <div className="text-sm text-gray-600">{t('avg_age')}</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">{t('project_progress')}</span>
                        <span className="text-sm text-gray-600">{analysis.metrics.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${analysis.metrics.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Bottlenecks */}
                    {analysis.bottlenecks && analysis.bottlenecks.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                          <AlertTriangle className="mr-2 text-yellow-600" size={20} />
                          {t('identified_bottlenecks')}
                        </h4>
                        <div className="space-y-3">
                          {analysis.bottlenecks.map((bottleneck, index) => {
                            const severity = formatSeverity(bottleneck.severity);
                            return (
                              <div key={index} className="border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-medium text-gray-800">{bottleneck.type.replace('_', ' ')}</h5>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${severity.color}`}>
                                    {severity.text}
                                  </span>
                                </div>
                                <p className="text-gray-600 text-sm">{bottleneck.description}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === 'recommendations' && analysis?.recommendations && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Lightbulb className="mr-2 text-yellow-600" size={20} />
                  {t('ai_recommendations')}
                </h3>
                
                {analysis.recommendations.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                    <h4 className="text-lg font-medium text-gray-800 mb-2">{t('no_issues_detected')}</h4>
                    <p className="text-gray-600">{t('project_running_smoothly')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analysis.recommendations.map((rec, index) => {
                      const priority = formatPriority(rec.priority);
                      return (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium text-gray-800">{rec.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.color}`}>
                              {priority.text}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3">{rec.description}</p>
                          <div className="flex items-center text-sm text-purple-600">
                            <Target size={14} className="mr-1" />
                            <span>{t('impact')}: {rec.impact}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Workload Tab */}
            {activeTab === 'workload' && analysis?.workloadAnalysis && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Users className="mr-2 text-blue-600" size={20} />
                  {t('workload_analysis')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(analysis.workloadAnalysis.userWorkloads).map(([user, workload]) => (
                    <div key={user} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-800">{user}</h4>
                        <span className="text-sm text-gray-600">{workload.percentage}%</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{t('tasks')}</span>
                          <span className="font-medium">{workload.taskCount}</span>
                        </div>
                        {workload.overdueTasks > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-red-600">{t('overdue')}</span>
                            <span className="font-medium text-red-600">{workload.overdueTasks}</span>
                          </div>
                        )}
                        {workload.dueSoonTasks > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-yellow-600">{t('due_soon')}</span>
                            <span className="font-medium text-yellow-600">{workload.dueSoonTasks}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              workload.percentage > 50 ? 'bg-red-500' : 
                              workload.percentage > 30 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(workload.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {analysis.workloadAnalysis.recommendations.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-3">{t('workload_recommendations')}</h4>
                    <div className="space-y-2">
                      {analysis.workloadAnalysis.recommendations.map((rec, index) => (
                        <div key={index} className="text-blue-700 text-sm flex items-start">
                          <ArrowRight size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                          <span>{rec.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AIDashboard;
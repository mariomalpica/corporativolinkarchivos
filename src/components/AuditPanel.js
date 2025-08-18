import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Eye, 
  Download,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Monitor,
  AlertTriangle
} from 'lucide-react';
import { 
  getAuditLog, 
  getAuditStats, 
  AUDIT_ACTIONS, 
  TARGET_TYPES,
  cleanOldAudits 
} from '../utils/audit';

const AuditPanel = ({ currentUser, onClose }) => {
  const [auditLog, setAuditLog] = useState([]);
  const [filteredLog, setFilteredLog] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedEntry, setExpandedEntry] = useState(null);
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    searchText: '',
    action: '',
    targetType: '',
    userId: '',
    startDate: '',
    endDate: '',
    limit: 50
  });
  
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadAuditData();
  }, [currentUser]);

  useEffect(() => {
    applyFilters();
  }, [auditLog, filters]);

  const loadAuditData = () => {
    setLoading(true);
    
    // Obtener logs según el rol del usuario
    const logs = currentUser.role === 'admin' 
      ? getAuditLog() 
      : getAuditLog({ userId: currentUser.id });
    
    const auditStats = getAuditStats(currentUser);
    
    setAuditLog(logs);
    setStats(auditStats);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = auditLog;

    // Aplicar filtros
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.details.toLowerCase().includes(searchLower) ||
        entry.username.toLowerCase().includes(searchLower) ||
        entry.action.toLowerCase().includes(searchLower)
      );
    }

    if (filters.action) {
      filtered = filtered.filter(entry => entry.action === filters.action);
    }

    if (filters.targetType) {
      filtered = filtered.filter(entry => entry.targetType === filters.targetType);
    }

    if (filters.userId && currentUser.role === 'admin') {
      filtered = filtered.filter(entry => entry.userId === filters.userId);
    }

    if (filters.startDate) {
      filtered = filtered.filter(entry => 
        new Date(entry.timestamp) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // Incluir todo el día
      filtered = filtered.filter(entry => 
        new Date(entry.timestamp) <= endDate
      );
    }

    // Aplicar límite
    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    setFilteredLog(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchText: '',
      action: '',
      targetType: '',
      userId: '',
      startDate: '',
      endDate: '',
      limit: 50
    });
  };

  const exportAuditLog = () => {
    const dataToExport = filteredLog.map(entry => ({
      Fecha: new Date(entry.timestamp).toLocaleString(),
      Usuario: entry.username,
      Rol: entry.userRole,
      Acción: entry.action,
      Detalles: entry.details,
      Tipo: entry.targetType || 'N/A',
      IP: entry.ipAddress
    }));

    const csvContent = [
      Object.keys(dataToExport[0]).join(','),
      ...dataToExport.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const cleanOldEntries = () => {
    if (window.confirm('¿Eliminar registros de auditoría mayores a 30 días?')) {
      const deleted = cleanOldAudits(30);
      alert(`Se eliminaron ${deleted} registros antiguos`);
      loadAuditData();
    }
  };

  const getActionIcon = (action) => {
    if (action.includes('CREATE')) return '➕';
    if (action.includes('DELETE')) return '🗑️';
    if (action.includes('EDIT')) return '✏️';
    if (action.includes('MOVE')) return '↔️';
    if (action.includes('LOGIN')) return '🔑';
    if (action.includes('LOGOUT')) return '🚪';
    return '📝';
  };

  const getActionColor = (action) => {
    if (action.includes('CREATE')) return 'text-green-600 bg-green-50';
    if (action.includes('DELETE')) return 'text-red-600 bg-red-50';
    if (action.includes('EDIT')) return 'text-blue-600 bg-blue-50';
    if (action.includes('MOVE')) return 'text-purple-600 bg-purple-50';
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'text-indigo-600 bg-indigo-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getRoleColor = (role) => {
    return role === 'admin' ? 'text-purple-600 bg-purple-100' : 'text-blue-600 bg-blue-100';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center space-x-3">
            <RefreshCw className="animate-spin h-6 w-6 text-blue-500" />
            <span>Cargando auditoría...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                <Activity size={24} />
                <span>Auditoría del Sistema</span>
              </h2>
              <p className="text-gray-600">
                {currentUser.role === 'admin' 
                  ? 'Registro completo de actividades del sistema' 
                  : 'Registro de tus actividades'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalActions}</div>
                <div className="text-sm text-blue-800">Acciones Totales</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.todayActions}</div>
                <div className="text-sm text-green-800">Hoy</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.thisWeekActions}</div>
                <div className="text-sm text-purple-800">Esta Semana</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Object.keys(stats.actionsByUser).length}
                </div>
                <div className="text-sm text-orange-800">Usuarios Activos</div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 border-b space-y-4">
          {/* Search and main controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar en auditoría..."
                  value={filters.searchText}
                  onChange={(e) => handleFilterChange('searchText', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter size={16} />
              <span>Filtros</span>
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <button
              onClick={loadAuditData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <RefreshCw size={16} />
              <span>Actualizar</span>
            </button>

            <button
              onClick={exportAuditLog}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              disabled={filteredLog.length === 0}
            >
              <Download size={16} />
              <span>Exportar</span>
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={cleanOldEntries}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                <AlertTriangle size={16} />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las acciones</option>
                {Object.values(AUDIT_ACTIONS).map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>

              <select
                value={filters.targetType}
                onChange={(e) => handleFilterChange('targetType', e.target.value)}
                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los tipos</option>
                {Object.values(TARGET_TYPES).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Fecha inicio"
              />

              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Fecha fin"
              />

              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={25}>25 registros</option>
                <option value={50}>50 registros</option>
                <option value={100}>100 registros</option>
                <option value={500}>500 registros</option>
              </select>

              <div className="col-span-2">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600">
            Mostrando {filteredLog.length} de {auditLog.length} registros
          </div>
        </div>

        {/* Audit Log */}
        <div className="flex-1 overflow-auto">
          {filteredLog.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay registros</h3>
              <p className="text-gray-500">
                {auditLog.length === 0 
                  ? 'No se han registrado actividades aún' 
                  : 'No hay registros que coincidan con los filtros'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredLog.map(entry => (
                <div key={entry.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="text-2xl">{getActionIcon(entry.action)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionColor(entry.action)}`}>
                            {entry.action}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(entry.userRole)}`}>
                            {entry.userRole}
                          </span>
                          {entry.targetType && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {entry.targetType}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-900 font-medium">{entry.details}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User size={14} />
                            <span>{entry.username}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock size={14} />
                            <span>{new Date(entry.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Monitor size={14} />
                            <span>{entry.ipAddress}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                      className="text-gray-400 hover:text-gray-600 ml-4"
                    >
                      <Eye size={16} />
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {expandedEntry === entry.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Detalles Completos</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>ID de Entrada:</strong> {entry.id}
                        </div>
                        <div>
                          <strong>ID de Usuario:</strong> {entry.userId}
                        </div>
                        <div>
                          <strong>Timestamp:</strong> {entry.timestamp}
                        </div>
                        <div>
                          <strong>User Agent:</strong> {entry.userAgent?.substring(0, 50)}...
                        </div>
                        {entry.targetId && (
                          <div>
                            <strong>ID de Objetivo:</strong> {entry.targetId}
                          </div>
                        )}
                        {/* Datos adicionales */}
                        {Object.entries(entry).filter(([key]) => 
                          !['id', 'userId', 'username', 'userRole', 'action', 'details', 'targetType', 'targetId', 'timestamp', 'ipAddress', 'userAgent'].includes(key)
                        ).map(([key, value]) => (
                          <div key={key}>
                            <strong>{key}:</strong> {JSON.stringify(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditPanel;
import React, { useState } from 'react';
import { User, ChevronDown } from 'lucide-react';

const UserSelector = ({ assignedTo, onAssignUser, currentUser }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Lista de usuarios disponibles (en una app real vendría de la base de datos)
  const availableUsers = [
    { id: 'sistema', name: 'Sistema', color: 'bg-gray-500' },
    { id: 'mariomalpicapatron', name: 'Mario Malpica', color: 'bg-blue-500' },
    { id: 'admin', name: 'Administrador', color: 'bg-purple-500' },
    { id: 'guest', name: 'Invitado', color: 'bg-green-500' },
    { id: 'team', name: 'Equipo', color: 'bg-orange-500' }
  ];

  const getAssignedUser = () => {
    return availableUsers.find(user => user.id === assignedTo) || 
           availableUsers.find(user => user.name === assignedTo) ||
           { id: 'unknown', name: assignedTo || 'Sin asignar', color: 'bg-gray-400' };
  };

  const assignedUser = getAssignedUser();

  return (
    <div className="relative">
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-full text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 transition-colors touch-manipulation w-full justify-between"
        title={`Asignado a: ${assignedUser.name}`}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full ${assignedUser.color} flex items-center justify-center text-white text-xs`}>
            <User size={8} className="sm:w-2.5 sm:h-2.5" />
          </div>
          <span className="text-gray-700 max-w-24 sm:max-w-32 truncate">{assignedUser.name}</span>
        </div>
        <ChevronDown size={12} className="text-gray-500 sm:w-3 sm:h-3 flex-shrink-0" />
      </button>

      {showUserMenu && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-full sm:min-w-40 max-w-xs">
          <div className="py-1">
            {availableUsers.map(user => (
              <button
                key={user.id}
                onClick={() => {
                  onAssignUser(user.id);
                  setShowUserMenu(false);
                }}
                className="flex items-center space-x-2 w-full px-3 py-2 sm:py-2.5 text-left hover:bg-gray-50 text-sm touch-manipulation"
              >
                <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full ${user.color} flex items-center justify-center text-white flex-shrink-0`}>
                  <User size={8} className="sm:w-2.5 sm:h-2.5" />
                </div>
                <span className="text-gray-700 flex-1 truncate">{user.name}</span>
                {assignedTo === user.id && (
                  <span className="ml-auto text-blue-500 text-xs flex-shrink-0">✓</span>
                )}
              </button>
            ))}
            <hr className="my-1" />
            <button
              onClick={() => {
                onAssignUser(null);
                setShowUserMenu(false);
              }}
              className="flex items-center space-x-2 w-full px-3 py-2 sm:py-2.5 text-left hover:bg-gray-50 text-sm text-gray-500 touch-manipulation"
            >
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                <span className="text-xs">?</span>
              </div>
              <span className="flex-1">Sin asignar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSelector;
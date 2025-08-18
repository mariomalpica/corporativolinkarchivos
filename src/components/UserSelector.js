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
        className="flex items-center space-x-2 px-2 py-1 rounded-full text-xs bg-gray-100 hover:bg-gray-200 transition-colors"
        title={`Asignado a: ${assignedUser.name}`}
      >
        <div className={`w-4 h-4 rounded-full ${assignedUser.color} flex items-center justify-center text-white text-xs`}>
          <User size={8} />
        </div>
        <span className="text-gray-700 max-w-20 truncate">{assignedUser.name}</span>
        <ChevronDown size={12} className="text-gray-500" />
      </button>

      {showUserMenu && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-32">
          <div className="py-1">
            {availableUsers.map(user => (
              <button
                key={user.id}
                onClick={() => {
                  onAssignUser(user.id);
                  setShowUserMenu(false);
                }}
                className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
              >
                <div className={`w-4 h-4 rounded-full ${user.color} flex items-center justify-center text-white`}>
                  <User size={8} />
                </div>
                <span className="text-gray-700">{user.name}</span>
                {assignedTo === user.id && (
                  <span className="ml-auto text-blue-500 text-xs">✓</span>
                )}
              </button>
            ))}
            <hr className="my-1" />
            <button
              onClick={() => {
                onAssignUser(null);
                setShowUserMenu(false);
              }}
              className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-500"
            >
              <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-xs">?</span>
              </div>
              <span>Sin asignar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSelector;
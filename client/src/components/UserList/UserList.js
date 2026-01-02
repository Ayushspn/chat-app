import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import parseJwt from '../../utils/parseJwt';
import './UserList.css';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../config';

const UserList = () => {
  const token = localStorage.getItem('token');
  const currentUserId = parseJwt(token).userId;
  const navigate = useNavigate();
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [loadingUserId, setLoadingUserId] = useState(null);

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['users', currentUserId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/users/${currentUserId}`);
      const users = await res.json();
      return users;
    },
  });

  if (isLoading)
    return (
      <div className="user-list-container">
        <div className="user-list-wrapper">
          <div className="loading-state">Loading users...</div>
        </div>
      </div>
    );

  if (isError)
    return (
      <div className="user-list-container">
        <div className="user-list-wrapper">
          <div className="error-state">Failed to load users.</div>
        </div>
      </div>
    );

  if (!users || users.length === 0)
    return (
      <div className="user-list-container">
        <div className="user-list-wrapper">
          <div className="empty-state">
            <p>No other users available</p>
          </div>
        </div>
      </div>
    );

  const StartChat = async (selectedUserId) => {
    if (creatingRoom || loadingUserId === selectedUserId) return;
    setLoadingUserId(selectedUserId);
    console.log('Starting chat with user:', selectedUserId);
    try {
      // Try to create or get existing room from backend
      const res = await fetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ participants: [currentUserId, selectedUserId] }),
      });

      if (!res.ok) throw new Error('Failed to create room');
      const { roomId } = await res.json();
      // navigate to chat route with created room id
      navigate(`/chat/${selectedUserId}`);
    } catch (err) {
      console.error('StartChat error', err);
      // fallback: navigate to chat with user id if server isn't available
      navigate(`/chat/${selectedUserId}`);
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <div className="user-list-container">
      <div className="user-list-wrapper">
        <div className="user-list-header">
          <h3>Chat with Users</h3>
          <p>Select a user to start messaging</p>
        </div>
        <div className="user-list-content">
          <ul className="user-list">
            {users.map((user) => (
              <li
                key={user._id}
                onClick={() => StartChat(user._id)}
                className={loadingUserId === user._id ? 'loading' : ''}
              >
                <div className="user-item-content">
                  <div className="user-item-name">{user.username}</div>
                  <div className="user-item-email">{user.email}</div>
                </div>
                <div className="user-item-status"></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserList;
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import parseJwt from '../../utils/parseJwt';
import './UserList.css';
import { useNavigate } from 'react-router-dom';
const UserList = () => {
  const token = localStorage.getItem('token');
  const currentUserId = parseJwt(token).userId;
  const navigate = useNavigate();
  const [creatingRoom, setCreatingRoom] = useState(false);

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['users', currentUserId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/users/${currentUserId}`);
      const users = await res.json();
      return users;
    },
  });

  if (isLoading) return <div>Loading users...</div>;
  if (isError) return <div>Failed to load users.</div>;

  const StartChat = async (selectedUserId) => {
    if (creatingRoom) return;
    setCreatingRoom(true);
    console.log('Starting chat with user:', selectedUserId);
    try {
      // Try to create or get existing room from backend
      const res = await fetch('http://localhost:5000/rooms', {
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
      setCreatingRoom(false);
    }
  };

  return (
    <div className="user-list">
      <h3>Other Users</h3>
      <ul>
        {users.map((user) => (
          <li key={user._id} onClick={() => StartChat(user._id)} style={{cursor: creatingRoom ? 'not-allowed' : 'pointer'}}>
            {user.username} ({user.email})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
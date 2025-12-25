import React from 'react';
import { useQuery } from '@tanstack/react-query';
import parseJwt from '../../utils/parseJwt';
import './UserList.css';
import { useNavigate } from 'react-router-dom';
const UserList = () => {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const currentUserId = parseJwt(token).userId;

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

  const StartChat = (selectedUserId) => {
    navigate(`/chat/userId=${selectedUserId}`);
  }

  return (
    <div className="user-list">
      <h3>Other Users</h3>
      <ul>
        {users.map((user) => (
          <li key={user._id} onClick={() => StartChat(user._id)}>
            {user.username} ({user.email})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
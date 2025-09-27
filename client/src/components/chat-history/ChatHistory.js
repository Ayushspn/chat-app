import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
// import axios from 'axios';

const fetchMessages = async () => {
  const res = await fetch('http://localhost:5000/messages');
  const messages = await res.json();
  return messages
};

const ChatHistory = () => {
  const queryClient = useQueryClient();

  const { data: messages, isLoading, isError } = useQuery({
    queryKey: ['messages'],
    queryFn: fetchMessages,
  });

  useEffect(() => {
    const handleNewMessage = () => {
      queryClient.invalidateQueries(['messages']);
    };

    window.addEventListener('new-message', handleNewMessage);

    return () => {
      window.removeEventListener('new-message', handleNewMessage);
    };
  }, [queryClient]);

  if (isLoading) return <div>Loading messages...</div>;
  if (isError) return <div>Failed to load messages.</div>;

  return (
    <div style={styles.container}>
      <h2>Chat History</h2>
      <div style={styles.chatBox}>
        {messages.map((msg, index) => (
          <div key={index} style={styles.message}>
            {msg.text}
            <div style={styles.timestamp}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px', fontFamily: 'Arial, sans-serif', width: '60%' },
  chatBox: {
    border: '1px solid #ccc',
    padding: '10px',
    maxHeight: '80vh',
    overflowY: 'scroll',
    backgroundColor: '#f9f9f9',
  },
  message: {
    marginBottom: '10px',
    padding: '5px',
    backgroundColor: '#fff',
    borderRadius: '5px',
  },
  timestamp: { fontSize: '0.8em', color: '#888' },
};

export default ChatHistory;
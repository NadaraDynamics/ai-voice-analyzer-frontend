import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [calls, setCalls] = useState([]);

  // Fetch calls from backend
  useEffect(() => {
    fetch('http://44.203.153.182:8000/calls')
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched call data:", data);
        setCalls(data);
      })
      .catch((err) => console.error("Error fetching calls:", err));
  }, []);

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    try {
      const res = await fetch(`http://44.203.153.182:8000/calls/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCalls((prev) => prev.filter((call) => call._id !== id));
      } else {
        const err = await res.json();
        alert(`Failed to delete: ${err.detail}`);
      }
    } catch (err) {
      alert("Error deleting call");
      console.error(err);
    }
  };

  return (
    <div className="App" style={{ padding: '2rem' }}>
      <h1>📞 AI Voice Analyzer Dashboard</h1>

      {calls.length === 0 ? (
        <p>Loading call data...</p>
      ) : (
        <table border="1" cellPadding="10" style={{ marginTop: '2rem', width: '100%' }}>
          <thead>
            <tr>
              <th>Agent</th>
              <th>Transcript</th>
              <th>Tone</th>
              <th>Timestamp</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((call) => (
              <tr
                key={call._id}
                style={{
                  backgroundColor:
                    call.tone_signal === 'green' ? '#e6ffed' :
                    call.tone_signal === 'yellow' ? '#fffbe6' :
                    call.tone_signal === 'red' ? '#ffe6e6' :
                    'white',
                    color: '#333'
                }}
              >
                <td>{call.agent}</td>
                <td>{call.transcript}</td>
                <td style={{ color: call.tone_signal }}>
                  {call.tone_signal.toUpperCase()}
                </td>
                <td>{call.timestamp}</td>
                <td>
                  <button
                    onClick={() => handleDelete(call._id)}
                    style={{
                      backgroundColor: '#ff4d4f',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      borderRadius: '5px'
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;

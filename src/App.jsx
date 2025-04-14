import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { saveAs } from 'file-saver';
import './App.css';

function App() {
  const [calls, setCalls] = useState([]);
  const [selectedTone, setSelectedTone] = useState("");
  const [selectedIntent, setSelectedIntent] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [recordingUrl, setRecordingUrl] = useState("");
  const [transcribeAgent, setTranscribeAgent] = useState("");
  const [lastTranscript, setLastTranscript] = useState("");

  // Fetch calls from backend
  useEffect(() => {
    const fetchCalls = () => {
      fetch('http://44.203.153.182:8000/calls')
        .then((res) => res.json())
        .then((data) => {
          setCalls(data);
          const now = new Date().toLocaleTimeString();
          setLastUpdated(now);
        })
        .catch((err) => console.error("Error fetching calls:", err));
    };

    fetchCalls();
    const interval = setInterval(fetchCalls, 30000);
    return () => clearInterval(interval);
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

  // Reset all filters
  const resetFilters = () => {
    setSelectedTone("");
    setSelectedIntent("");
    setSelectedAgent("");
  };

  const exportCSV = () => {
    const headers = ["Agent", "Transcript", "Tone", "Intent", "Timestamp"];
    const filtered = calls.filter(
      (call) =>
        (selectedTone === "" || call.tone_signal === selectedTone) &&
        (selectedIntent === "" || call.intent === selectedIntent) &&
        (selectedAgent === "" || call.agent === selectedAgent)
    );

    const rows = filtered.map(call => [
      call.agent,
      call.transcript,
      call.tone_signal,
      call.intent || "n/a",
      call.timestamp,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(item => `"${item}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "call_data_export.csv");
  };

  // 🔁 Trigger transcription manually
  const handleTranscription = async () => {
    try {
      const res = await fetch("http://44.203.153.182:8000/transcribe-callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recording_url: recordingUrl,
          agent: transcribeAgent || "Unknown"
        })
      });

      const result = await res.json();
      if (res.ok) {
        alert("Transcription complete!");
        setLastTranscript(result.transcript);
        setRecordingUrl("");
        setTranscribeAgent("");
      } else {
        alert(`Failed: ${result.detail}`);
      }
    } catch (err) {
      alert("An error occurred during transcription.");
      console.error(err);
    }
  };

  return (
    <div className="App" style={{ padding: '2rem' }}>
      <h1>📞 AI Voice Analyzer Dashboard</h1>
      <p style={{ color: '#888' }}>Last updated at: {lastUpdated}</p>

      {/* 🔁 Manual Transcription Upload */}
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>🎙️ Transcribe New Call</h3>
        <input
          type="text"
          placeholder="Recording URL"
          value={recordingUrl}
          onChange={(e) => setRecordingUrl(e.target.value)}
          style={{ width: '50%', marginRight: '1rem' }}
        />
        <input
          type="text"
          placeholder="Agent name (optional)"
          value={transcribeAgent}
          onChange={(e) => setTranscribeAgent(e.target.value)}
          style={{ width: '30%', marginRight: '1rem' }}
        />
        <button
          onClick={handleTranscription}
          style={{ backgroundColor: '#007bff', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '5px' }}
        >
          Submit
        </button>
        {lastTranscript && (
          <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
            Last transcript: <strong>{lastTranscript}</strong>
          </p>
        )}
      </div>

      {/* ✅ Pie Chart */}
      <h2>📊 Total Results:</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={[
              { name: 'Green', value: calls.filter(c => c.tone_signal === 'green').length },
              { name: 'Yellow', value: calls.filter(c => c.tone_signal === 'yellow').length },
              { name: 'Red', value: calls.filter(c => c.tone_signal === 'red').length },
            ]}
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            <Cell fill="#00c853" />
            <Cell fill="#ffeb3b" />
            <Cell fill="#f44336" />
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      {/* ✅ Filter Section */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '1rem' }}>
          Tone:
          <select value={selectedTone} onChange={(e) => setSelectedTone(e.target.value)}>
            <option value="">All</option>
            <option value="green">Green</option>
            <option value="yellow">Yellow</option>
            <option value="red">Red</option>
          </select>
        </label>

        <label style={{ marginRight: '1rem' }}>
          Intent:
          <select value={selectedIntent} onChange={(e) => setSelectedIntent(e.target.value)}>
            <option value="">All</option>
            <option value="closing-ready">Closing-Ready</option>
            <option value="needs clarification">Needs Clarification</option>
            <option value="high risk">High Risk</option>
            <option value="neutral">Neutral</option>
          </select>
        </label>

        <label style={{ marginRight: '1rem' }}>
          Agent:
          <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
            <option value="">All</option>
            {
              [...new Set(calls.map(call => call.agent))].map(agent => (
                <option key={agent} value={agent}>{agent}</option>
              ))
            }
          </select>
        </label>

        <button
          onClick={resetFilters}
          style={{
            marginLeft: '1rem',
            backgroundColor: '#888',
            color: 'white',
            padding: '6px 12px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reset Filters
        </button>
      </div>

      {/* ✅ Call Table */}
      <table border="1" cellPadding="10" style={{ marginTop: '1rem', width: '100%' }}>
        <thead>
          <tr>
            <th>Agent</th>
            <th>Transcript</th>
            <th>Tone</th>
            <th>Intent</th>
            <th>Timestamp</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {calls
            .filter((call) =>
              (selectedTone === "" || call.tone_signal === selectedTone) &&
              (selectedIntent === "" || call.intent === selectedIntent) &&
              (selectedAgent === "" || call.agent === selectedAgent)
            )
            .map((call) => (
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
                <td style={{ color: call.tone_signal, fontWeight: 'bold' }}>
                  {call.tone_signal.toUpperCase()}
                </td>
                <td>{call.intent || "n/a"}</td>
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

      <button
        onClick={exportCSV}
        style={{
          marginTop: '2rem',
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Export to CSV
      </button>
    </div>
  );
}

export default App;

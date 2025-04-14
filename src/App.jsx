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
  const [feedbackMap, setFeedbackMap] = useState({});

  useEffect(() => {
    const fetchCalls = () => {
      fetch('http://44.203.153.182:8000/calls')
        .then((res) => res.json())
        .then((data) => {
          console.log("Fetched call data:", data);
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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      const res = await fetch(`http://44.203.153.182:8000/calls/${id}`, { method: "DELETE" });
      if (res.ok) setCalls((prev) => prev.filter((call) => call._id !== id));
      else alert(`Failed to delete: ${(await res.json()).detail}`);
    } catch (err) {
      alert("Error deleting call");
      console.error(err);
    }
  };

  const handleFeedbackSubmit = async (id) => {
    const feedback = feedbackMap[id];
    try {
      const res = await fetch(`http://44.203.153.182:8000/calls/${id}/feedback`, {
        method: "PATCH",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      if (res.ok) alert("Feedback submitted!");
      else alert(`Failed to submit feedback: ${(await res.json()).detail}`);
    } catch (err) {
      console.error(err);
      alert("Error submitting feedback");
    }
  };

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
      call.timestamp
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(item => `"${item}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "call_data_export.csv");
  };

  return (
    <div className="App" style={{ padding: '2rem' }}>
      <h1>📞 AI Voice Analyzer Dashboard</h1>
      <p style={{ color: '#888' }}>Last updated at: {lastUpdated}</p>

      <h2 style={{ marginTop: '2rem' }}>📊 Total Results:</h2>
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
            fill="#8884d8"
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

      {calls.length === 0 ? (
        <p>Loading call data...</p>
      ) : (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ marginRight: '1rem' }}>Tone:
              <select value={selectedTone} onChange={(e) => setSelectedTone(e.target.value)}>
                <option value="">All</option>
                <option value="green">Green</option>
                <option value="yellow">Yellow</option>
                <option value="red">Red</option>
              </select>
            </label>
            <label style={{ marginRight: '1rem' }}>Intent:
              <select value={selectedIntent} onChange={(e) => setSelectedIntent(e.target.value)}>
                <option value="">All</option>
                <option value="closing-ready">Closing-Ready</option>
                <option value="needs clarification">Needs Clarification</option>
                <option value="high risk">High Risk</option>
                <option value="neutral">Neutral</option>
              </select>
            </label>
            <label style={{ marginRight: '1rem' }}>Agent:
              <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
                <option value="">All</option>
                {[...new Set(calls.map(call => call.agent))].map(agent => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </label>
            <button
              onClick={resetFilters}
              style={{ marginLeft: '1rem', backgroundColor: '#888', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Reset Filters
            </button>
          </div>

          <table border="1" cellPadding="10" style={{ marginTop: '1rem', width: '100%' }}>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Transcript</th>
                <th>Tone</th>
                <th>Intent</th>
                <th>Timestamp</th>
                <th>Feedback</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {calls.filter(call =>
                (selectedTone === "" || call.tone_signal === selectedTone) &&
                (selectedIntent === "" || call.intent === selectedIntent) &&
                (selectedAgent === "" || call.agent === selectedAgent)
              ).map(call => (
                <tr key={call._id} style={{ backgroundColor: call.tone_signal === 'green' ? '#e6ffed' : call.tone_signal === 'yellow' ? '#fffbe6' : call.tone_signal === 'red' ? '#ffe6e6' : 'white', color: '#333' }}>
                  <td>{call.agent}</td>
                  <td>{call.transcript}</td>
                  <td style={{ color: call.tone_signal, fontWeight: 'bold' }}>{call.tone_signal.toUpperCase()}</td>
                  <td>{call.intent || "n/a"}</td>
                  <td>{call.timestamp}</td>
                  <td>
                    <input
                      value={feedbackMap[call._id] || ""}
                      onChange={(e) => setFeedbackMap({ ...feedbackMap, [call._id]: e.target.value })}
                      placeholder="Enter feedback"
                      style={{ width: '150px', marginBottom: '4px' }}
                    /><br />
                    <button
                      onClick={() => handleFeedbackSubmit(call._id)}
                      style={{ backgroundColor: '#1976d2', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                      Submit
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(call._id)}
                      style={{ backgroundColor: '#ff4d4f', color: 'white', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '5px' }}>
                      Delete
                    </button>
                    <button
                      onClick={exportCSV}
                      style={{ marginLeft: '1rem', backgroundColor: '#4CAF50', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Export CSV
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default App;

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './App.css';


function App() {
  const [calls, setCalls] = useState([]);
  const [selectedTone, setSelectedTone] = useState("");
  const [selectedIntent, setSelectedIntent] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [groupBy, setGroupBy] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [feedbackMap, setFeedbackMap] = useState({});

  useEffect(() => {
    const fetchCalls = () => {
      fetch('http://44.203.153.182:8000/calls')
        .then((res) => res.json())
        .then((data) => {
          setCalls(data);
          setLastUpdated(new Date().toLocaleTimeString());
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
      if (res.ok) {
        setCalls(prev => prev.filter(call => call._id !== id));
      } else {
        const err = await res.json();
        alert(`Failed to delete: ${err.detail}`);
      }
    } catch (err) {
      alert("Error deleting call");
      console.error(err);
    }
  };
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("AI Voice Analyzer - Call Data Export", 14, 16);
  
    const rows = calls.map(call => [
      call.agent,
      call.transcript,
      call.tone_signal,
      call.intent || "n/a",
      call.timestamp,
      call.feedback || ""
    ]);
  
    autoTable(doc, {
      startY: 20,
      head: [["Agent", "Transcript", "Tone", "Intent", "Timestamp", "Feedback"]],
      body: rows,
      styles: { fontSize: 8, cellWidth: 'wrap' },
      columnStyles: { 1: { cellWidth: 70 } }
    });
  
    doc.save("call_data_export.pdf");
  };
  
  
  
  const handleFeedbackSubmit = async (id) => {
    const feedback = feedbackMap[id];
    if (!feedback || feedback.trim() === "") return;
    try {
      const res = await fetch(`http://44.203.153.182:8000/calls/${id}/feedback`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback })
      });
      if (res.ok) {
        alert("Feedback submitted successfully");
        setFeedbackMap(prev => ({ ...prev, [id]: "" }));
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (err) {
      console.error("Feedback error:", err);
      alert("Failed to submit feedback");
    }
  };

  const resetFilters = () => {
    setSelectedTone("");
    setSelectedIntent("");
    setSelectedAgent("");
    setGroupBy("");
  };

  const exportCSV = () => {
    const headers = ["Agent", "Transcript", "Tone", "Intent", "Timestamp"];
    const filtered = calls.filter(
      (call) =>
        (selectedTone === "" || call.tone_signal === selectedTone) &&
        (selectedIntent === "" || call.intent === selectedIntent) &&
        (selectedAgent === "" || call.agent === selectedAgent)
    );
    const rows = filtered.map(call => [call.agent, call.transcript, call.tone_signal, call.intent || "n/a", call.timestamp]);
    const csvContent = [headers.join(","), ...rows.map(row => row.map(item => `"${item}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "call_data_export.csv");
  };

  const filteredCalls = calls.filter(
    (call) =>
      (selectedTone === "" || call.tone_signal === selectedTone) &&
      (selectedIntent === "" || call.intent === selectedIntent) &&
      (selectedAgent === "" || call.agent === selectedAgent)
  );

  const groupedCalls = () => {
    if (groupBy !== "agent-date") return null;
    const result = {};
    filteredCalls.forEach(call => {
      const date = new Date(call.timestamp).toISOString().split("T")[0];
      const key = `${call.agent}__${date}`;
      if (!result[key]) result[key] = [];
      result[key].push(call);
    });
    return result;
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
        <label style={{ marginRight: '1rem' }}>Group By:
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            <option value="">None</option>
            <option value="agent-date">Group by Agent & Date</option>
          </select>
        </label>
        <button onClick={resetFilters} style={{ marginLeft: '1rem', backgroundColor: '#888', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reset Filters</button>
      </div>

      {groupBy === "agent-date" ? (
        Object.entries(groupedCalls()).map(([key, group]) => {
          const [agent, date] = key.split("__");
          return (
            <div key={key} style={{ marginTop: '2rem', color: '#999'}}>
              <h3>{agent} – {date}</h3>
              <table border="1" cellPadding="10" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Transcript</th><th>Tone</th><th>Intent</th><th>Timestamp</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {group.map(call => (
                    <tr key={call._id} style={{ backgroundColor: call.tone_signal === 'green' ? '#e6ffed' : call.tone_signal === 'yellow' ? '#fffbe6' : call.tone_signal === 'red' ? '#ffe6e6' : 'white', color: '#000' }}>
                      <td>{call.transcript}</td>
                      <td style={{ color: call.tone_signal, fontWeight: 'bold' }}>{call.tone_signal.toUpperCase()}</td>
                      <td>{call.intent || "n/a"}</td>
                      <td>{call.timestamp}</td>
                      <td>
                        <button onClick={() => handleDelete(call._id)} style={{ backgroundColor: '#ff4d4f', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                        <textarea
                          rows="2"
                          value={feedbackMap[call._id] || ""}
                          onChange={(e) => setFeedbackMap(prev => ({ ...prev, [call._id]: e.target.value }))}
                          placeholder="Enter feedback..."
                          style={{ width: '100%', marginTop: '0.5rem' }}
                        />
                        <button onClick={() => handleFeedbackSubmit(call._id)} style={{ backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}>Submit Feedback</button>
                        
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      ) : (
        <table border="1" cellPadding="10" style={{ marginTop: '1rem', width: '100%' }}>
          <thead>
            <tr>
              <th>Agent</th><th>Transcript</th><th>Tone</th><th>Intent</th><th>Timestamp</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCalls.map(call => (
              <tr key={call._id} style={{ backgroundColor: call.tone_signal === 'green' ? '#e6ffed' : call.tone_signal === 'yellow' ? '#fffbe6' : call.tone_signal === 'red' ? '#ffe6e6' : 'white', color: '#000' }}>
                <td>{call.agent}</td>
                <td>{call.transcript}</td>
                <td style={{ color: call.tone_signal, fontWeight: 'bold' }}>{call.tone_signal.toUpperCase()}</td>
                <td>{call.intent || "n/a"}</td>
                <td>{call.timestamp}</td>
                <td>
                  <button onClick={() => handleDelete(call._id)} style={{ backgroundColor: '#ff4d4f', color: 'white', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '5px' }}>Delete</button>
                  <button onClick={exportCSV} style={{ marginLeft: '0.5rem', backgroundColor: '#4CAF50', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Export CSV</button>
                  <button onClick={exportPDF} style={{backgroundColor: '#1976D2', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px',cursor: 'pointer'}}>Export PDF</button>


                  <div style={{ marginTop: '0.5rem' }}>
                    <textarea
                      rows="2"
                      value={feedbackMap[call._id] || ""}
                      onChange={(e) => setFeedbackMap(prev => ({ ...prev, [call._id]: e.target.value }))}
                      placeholder="Enter feedback..."
                      style={{ width: '100%', marginBottom: '0.25rem' }}
                    />
                    <button onClick={() => handleFeedbackSubmit(call._id)} style={{ backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}>Submit Feedback</button>
                  </div>
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

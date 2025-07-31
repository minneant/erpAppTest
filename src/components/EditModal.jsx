import React, { useState } from "react";
import "./InputModal.css";

function EditModal({ initialRows, type, group, setShowModal, selectedDate, onSaveSuccess }) {
  const [rows, setRows] = useState(initialRows);
  const [saving, setSaving] = useState(false);

  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        process: "",
        type: "",
        line: "",
        inch: "",
        amount: "",
        date: selectedDate.toISOString().slice(0, 10),
      },
    ]);
  };

  const deleteRow = (index) => {
    const updated = [...rows];
    updated.splice(index, 1);
    setRows(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        date: selectedDate.toISOString().slice(0, 10),
        type: type, // "Record" or "Request"
        group,
        rows,
      };

      const formBody = `data=${encodeURIComponent(JSON.stringify(payload))}`;

      const response = await fetch("https://script.google.com/macros/s/AKfycby6-qghTbPve04vvpRQMTzeHt59NL4_bsOlGMEiKPvvTVQGkv-RLBXBiIt7Ghq4hNZm/exec", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody,
      });

      if (response.ok) {
        alert("Saved successfully!");
        setShowModal(false);
        onSaveSuccess(); // refresh data
      } else {
        alert("Failed to save");
      }
    } catch (err) {
      console.error("Save error", err);
      alert("Error during save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setShowModal(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit {type} Data ({group})</h2>
        <form onSubmit={handleSubmit}>
          {rows.map((row, index) => (
            <div key={index} className="input-row">
              <input
                type="text"
                value={row.process}
                onChange={(e) => handleChange(index, "process", e.target.value)}
                placeholder="Process"
              />
              <input
                type="text"
                value={row.type}
                onChange={(e) => handleChange(index, "type", e.target.value)}
                placeholder="Type"
              />
              <input
                type="text"
                value={row.line}
                onChange={(e) => handleChange(index, "line", e.target.value)}
                placeholder="Line"
              />
              <input
                type="text"
                value={row.inch}
                onChange={(e) => handleChange(index, "inch", e.target.value)}
                placeholder="Inch"
              />
              <input
                type="number"
                value={row.amount}
                onChange={(e) => handleChange(index, "amount", e.target.value)}
                placeholder="Amount"
              />
              <button type="button" onClick={() => deleteRow(index)}>🗑</button>
            </div>
          ))}
          <button type="button" onClick={addRow}>＋ Add Row</button>
          <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        </form>
      </div>
    </div>
  );
}

export default EditModal;

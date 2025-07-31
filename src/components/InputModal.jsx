import React from "react";
import "./InputModal.css";

function InputModal({
  inputRows,
  setInputRows,
  setShowModal,
  dropdownOptions,
  modalMode,
  setModalMode,
  selectedDate,
  setSelectedDate,
}) {
  const handleChange = (index, field, value) => {
    const updated = [...inputRows];
    updated[index][field] = value;
    setInputRows(updated);
  };

  const addRow = () => {
    setInputRows([
      ...inputRows,
      { process: "", type: "", line: "", inch: "", amount: "" },
    ]);
  };

  const removeRow = (index) => {
    const updated = inputRows.filter((_, i) => i !== index);
    setInputRows(updated);
  };

  // 🔑 alias 추출 함수
  const getAlias = (category, value) => {
    const match = dropdownOptions[category]?.find((opt) => opt.name === value);
    return match ? match.alias : value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    for (const row of inputRows) {
      const item = `${getAlias("Type", row.type)}_${getAlias("Line", row.line)}_${row.inch}_${getAlias("Process", row.process)}`;

      const payload = {
        date: selectedDate.toISOString().slice(0, 10),
        process: row.process,
        type: row.type,
        line: row.line,
        inch: row.inch,
        amount: row.amount,
        item: item,
        mode: modalMode, // Record or Request
      };

      const formBody = `data=${encodeURIComponent(JSON.stringify(payload))}`;

      try {
        const response = await fetch(
          "https://script.google.com/macros/s/AKfycby6-qghTbPve04vvpRQMTzeHt59NL4_bsOlGMEiKPvvTVQGkv-RLBXBiIt7Ghq4hNZm/exec",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formBody,
          }
        );

        const text = await response.text();
        console.log("Response:", text);
      } catch (err) {
        console.error("Save failed:", err);
        alert("Save failed");
        return;
      }
    }

    alert("Saved successfully.");
    setShowModal(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{modalMode === "Record" ? "Production Record Entry" : "Production Request Entry"}</h2>

        <div className="modal-header-controls">
          <label>
            <strong>Date:</strong>
            <input
              type="date"
              value={selectedDate.toISOString().slice(0, 10)}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
            />
          </label>

          <label>
            <strong>Entry Mode:</strong>
            <select
              value={modalMode}
              onChange={(e) => setModalMode(e.target.value)}
            >
              <option value="Record">Production Record</option>
              <option value="Request">Production Request</option>
            </select>
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          {inputRows.map((row, index) => (
            <div key={index} className="input-row">
              <select
                value={row.process}
                onChange={(e) => handleChange(index, "process", e.target.value)}
                required
              >
                <option value="">Process</option>
                {dropdownOptions.Process.map((proc) => (
                  <option key={proc.name} value={proc.name}>{proc.name}</option>
                ))}
              </select>

              <select
                value={row.type}
                onChange={(e) => handleChange(index, "type", e.target.value)}
                required
              >
                <option value="">Type</option>
                {dropdownOptions.Type.map((type) => (
                  <option key={type.name} value={type.name}>{type.name}</option>
                ))}
              </select>

              <select
                value={row.line}
                onChange={(e) => handleChange(index, "line", e.target.value)}
                required
              >
                <option value="">Line</option>
                {dropdownOptions.Line.map((line) => (
                  <option key={line.name} value={line.name}>{line.name}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Inch"
                value={row.inch}
                onChange={(e) => handleChange(index, "inch", e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Amount"
                value={row.amount}
                onChange={(e) => handleChange(index, "amount", e.target.value)}
                required
              />
              {inputRows.length > 1 && (
                <button type="button" onClick={() => removeRow(index)}>−</button>
              )}
            </div>
          ))}

          <div className="modal-buttons">
            <button type="button" onClick={addRow}>＋ Add Row</button>
            <button type="submit">Save</button>
            <button type="button" onClick={() => setShowModal(false)}>Close</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InputModal;

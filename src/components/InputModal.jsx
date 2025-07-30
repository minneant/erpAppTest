import React from 'react';
import './InputModal.css';

function InputModal({ inputRows, setInputRows, setShowModal, dropdownOptions, modalMode }) {
  const handleChange = (index, field, value) => {
    const updated = [...inputRows];
    updated[index][field] = value;
    setInputRows(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const row = inputRows[0];
    const item = `${row.type}_${row.line}_${row.inch}_${row.process}`;
    const payload = {
      ...row,
      item,
    };

    try {
      await fetch("https://script.google.com/macros/s/AKfycby6-qghTbPve04vvpRQMTzeHt59NL4_bsOlGMEiKPvvTVQGkv-RLBXBiIt7Ghq4hNZm/exec", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      alert("저장되었습니다.");
      setShowModal(false);
    } catch (err) {
      alert("저장 실패");
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>작업 등록</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="date"
            value={inputRows[0].date.toISOString().slice(0, 10)}
            onChange={(e) => handleChange(0, "date", new Date(e.target.value))}
            required
          />
          <select
            value={inputRows[0].process}
            onChange={(e) => handleChange(0, "process", e.target.value)}
            required
          >
            <option value="">Process</option>
            {dropdownOptions.Process.map((proc) => (
              <option key={proc} value={proc}>{proc}</option>
            ))}
          </select>
          <select
            value={inputRows[0].type}
            onChange={(e) => handleChange(0, "type", e.target.value)}
            required
          >
            <option value="">Type</option>
            {dropdownOptions.Type.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={inputRows[0].line}
            onChange={(e) => handleChange(0, "line", e.target.value)}
            required
          >
            <option value="">Line</option>
            {dropdownOptions.Line.map((line) => (
              <option key={line} value={line}>{line}</option>
            ))}
          </select>
          <input
            type="text"
            value={inputRows[0].inch}
            onChange={(e) => handleChange(0, "inch", e.target.value)}
            placeholder="Inch"
            required
          />
          <input
            type="number"
            value={inputRows[0].amount}
            onChange={(e) => handleChange(0, "amount", e.target.value)}
            placeholder="Amount"
            required
          />
          <div className="modal-buttons">
            <button type="submit">저장</button>
            <button type="button" onClick={() => setShowModal(false)}>닫기</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InputModal;

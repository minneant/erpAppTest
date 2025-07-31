import React, { useEffect, useState } from "react";
import axios from "axios";
import "./styles.css";
import InputModal from "./components/InputModal";

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycby6-qghTbPve04vvpRQMTzeHt59NL4_bsOlGMEiKPvvTVQGkv-RLBXBiIt7Ghq4hNZm/exec";

function App() {
  const [productionData, setProductionData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalMode, setModalMode] = useState("Record");
  const [inputRows, setInputRows] = useState([
    { process: "", type: "", line: "", inch: "", amount: "" },
  ]);
  const [dropdownOptions, setDropdownOptions] = useState({ Process: [], Type: [], Line: [] });

  useEffect(() => {
    fetchProductionData();
    fetchDropdownOptions();
  }, []);

  const fetchProductionData = async () => {
    try {
      const res = await axios.get(`${WEB_APP_URL}?action=getProductionHistory`);
      setProductionData(res.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const fetchDropdownOptions = async () => {
    try {
      const res = await axios.get(`${WEB_APP_URL}?action=getMeta`);
      const rows = res.data;

      // 구조: { Process: [{name, alias}], Type: [...], Line: [...] }
      const grouped = { Process: [], Type: [], Line: [] };
      rows.forEach((row) => {
        if (grouped[row.category] && !grouped[row.category].some(r => r.name === row.name)) {
          grouped[row.category].push({ name: row.name, alias: row.alias });
        }
      });
      setDropdownOptions(grouped);
    } catch (error) {
      console.error("Failed to load dropdowns:", error);
    }
  };

  const categorizeData = (data) => {
    const isFoamingOrWire = (proc) => proc === "Foaming" || proc === "Wire";
    const groupByItem = (items) => {
      const result = {};
      for (const row of items) {
        const key = row.Item;
        result[key] = (result[key] || 0) + parseInt(row.Amount);
      }
      return result;
    };
    const leftData = groupByItem(data.filter((row) => isFoamingOrWire(row.Process)));
    const rightData = groupByItem(data.filter((row) => !isFoamingOrWire(row.Process)));
    return { leftData, rightData };
  };

  const { leftData, rightData } = categorizeData(productionData);

  const formatDate = (date) => date.toISOString().slice(0, 10);
  const changeDateBy = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <div className="app-layout">
      <div className="date-header center">
        <button onClick={() => changeDateBy(-1)}>&lt;</button>
        <input
          type="date"
          value={formatDate(selectedDate)}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
        />
        <button onClick={() => changeDateBy(1)}>&gt;</button>
      </div>

      <div className="content-row">
        <div className="column">
          <h2>Foaming / Wire</h2>
          <ul>
            {Object.entries(leftData).map(([item, count]) => (
              <li key={item}>
                <strong>{item}</strong>: {count}
              </li>
            ))}
          </ul>
        </div>
        <div className="column">
          <h2>Finishing</h2>
          <ul>
            {Object.entries(rightData).map(([item, count]) => (
              <li key={item}>
                <strong>{item}</strong>: {count}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button className="add-btn" onClick={() => setShowModal(true)}>＋</button>

      {showModal && (
        <InputModal
          modalMode={modalMode}
          setModalMode={setModalMode}
          inputRows={inputRows}
          setInputRows={setInputRows}
          dropdownOptions={dropdownOptions}
          setShowModal={setShowModal}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      )}
    </div>
  );
}

export default App;

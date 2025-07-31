// ✅ App.js with request vs actual color logic (fixed categorizeData order)
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./styles.css";
import InputModal from "./components/InputModal";

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycby6-qghTbPve04vvpRQMTzeHt59NL4_bsOlGMEiKPvvTVQGkv-RLBXBiIt7Ghq4hNZm/exec";

function App() {
  const [productionData, setProductionData] = useState([]);
  const [requestData, setRequestData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalMode, setModalMode] = useState("Record");
  const [inputRows, setInputRows] = useState([
    { process: "", type: "", line: "", inch: "", amount: "" },
  ]);
  const [dropdownOptions, setDropdownOptions] = useState({ Process: [], Type: [], Line: [] });

  useEffect(() => {
    fetchProductionData();
    fetchRequestData();
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

  const fetchRequestData = async () => {
    try {
      const res = await axios.get(`${WEB_APP_URL}?action=getProductionRequests`);
      setRequestData(res.data);
    } catch (error) {
      console.error("Failed to load request data:", error);
    }
  };

  const fetchDropdownOptions = async () => {
    try {
      const res = await axios.get(`${WEB_APP_URL}?action=getMeta`);
      const rows = res.data;
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

  const formatDate = (d) => new Date(d).toLocaleDateString("sv-SE");
  const selectedDateStr = formatDate(selectedDate);

  const filteredData = productionData.filter(
    (row) => formatDate(row.Date) === selectedDateStr
  );

  const filteredRequests = requestData.filter(
    (row) => formatDate(row.Date) === selectedDateStr
  );

  const groupByItem = (items) => {
    const result = {};
    for (const row of items) {
      const key = row.Item;
      result[key] = (result[key] || 0) + parseInt(row.Amount);
    }
    return result;
  };

  const { leftData, rightData } = categorizeData(filteredData);
  const requestDataByItem = groupByItem(filteredRequests);

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
          value={selectedDateStr}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
        />
        <button onClick={() => changeDateBy(1)}>&gt;</button>
      </div>

      <div className="content-row">
        <div className="column">
          <h2>Foaming / Wire</h2>
          <ul>
            {Object.entries(requestDataByItem).map(([item, count]) => (
              (item.includes("Foam") || item.includes("Wire")) && (
                <li
                  key={`request-${item}`}
                  className={leftData[item] >= count ? "text-lime" : "text-tomato"}
                >
                  <strong>{item}</strong>: {count}
                </li>
              )
            ))}
          </ul>
          <hr style={{ border: "none", borderTop: "1px solid #ccc", margin: "6px 0" }} />
          <ul>
            {Object.entries(leftData).map(([item, count]) => (
              <li key={item}>
                <strong>{item}</strong>: {count}
              </li>
            ))}
          </ul>
        </div>

        <div className="column">
          <h2>Finishing / Elbow</h2>
          <ul>
            {Object.entries(requestDataByItem).map(([item, count]) => (
              (item.includes("Finish") || item.includes("Elbow")) && (
                <li
                  key={`request-${item}`}
                  className={rightData[item] >= count ? "text-lime" : "text-tomato"}
                >
                  <strong>{item}</strong>: {count}
                </li>
              )
            ))}
          </ul>
          <hr style={{ border: "none", borderTop: "1px solid #ccc", margin: "6px 0" }} />
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
          onSaveSuccess={() => {
            fetchProductionData();
            fetchRequestData();
          }}
        />
      )}
    </div>
  );
}

export default App;

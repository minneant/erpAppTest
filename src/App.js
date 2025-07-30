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
    { date: new Date(), process: "", type: "", line: "", inch: "", amount: "" },
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
      console.error("데이터 불러오기 실패:", error);
    }
  };

  const fetchDropdownOptions = async () => {
    try {
      const res = await axios.get(`${WEB_APP_URL}?action=getMeta`);
      const rows = res.data;
      const grouped = { Process: [], Type: [], Line: [] };
      rows.forEach((row) => {
        if (grouped[row.category] && !grouped[row.category].includes(row.name)) {
          grouped[row.category].push(row.name);
        }
      });
      setDropdownOptions(grouped);
    } catch (error) {
      console.error("드랍다운 데이터 불러오기 실패:", error);
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

  const renderItemList = (data) => (
    <ul>
      {Object.entries(data).map(([item, count]) => (
        <li key={item}>
          <strong>{item}</strong>: {count}개
        </li>
      ))}
    </ul>
  );

  const formatDate = (date) => date.toISOString().slice(0, 10);
  const changeDateBy = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <div className="app-layout">
      <div className="date-header">
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
          {renderItemList(leftData)}
        </div>
        <div className="column">
          <h2>Finishing</h2>
          {renderItemList(rightData)}
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
        />
      )}
    </div>
  );
}

export default App;

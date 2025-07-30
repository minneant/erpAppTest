import React, { useEffect, useState } from "react";
import axios from "axios";
import "./styles.css";

const WEB_APP_URL =
  "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"; // 실제 URL로 교체

function App() {
  const [productionData, setProductionData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchProductionData();
  }, []);

  const fetchProductionData = async () => {
    try {
      const res = await axios.get(`${WEB_APP_URL}?action=getProductionHistory`);
      setProductionData(res.data);
    } catch (error) {
      console.error("데이터 불러오기 실패:", error);
    }
  };

  const categorizeData = (data) => {
    const isFoamingOrWire = (proc) =>
      proc === "Foaming" || proc === "Wire";

    const groupByItem = (items) => {
      const result = {};
      for (const row of items) {
        const key = row.Item;
        result[key] = (result[key] || 0) + parseInt(row.Amount);
      }
      return result;
    };

    const leftData = groupByItem(
      data.filter((row) => isFoamingOrWire(row.Process))
    );
    const rightData = groupByItem(
      data.filter((row) => !isFoamingOrWire(row.Process))
    );

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
      {/* 날짜 선택 UI */}
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

      {/* ➕ 버튼 */}
      <button className="add-btn" onClick={() => setShowModal(true)}>
        ＋
      </button>

      {/* 모달 (기본 구조) */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>생산 실적 추가</h3>
            <p>여기에 폼이 들어갈 예정</p>
            <button onClick={() => setShowModal(false)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

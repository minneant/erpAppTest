import React, { useEffect, useState } from "react";
import axios from "axios";
import "./styles.css";
import InputModal from "./components/InputModal";
import EditModal from "./components/EditModal";
import namingRuleImg from "./assets/itemnamingrule.png";

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycby6-qghTbPve04vvpRQMTzeHt59NL4_bsOlGMEiKPvvTVQGkv-RLBXBiIt7Ghq4hNZm/exec";

function App() {
  const [productionData, setProductionData] = useState([]);
  const [requestData, setRequestData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editType, setEditType] = useState(null); // "Record" or "Request"
  const [editGroup, setEditGroup] = useState(null); // "Left" or "Right"
  const [editRows, setEditRows] = useState([]);
  const [showNamingRule, setShowNamingRule] = useState(false);
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
      console.error("Failed to load production data:", error);
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
          grouped[row.category].push({ name: row.name, alias: row.alias, group: row.group });
        }
      });
      setDropdownOptions(grouped);
    } catch (error) {
      console.error("Failed to load dropdowns:", error);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("sv-SE");
  const selectedDateStr = formatDate(selectedDate);

  const filteredData = productionData.filter(row => formatDate(row.Date) === selectedDateStr);
  const filteredRequests = requestData.filter(row => formatDate(row.Date) === selectedDateStr);

  const groupByItem = (items) => {
    const result = {};
    for (const row of items) {
      const key = row.Item;
      result[key] = (result[key] || 0) + parseInt(row.Amount);
    }
    return result;
  };

  const actualDataByItem = groupByItem(filteredData);
  const requestDataByItem = groupByItem(filteredRequests);

  const processGroups = dropdownOptions.Process.reduce((map, p) => {
    map[p.name] = p.group;
    map[p.alias] = p.group;
    return map;
  }, {});

  const splitByGroup = (data) => {
    const left = [], right = [];
    for (const row of data) {
      const process = row.Item?.split("_").slice(-1)[0];
      const group = processGroups[process] || "Right";
      (group === "Left" ? left : right).push(row);
    }
    return { left, right };
  };

  const { left: leftRecords, right: rightRecords } = splitByGroup(filteredData);
  const { left: leftRequests, right: rightRequests } = splitByGroup(filteredRequests);

  const changeDateBy = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const formatRemainderText = (actual, requested) => {
    const diff = actual - requested;
    if (diff >= 0) return `(Excess: ${diff})`;
    return `(Remainder: ${-diff})`;
  };

  const openEditModal = (type, group) => {
    const rows =
      type === "Record"
        ? (group === "Left" ? leftRecords : rightRecords)
        : (group === "Left" ? leftRequests : rightRequests);

    const editFormatted = rows.map(r => ({
      process: r.Process,
      type: r.Type,
      line: r.Line,
      inch: r.Inch,
      amount: r.Amount,
      date: formatDate(r.Date)
    }));

    setEditType(type);
    setEditGroup(group);
    setEditRows(editFormatted);
    setShowEditModal(true);
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
        <button className="info-btn" onClick={() => setShowNamingRule(true)}>?</button>
      </div>

      {showNamingRule && (
        <div className="modal-overlay" onClick={() => setShowNamingRule(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={namingRuleImg} alt="Item Naming Rule" className="naming-img" />
            <button className="close-btn" onClick={() => setShowNamingRule(false)}>Close</button>
          </div>
        </div>
      )}

      <div className="content-row">
        <div className="column">
          <h2>Foaming / Wire</h2>
          <ul onClick={() => openEditModal("Request", "Left")}>
            {Object.entries(requestDataByItem).map(([item, count]) => {
              const proc = item.split("_").slice(-1)[0];
              const group = processGroups[proc] || "Right";
              if (group !== "Left") return null;
              const actual = actualDataByItem[item] || 0;
              return (
                <li key={item} className={actual >= count ? "text-lime" : "text-tomato"}>
                  <strong>{item}</strong>: {count} {formatRemainderText(actual, count)}
                </li>
              );
            })}
          </ul>
          <hr />
          <ul onClick={() => openEditModal("Record", "Left")}>
            {leftRecords.map(row => (
              <li key={row.Item}>
                <strong>{row.Item}</strong>: {row.Amount}
              </li>
            ))}
          </ul>
        </div>

        <div className="column">
          <h2>Finishing / Elbow</h2>
          <ul onClick={() => openEditModal("Request", "Right")}>
            {Object.entries(requestDataByItem).map(([item, count]) => {
              const proc = item.split("_").slice(-1)[0];
              const group = processGroups[proc] || "Right";
              if (group !== "Right") return null;
              const actual = actualDataByItem[item] || 0;
              return (
                <li key={item} className={actual >= count ? "text-lime" : "text-tomato"}>
                  <strong>{item}</strong>: {count} {formatRemainderText(actual, count)}
                </li>
              );
            })}
          </ul>
          <hr />
          <ul onClick={() => openEditModal("Record", "Right")}>
            {rightRecords.map(row => (
              <li key={row.Item}>
                <strong>{row.Item}</strong>: {row.Amount}
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

      {showEditModal && (
        <EditModal
          initialRows={editRows}
          type={editType}
          group={editGroup}
          setShowModal={setShowEditModal}
          selectedDate={selectedDate}
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

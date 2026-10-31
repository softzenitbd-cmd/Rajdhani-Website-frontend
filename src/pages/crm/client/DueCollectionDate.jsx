import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import PrintHeader from "../../../components/PrintHeader";
import {
  ArrowLeft,
  Users,
  Plus,
  FileSpreadsheet,
  Printer,
  RotateCcw,
} from "lucide-react";
import { crmService } from "../../../services/crmService";
import { accountingService } from "../../../services/accountingService";
import { saleService } from "../../../services/saleService";
import { toList } from "../../../utils/apiHelpers";
import { exportToExcel } from "../../../utils/excelExporter";
import { useToast } from "../../../context/ToastContext";
import CustomDatePicker from "../../../components/CustomDatePicker";
const DueCollectionDate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const toast = useToast();
  // Collection date lives on the client record: PATCH /api/crm/clients/{id}/ { collection_date }
  const dateOf = (c) => (c.due_date ? String(c.due_date).split("T")[0] : "");
  const saveDate = async (c, value) => {
    const id = c.id || c.uuid;
    const previous = c.due_date;
    setClients((prev) =>
      prev.map((row) =>
        (row.id || row.uuid) === id ? { ...row, due_date: value } : row,
      ),
    );
    try {
      const saved = await crmService.updateClient(id, {
        due_date: value || null,
      });
      if (saved && typeof saved === "object") {
        setClients((prev) =>
          prev.map((row) =>
            (row.id || row.uuid) === id ? { ...row, ...saved } : row,
          ),
        );
      }
      toast.success(t("Collection date saved"));
    } catch (e) {
      setClients((prev) =>
        prev.map((row) =>
          (row.id || row.uuid) === id ? { ...row, due_date: previous } : row,
        ),
      );
      toast.error(e?.message || t("Failed to save collection date"));
    }
  };

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for filters
  const [filters, setFilters] = useState({
    searchAll: "",
    clientGroup: "",
    startDate: "",
    endDate: "",
  });

  const [entries, setEntries] = useState(25);

  useEffect(() => {
    fetchGroups();
    fetchClients();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await crmService.getClientGroups();
      const data = Array.isArray(res) ? res : res?.results || [];
      setGroups(data);
    } catch (err) {
      toast.error(err?.message || t("Failed to load client groups"));
    }
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = { page_size: 5000 };
      if (filters.searchAll) params.search = filters.searchAll;
      if (filters.clientGroup) params.group = filters.clientGroup;

      const res = await crmService.getClients(params);
      const data = Array.isArray(res) ? res : res?.results || [];

      try {
        const [statsRes, receivesRes, salesRes, returnsRes] = await Promise.allSettled([
          crmService.getClientDueReport({ page_size: 5000 }),
          accountingService.getReceives({ page_size: 5000 }),
          saleService.getSalesInvoices({ page_size: 5000 }),
          saleService.getSalesReturns({ page_size: 5000 }),
        ]);

        const statsData = statsRes.status === "fulfilled" ? toList(statsRes.value) : [];
        const rawReceives = receivesRes.status === "fulfilled" ? toList(receivesRes.value) : [];
        const rawSales = salesRes.status === "fulfilled" ? toList(salesRes.value) : [];
        const rawReturns = returnsRes.status === "fulfilled" ? toList(returnsRes.value) : [];

        const recordAmt = (map, ref, amt) => {
          if (!ref || !amt) return;
          if (typeof ref === "object") {
            if (ref.id) map.set(String(ref.id), (map.get(String(ref.id)) || 0) + amt);
            if (ref.uuid) map.set(String(ref.uuid), (map.get(String(ref.uuid)) || 0) + amt);
            if (ref.phone) {
              const ph = String(ref.phone).replace(/\D/g, "");
              if (ph.length >= 8) map.set(`phone:${ph}`, (map.get(`phone:${ph}`) || 0) + amt);
            }
          } else {
            map.set(String(ref), (map.get(String(ref)) || 0) + amt);
          }
        };

        const clientReceivesMap = new Map();
        rawReceives.forEach((rec) => {
          const amt = Number(rec.amount || rec.total || 0);
          recordAmt(clientReceivesMap, rec.client || rec.client_id, amt);
        });

        const clientSalesMap = new Map();
        rawSales.forEach((inv) => {
          const billAmt = Number(inv.grand_total || inv.total_amount || inv.total || inv.bill || 0);
          recordAmt(clientSalesMap, inv.client || inv.client_id, billAmt);
        });

        const clientReturnsMap = new Map();
        rawReturns.forEach((ret) => {
          const retAmt = Number(ret.grand_total || ret.total_amount || ret.return_amount || ret.total || 0);
          recordAmt(clientReturnsMap, ret.client || ret.client_id, retAmt);
        });

        const findStats = (client) => {
          const clientId = String(client.id || client.uuid || "");
          const clientUuid = client.uuid ? String(client.uuid) : "";
          const clientPhone = String(client.phone || client.mobile || "").replace(/\D/g, "");
          const clientName = String(client.name || client.company_name || "").trim().toLowerCase();

          return (
            statsData.find((s) => {
              const sId = String(
                s.client_id ||
                (typeof s.client === "object" ? (s.client?.id || s.client?.uuid) : s.client) ||
                s.id ||
                s.uuid ||
                ""
              );
              if (sId && (sId === clientId || (clientUuid && sId === clientUuid))) return true;

              const sPhone = String(s.phone || (typeof s.client === "object" ? (s.client?.phone || s.client?.mobile) : "") || "").replace(/\D/g, "");
              if (clientPhone && sPhone && clientPhone.length >= 8 && sPhone.length >= 8 && (clientPhone === sPhone || clientPhone.endsWith(sPhone) || sPhone.endsWith(clientPhone))) {
                return true;
              }

              const sName = String(s.name || s.client_name || (typeof s.client === "object" ? (s.client?.name || s.client?.company_name) : "") || "").trim().toLowerCase();
              if (clientName && sName && clientName === sName) {
                return true;
              }

              return false;
            }) || {}
          );
        };

        const numFrom = (obj, ...keys) => {
          if (!obj) return null;
          for (const k of keys) {
            if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") {
              const n = Number(obj[k]);
              if (Number.isFinite(n)) return n;
            }
          }
          return null;
        };

        const getDirect = (map, client) => {
          const cId = String(client.id || "");
          const cUuid = String(client.uuid || "");
          const cPhone = String(client.phone || client.mobile || "").replace(/\D/g, "");
          let val = 0;
          if (cId && map.has(cId)) val = Math.max(val, map.get(cId));
          if (cUuid && map.has(cUuid)) val = Math.max(val, map.get(cUuid));
          if (cPhone && cPhone.length >= 8 && map.has(`phone:${cPhone}`)) val = Math.max(val, map.get(`phone:${cPhone}`));
          return val;
        };

        const mergedData = data
          .map((client) => {
            const stats = findStats(client);

            const directSales = getDirect(clientSalesMap, client);
            const directReceive = getDirect(clientReceivesMap, client);
            const directReturn = getDirect(clientReturnsMap, client);

            const statsSales = numFrom(stats, "sales_amount", "sales", "total_sales", "bill");
            const statsReceive = numFrom(stats, "collection", "receive", "payment", "paid", "total_receive", "amount_received");
            const statsReturn = numFrom(stats, "return_amount", "sales_return");

            const sales = Math.max(statsSales ?? 0, directSales);
            const receive = Math.max(statsReceive ?? 0, directReceive);
            const sales_return = Math.max(statsReturn ?? 0, directReturn);

            const previous_due = Number(
              numFrom(client, "previous_due", "opening_balance", "opening_due") ??
              numFrom(stats, "previous_due", "opening_due", "opening_balance") ??
              0
            );

            const calculatedDue = previous_due + sales - receive - sales_return;
            const statsDue = numFrom(stats, "due", "current_due", "balance", "total_due", "due_amount");
            const due = (statsDue !== null && statsDue !== undefined) ? statsDue : calculatedDue;

            return {
              ...client,
              previous_due,
              sales,
              receive,
              sales_return,
              due,
              due_date: client.due_date || stats.due_date,
            };
          })
          .filter((c) => {
            const hasDue = Number(c.due !== undefined && c.due !== null ? c.due : (c.previous_due || 0)) > 0;
            const hasDate = Boolean(c.due_date);
            if (!hasDue || !hasDate) return false;

            const cDate = String(c.due_date).split("T")[0];
            if (filters.startDate && cDate < filters.startDate) return false;
            if (filters.endDate && cDate > filters.endDate) return false;

            return true;
          })
          .sort((a, b) => {
            const dateA = new Date(a.due_date || 0);
            const dateB = new Date(b.due_date || 0);
            return dateA - dateB;
          });
        setClients(mergedData);
      } catch (err) {
        console.error("Failed to fetch client stats", err);
        setClients(data);
      }
    } catch (err) {
      toast.error(err?.message || t("Failed to load clients"));
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClients();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [
    filters.searchAll,
    filters.clientGroup,
    filters.startDate,
    filters.endDate,
  ]);

  const handleClearFilter = () => {
    setFilters({
      searchAll: "",
      clientGroup: "",
      startDate: "",
      endDate: "",
    });
    fetchClients();
  };

  const handleReset = () => {
    handleClearFilter();
    setEntries(25);
  };

  const handleExportExcel = () => {
    const dataToExport = clients.map((c, i) => ({
      SL: i + 1,
      "Client Code": c.client_code || c.code || "-",
      "Company Name": c.company_name || c.name || "-",
      "Owner Name": c.owner_name || c.name || "-",
      Phone: c.phone || c.mobile || "-",
      Address: c.address || "-",
      Group: c.group || c.group_name || "-",
      "Due Date": dateOf(c) || "-",
      "Due Amount": c.due_amount || c.balance || 0,
    }));
    exportToExcel(dataToExport, "Due_Collection_Date_Report");
  };

  return (
    <div className="dashboard-content">
      <PrintHeader />
      <div className="chart-card">
        {/* Header */}
        <div className="card-header">
          <h2 className="card-title" style={{ fontSize: "var(--fs-18, 18px)" }}>
            বাকি সংগ্রহের তারিখ
          </h2>
          <div className="card-actions">
            <button
              className="btn btn-outline"
              onClick={() => navigate(-1)}
              style={{
                padding: "6px 12px",
                background: "var(--table-header-bg)",
                color: "white",
              }}
            >
              <ArrowLeft size={14} /> {t("Go Back")}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => navigate("/crm/client-group")}
              style={{
                padding: "6px 12px",
                background: "var(--table-header-bg)",
                color: "white",
              }}
            >
              <Users size={14} /> {t("Client Group")}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/crm/client-create")}
              style={{ padding: "6px 12px", background: "var(--success)" }}
            >
              <Plus size={14} /> {t("Add New")}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div
          className="form-grid"
          style={{
            gridTemplateColumns: "1fr 1.5fr 1.5fr 1fr",
            marginBottom: "24px",
            alignItems: "flex-end",
          }}
        >
          <div className="form-group" style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                top: "-10px",
                left: "12px",
                background: "var(--info)",
                color: "white",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "var(--fs-10, 10px)",
                zIndex: 1,
              }}
            >
              {t("Search All")}
            </div>
            <div className="form-input floating-label">
              <input
                type="text"
                name="searchAll"
                value={filters.searchAll}
                onChange={handleInputChange}
                placeholder=" "
                style={{ paddingLeft: "8px" }}
              />
              <label>{t("Search All")}</label>
            </div>
          </div>

          <div className="form-group">
            <label
              style={{
                fontSize: "var(--fs-12, 12px)",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              {t("Search By Client Group")}
            </label>
            <div className="form-input floating-label">
              <select
                name="clientGroup"
                value={filters.clientGroup}
                onChange={handleInputChange}
              >
                <option value="">{t("Select client group")}</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label
              style={{
                fontSize: "var(--fs-12, 12px)",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              {t("common.search_by_date")}
            </label>
            <div style={{ display: "flex", gap: "12px" }}>
              <div className="form-input floating-label" style={{ flex: 1 }}>
                <CustomDatePicker
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleInputChange}
                  style={{ fontSize: "var(--fs-13, 13px)" }}
                />
              </div>
              <div className="form-input floating-label" style={{ flex: 1 }}>
                <CustomDatePicker
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleInputChange}
                  style={{ fontSize: "var(--fs-13, 13px)" }}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <button
              className="btn btn-outline"
              onClick={handleClearFilter}
              style={{
                height: "48px",
                width: "100%",
                background: "var(--table-header-bg)",
                color: "white",
                justifyContent: "center",
              }}
            >
              {t("Clear Filter")}
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontSize: "var(--fs-14, 14px)",
              color: "var(--text-main)",
            }}
          >
            {t("Show")}
            <select
              value={entries}
              onChange={(e) => setEntries(Number(e.target.value))}
              style={{
                margin: "0 8px",
                padding: "4px",
                border: "1px solid var(--secondary)",
                borderRadius: "4px",
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            {t("entries")}
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              className="btn"
              onClick={handleExportExcel}
              style={{
                background: "#059669",
                color: "white",
                padding: "6px 12px",
                fontSize: "var(--fs-12, 12px)",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              <FileSpreadsheet size={14} style={{ marginRight: "4px" }} />{" "}
              {t("Excel")}
            </button>
            <button
              className="btn"
              onClick={() => window.print()}
              style={{
                background: "var(--primary)",
                color: "white",
                padding: "6px 12px",
                fontSize: "var(--fs-12, 12px)",
                borderRadius: "4px",
              }}
            >
              <Printer size={14} style={{ marginRight: "4px" }} />{" "}
              {t("common.print")}
            </button>
            <button
              className="btn"
              onClick={handleReset}
              style={{
                background: "var(--primary)",
                color: "white",
                padding: "6px 12px",
                fontSize: "var(--fs-12, 12px)",
                borderRadius: "4px",
              }}
            >
              <RotateCcw size={14} style={{ marginRight: "4px" }} />{" "}
              {t("common.reset")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            overflowX: "auto",
            border: "1px solid var(--secondary)",
            borderRadius: "4px",
            marginBottom: "16px",
          }}
        >
          <table
            className="custom-table"
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <thead>
              <tr
                style={{ background: "var(--table-header-bg)", color: "white" }}
              >
                <th
                  style={{
                    padding: "12px",
                    fontSize: "var(--fs-11, 11px)",
                    textAlign: "left",
                    borderRight: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {t("ID NO ↕")}
                </th>
                <th
                  style={{
                    padding: "12px",
                    fontSize: "var(--fs-11, 11px)",
                    textAlign: "left",
                    borderRight: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {t("NAME ↕")}
                </th>
                <th
                  style={{
                    padding: "12px",
                    fontSize: "var(--fs-11, 11px)",
                    textAlign: "left",
                    borderRight: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {t("ADDRESS ↕")}
                </th>
                <th
                  style={{
                    padding: "12px",
                    fontSize: "var(--fs-11, 11px)",
                    textAlign: "left",
                    borderRight: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {t("PREVIOUS DUE ↕")}
                </th>
                <th
                  style={{
                    padding: "12px",
                    fontSize: "var(--fs-11, 11px)",
                    textAlign: "left",
                    borderRight: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {t("SALES ↕")}
                </th>
                <th
                  style={{
                    padding: "12px",
                    fontSize: "var(--fs-11, 11px)",
                    textAlign: "left",
                    borderRight: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {t("RECEIVE ↕")}
                </th>
                <th
                  style={{
                    padding: "12px",
                    fontSize: "var(--fs-11, 11px)",
                    textAlign: "left",
                    borderRight: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {t("RETURN ↕")}
                </th>
                <th
                  style={{
                    padding: "12px",
                    fontSize: "var(--fs-11, 11px)",
                    textAlign: "left",
                    borderRight: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {t("sidebar.due_collection_date")} ↕
                </th>
                <th
                  style={{
                    padding: "12px",
                    fontSize: "var(--fs-11, 11px)",
                    textAlign: "left",
                  }}
                >
                  {t("DUE ↕")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {t("Loading...")}
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {t("No data available in table")}
                  </td>
                </tr>
              ) : (
                clients.slice(0, entries).map((client, index) => (
                  <tr
                    key={client.id || index}
                    style={{ borderBottom: "1px solid #e2e8f0" }}
                  >
                    <td style={{ textAlign: "left", padding: "8px 12px" }}>
                      {index + 1}
                    </td>
                    <td style={{ textAlign: "left", padding: "8px 12px" }}>
                      <div style={{ fontWeight: "600", color: "#1e293b" }}>
                        {(client.name || client.company_name || "-").replace(/\|.*/, "").trim()}
                      </div>
                      {(client.phone || client.mobile || (client.name && client.name.includes("|"))) && (
                        <div
                          style={{
                            fontSize: "var(--fs-12, 12px)",
                            color: "#64748b",
                            marginTop: "2px",
                            fontWeight: "normal",
                          }}
                        >
                          {client.phone || client.mobile || client.name.split("|")[1].trim()}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: "left", padding: "8px 12px" }}>
                      {client.address || "-"}
                    </td>
                    <td style={{ textAlign: "left", padding: "8px 12px" }}>
                      {Number(client.previous_due || 0).toFixed(2)}
                    </td>
                    <td style={{ textAlign: "left", padding: "8px 12px" }}>
                      {Number(client.sales || 0).toFixed(2)}
                    </td>
                    <td style={{ textAlign: "left", padding: "8px 12px" }}>
                      {Number(client.receive || 0).toFixed(2)}
                    </td>
                    <td style={{ textAlign: "left", padding: "8px 12px" }}>
                      {Number(client.sales_return || 0).toFixed(2)}
                    </td>
                    <td style={{ textAlign: "left", padding: "8px 12px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <CustomDatePicker
                          value={dateOf(client)}
                          onChange={(e) => saveDate(client, e.target.value)}
                          style={{
                            padding: "4px",
                            border: "1px solid #e2e8f0",
                            background: "white",
                            outline: "none",
                            fontSize: "var(--fs-12, 12px)",
                            color: "#475569",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        />
                        <button
                          onClick={() =>
                            navigate("/crm/client-statement", {
                              state: { clientId: client.id || client.uuid },
                            })
                          }
                          style={{
                            background: "#059669",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "var(--fs-11, 11px)",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          Statement
                        </button>
                      </div>
                    </td>
                    <td style={{ textAlign: "left", padding: "8px 12px", fontWeight: "600" }}>
                      {Number(client.due !== undefined && client.due !== null ? client.due : (client.previous_due || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: "var(--fs-14, 14px)",
              color: "var(--text-main)",
            }}
          >
            {t("Showing {{from}} to {{to}} of {{total}} entries", {
              from: clients.length > 0 ? 1 : 0,
              to: Math.min(clients.length, entries),
              total: clients.length,
            })}
          </div>
          <div
            style={{
              display: "flex",
              border: "1px solid #e2e8f0",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <button
              style={{
                padding: "6px 12px",
                background: "var(--card-header-bg)",
                border: "none",
                borderRight: "1px solid #e2e8f0",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: "var(--fs-14, 14px)",
              }}
            >
              {t("Previous")}
            </button>
            <button
              style={{
                padding: "6px 12px",
                background: "#3b82f6",
                border: "none",
                borderRight: "1px solid #e2e8f0",
                color: "white",
                cursor: "pointer",
                fontSize: "var(--fs-14, 14px)",
              }}
            >
              1
            </button>
            <button
              style={{
                padding: "6px 12px",
                background: "var(--card-header-bg)",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: "var(--fs-14, 14px)",
              }}
            >
              {t("Next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DueCollectionDate;

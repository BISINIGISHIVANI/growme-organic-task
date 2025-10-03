import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./App.css";
import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";

function App() {
  const [products, setProducts] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyState, setLazyState] = useState({
    first: 0,
    rows: 12,
    page: 1,
  });
  const [loading, setLoading] = useState(false);
  const [selectCount, setSelectCount] = useState();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [pendingSelection, setPendingSelection] = useState(null);

  const op = useRef(null);

  const titleHeaderTemplate = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        cursor: "pointer",
      }}
    >
      <i
        className="pi pi-angle-down"
        onMouseEnter={(e) => op.current.toggle(e)}
      />
      <span>Title</span>
    </div>
  );

  const fetchTableData = async (page) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `https://api.artic.edu/api/v1/artworks?page=${page}`
      );

      const mapped = res.data.data.map((item, index) => ({
        no: lazyState.first + index + 1,
        id: item.id,
        name: item.title,
        place: item.place_of_origin,
        artist: item.artist_display || "Unknown",
        inscriptions: item.inscriptions || "-",
        startDate: item.date_start || "-",
        endDate: item.date_end || "-",
      }));
      if (
        pendingSelection &&
        page >= pendingSelection.startPage &&
        pendingSelection.remaining > 0
      ) {
        const newSelectedIds = new Set(selectedIds);
        let collected = 0;

        for (
          let i = 0;
          i < mapped.length && collected < pendingSelection.remaining;
          i++
        ) {
          newSelectedIds.add(mapped[i].id);
          collected++;
        }

        setSelectedIds(newSelectedIds);
        setPendingSelection({
          startPage: page + 1,
          remaining: pendingSelection.remaining - collected,
        });
      }

      setProducts(mapped);
      setTotalRecords(res.data.pagination.total);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData(lazyState.page, lazyState.rows);
  }, [lazyState]);

  const onPage = (event) => {
    setLazyState({
      ...lazyState,
      first: event.first,
      rows: event.rows,
      page: event.page + 1,
    });
  };

  const onSelectionChange = (selectedRows) => {
    const newSelectedIds = new Set(selectedIds);

    selectedRows.forEach((row) => newSelectedIds.add(row.id));

    products.forEach((row) => {
      if (!selectedRows.find((r) => r.id === row.id)) {
        newSelectedIds.delete(row.id);
      }
    });

    setSelectedIds(newSelectedIds);
  };

  const handleOverlayOk = () => {
    if (!selectCount) return;

    const newSelectedIds = new Set(selectedIds);

    let collected = 0;
    for (let i = 0; i < products.length && collected < selectCount; i++) {
      newSelectedIds.add(products[i].id);
      collected++;
    }

    if (collected < selectCount) {
      setPendingSelection({
        startPage: lazyState.page + 1,
        remaining: selectCount - collected,
      });
    }

    setSelectedIds(newSelectedIds);
    setSelectCount(null);
    op.current.hide();
  };

  return (
    <>
      <h1>Prime React - Artworks</h1>
      <DataTable
        value={products}
        selectionMode="checkbox"
        selection={products.filter((p) => selectedIds.has(p.id))}
        onSelectionChange={(e) => onSelectionChange(e.value)}
        dataKey="id"
        tableStyle={{ minWidth: "50rem" }}
        lazy
        paginator
        first={lazyState.first}
        rows={lazyState.rows}
        totalRecords={totalRecords}
        onPage={onPage}
        loading={loading}
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
        <Column field="name" header={titleHeaderTemplate()} />
        <Column field="place" header="Place" />
        <Column field="artist" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="startDate" header="Start Date" />
        <Column field="endDate" header="End Date" />
      </DataTable>

      <OverlayPanel ref={op}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            padding: "0.5rem",
          }}
        >
          <InputNumber
            id="selectCount"
            value={selectCount}
            onValueChange={(e) => setSelectCount(e.value)}
            min={1}
            placeholder="Select rows..."
          />
          <Button
            label="Submit"
            onClick={handleOverlayOk}
            style={{ alignSelf: "flex-end" }}
          />
        </div>
      </OverlayPanel>
    </>
  );
}

export default App;

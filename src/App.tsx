import { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';

import 'primereact/resources/themes/md-light-deeppurple/theme.css';
import 'primeicons/primeicons.css';
import './App.css';

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

interface PaginationState {
  first: number;
  limit: number;
  page: number;
  total: number;
}

function App() {
  const [data, setData] = useState<Artwork[]>([]);
  const [selection, setSelection] = useState<Artwork[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    first: 0,
    limit: 5,
    page: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectRowCount, setSelectRowCount] = useState(0);
  const op = useRef<OverlayPanel>(null);

  const fetchPage = useCallback(async (page: number, limit: number) => {
    try {
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${page}&limit=${limit}&fields=title,place_of_origin,artist_display,inscriptions,date_start,date_end`
      );
      const responseData = await response.json();
      return {
        data: responseData.data,
        pagination: {
          current_page: responseData.pagination.current_page,
          limit: responseData.pagination.limit,
          total: responseData.pagination.total,
        },
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  }, []);

  const fetchMultiplePages = useCallback(
    async (rowCount: number) => {
      setLoading(true);

      const pagesNeeded = Math.ceil(rowCount / pagination.limit);
      const fetchedData: Artwork[] = [];

      for (let page = 1; page <= pagesNeeded; page++) {
        const result = await fetchPage(page, pagination.limit);

        if (result) {
          if (page === 1) {
            setPagination((prev) => ({
              ...prev,
              total: result.pagination.total,
            }));
          }

          fetchedData.push(...result.data);
        }
      }

      const slicedData = fetchedData.slice(0, rowCount);

      setSelection(slicedData);
      setLoading(false);
    },
    [fetchPage, pagination.limit]
  );

  const getData = useCallback(
    async (page: number, limit: number) => {
      try {
        setLoading(true);
        const result = await fetchPage(page, limit);

        if (result) {
          setPagination(() => ({
            first:
              (result.pagination.current_page - 1) * result.pagination.limit,
            limit: result.pagination.limit,
            page: result.pagination.current_page,
            total: result.pagination.total,
          }));

          setData(result.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [fetchPage]
  );

  const onPageChange = async (event: PaginatorPageChangeEvent) => {
    getData(event.page + 1, event.rows);
  };

  const handleSelectRows = () => {
    fetchMultiplePages(selectRowCount);
  };

  useEffect(() => {
    getData(1, pagination.limit);
  }, [getData]);

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        loading={loading}
        value={data}
        tableStyle={{ minWidth: '60rem' }}
        stripedRows
        selection={selection}
        selectionMode="multiple"
        onSelectionChange={(e) => setSelection(e.value)}
        showGridlines
      >
        <Column
          selectionMode="multiple"
          headerStyle={{ width: '10rem' }}
          header={
            <>
              <Button
                onClick={(e) => op && op.current && op.current.toggle(e)}
                icon="pi pi-chevron-down"
                size="small"
                style={{
                  marginRight: '0.5rem',
                }}
              />
              <OverlayPanel ref={op}>
                <div className="flex items-center gap-3">
                  <InputNumber
                    value={selectRowCount}
                    onValueChange={(e) => setSelectRowCount(e.value || 0)}
                    placeholder="Number of rows to select"
                    min={0}
                    max={pagination.total}
                  />
                  <Button
                    label="Select Rows"
                    onClick={handleSelectRows}
                    disabled={loading}
                  />
                </div>
              </OverlayPanel>
            </>
          }
        ></Column>
        <Column
          field="title"
          header="Title"
        ></Column>
        <Column
          field="place_of_origin"
          header="Place of Origin"
        ></Column>
        <Column
          field="artist_display"
          header="Artist Display"
        ></Column>
        <Column
          field="inscriptions"
          header="Inscriptions"
        ></Column>
        <Column
          field="date_start"
          header="Date Start"
        ></Column>
        <Column
          field="date_end"
          header="Date End"
        ></Column>
      </DataTable>

      <Paginator
        first={pagination.first}
        rows={pagination.limit}
        totalRecords={pagination.total}
        rowsPerPageOptions={[5, 10, 20, 30]}
        onPageChange={onPageChange}
      />
    </div>
  );
}

export default App;

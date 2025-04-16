import { Link, useLocation } from 'react-router-dom';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconPlus from '../../components/Icon/IconPlus';
import Dropdown from '../../components/Dropdown';
import IconCaretDown from '../../components/Icon/IconCaretDown';
import Swal from 'sweetalert2';
import { useDeleteCategoryMutation, useGetCategoriesQuery } from '../../redux/features/categories/categoriesApi';
import { capitalizeFirstLetter, deleteConfirmation } from '../../components/tools';

const CategoriesList = () => {
    // entity localstorage
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);
    const storeId = pathnames[0];
    const entity = pathnames[1];
    const entityCols = `${entity}_cols`; 
    const entityPage = `${entity}_page`; 
    const entitySort = `${entity}_sort`; 
    const entityFilterColumn = `${entity}_filter_column`; 
    const entityFilterValue= `${entity}_filter_value`; 

    // state 
    const [page, setPage] = useState<number>(() => {
        const storedPage = localStorage.getItem(entityPage);
        return storedPage ? parseInt(storedPage, 10) : 1; // Konversi ke number, default ke 1
    });
    const [search, setSearch] = useState(() => {
        return localStorage.getItem(`${entity}_search`) || '';
    });
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>(() => {
        const storedSort = localStorage.getItem(`${entitySort}`);
        return storedSort
            ? JSON.parse(storedSort) 
            : { columnAccessor: 'created_at', direction: 'desc' }; 
    });
    const dispatch = useDispatch();
    const [items, setItems] = useState<any[]>([]);
    const [total, setTotal] = useState();
    const [deleteCategory] = useDeleteCategoryMutation();
    const [hideCols, setHideCols] = useState<string[]>([]);
    const [selectedColumn, setSelectedColumn] = useState<string>(() => {
        return localStorage.getItem(`${entity}_filter_column`) || '';
    }); // Kolom yang difilter
    const [filterValue, setFilterValue] = useState<string>(() => {
        return localStorage.getItem(`${entity}_filter_value`) || '';
    }); // nilai filter
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;

    // page
    const [pageSize, setPageSize] = useState(10);
    const [initialRecords, setInitialRecords] = useState<any[]>([]);
    const [records, setRecords] = useState(initialRecords);
    const [selectedRecords, setSelectedRecords] = useState<any>([]);

    // Ambil data 
    const { data, refetch } = useGetCategoriesQuery(
        { 
            storeId: storeId,
            page, 
            search,
            sort: sortStatus.columnAccessor,
            direction: sortStatus.direction,
            filterColumn: selectedColumn,  
            filterValue: filterValue    
        },
        { refetchOnMountOrArgChange: true } 
    );
    // Kolom tabel
    const cols = [
        { accessor: 'no', title: 'No' },
        { accessor: 'name', title: 'Name' },
        { accessor: 'slug', title: 'Slug' },
        { accessor: 'created_at', title: 'Created At' },
    ];

    /*****************************
     * search 
     */

    // Simpan perubahan search ke localStorage
    useEffect(() => {
        localStorage.setItem(`${entity}_search`, search);
    }, [search]);

    /*****************************
     * filter 
     */

    // Simpan perubahan filter ke localStorage
    useEffect(() => {
        localStorage.setItem(entityFilterColumn, selectedColumn);
        localStorage.setItem(entityFilterValue, filterValue);
    }, [selectedColumn, filterValue]);

    /*****************************
     * sort 
     */

    // Simpan perubahan sorting ke localStorage
    useEffect(() => {
        localStorage.setItem(`${entitySort}`, JSON.stringify(sortStatus));
    }, [sortStatus]);

    // Ambil sort dari localStorage saat pertama render
    useEffect(() => {
        const storedSort = localStorage.getItem(`${entitySort}`);
        if (storedSort) {
            setSortStatus(JSON.parse(storedSort));
        }
    }, []);

    /*****************************
     * delete 
     */

    // Hapus data
    const deleteRow = () => {
        deleteConfirmation(selectedRecords, deleteCategory, refetch, storeId);
    };

    /*****************************
     * page 
     */

    // Atur ulang record saat data item berubah
    useEffect(() => {
        setInitialRecords(items)
    }, [items]);

    // Muat data awal dari localStorage saat komponen pertama kali dirender
    useEffect(() => {
        const storedPage = localStorage.getItem(entityPage);
        if (storedPage) {
            setPage(Number(storedPage));
        }
    }, []);

    // Simpan nilai `page` ke localStorage saat berubah
    useEffect(() => {
        localStorage.setItem(entityPage, String(page));
    }, [page]);

    // Perbarui data `records` setiap kali `page` atau `pageSize` berubah
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords(initialRecords);
    }, [page, pageSize, initialRecords]);

    /*****************************
     * items 
     */

    // Mapping data dari API agar sesuai dengan kolom
    useEffect(() => {
        if (data?.data) {
            const mappedItems = data.data.map((d: any, index: number) => {
                // Buat objek berdasarkan kolom yang telah didefinisikan
                let mappedObject: { [key: string]: any } = {
                    id: d.id,
                };

                cols.forEach(col => {
                    if (col.accessor === 'created_at') {
                        mappedObject[col.accessor] = new Intl.DateTimeFormat('id-ID', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            timeZone: 'Asia/Jakarta',
                        }).format(new Date(d[col.accessor]));

                    } else if (col.accessor === 'no') {
                       mappedObject[col.accessor] = (index + 1) + ((page - 1) * pageSize)

                    } else {
                        mappedObject[col.accessor] = d[col.accessor];
                    }
                });

                return mappedObject;
            });

            setItems(mappedItems);
            setTotal(data.total);
        }
    }, [data, page, pageSize]);

    // Mengatur judul halaman
    useEffect(() => {
        dispatch(setPageTitle('Users'));
    }, [dispatch]);

    /*****************************
     * checkbox hide show
     */

    // Memuat data dari localStorage saat komponen pertama kali dirender
    useEffect(() => {
        const storedCols = localStorage.getItem(entityCols);
        if (storedCols) {
            setHideCols(JSON.parse(storedCols));
        }
    }, []);

    // Fungsi untuk mengatur kolom yang disembunyikan
    const showHideColumns = (col: string) => {
        const updatedCols = hideCols.includes(col)
            ? hideCols.filter((d) => d !== col) // Hapus kolom dari daftar
            : [...hideCols, col]; // Tambahkan kolom ke daftar

        setHideCols(updatedCols);

        // Simpan data terbaru ke localStorage
        localStorage.setItem(entityCols, JSON.stringify(updatedCols));
    };

    return (
        <div>
            {/* Header dengan judul dan button Delete & create */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                <h2 className="text-xl">{capitalizeFirstLetter(entity)}</h2>
                <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
                    <div className="relative">
                        <div className="flex items-center gap-2">
                            {/* button hapus */}
                            <button type="button" className="btn btn-danger gap-2" onClick={() => deleteRow()}>
                                <IconTrashLines />
                                Delete
                            </button>
                            {/* button menuju halaman create */}
                            <Link to={`/${storeId}/${entity}/create`} className="btn btn-primary gap-2">
                                <IconPlus />
                                Add New
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            {/* Panel tabel */}
            <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
                <div className="invoice-table">
                    {/* Filter dan dropdown */}
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <div className="flex md:items-center md:flex-row flex-col gap-5">
                            {/* Dropdown untuk memilih kolom yang ditampilkan/disembunyikan */}
                            <div className="dropdown">
                                <Dropdown
                                    placement={`${isRtl ? 'bottom-end' : 'bottom-start'}`}
                                    btnClassName="!flex items-center border font-semibold border-white-light dark:border-[#253b5c] rounded-md px-4 py-2 text-sm dark:bg-[#1b2e4b] dark:text-white-dark"
                                    button={
                                        <>
                                            <span className="ltr:mr-1 rtl:ml-1">Columns</span>
                                            <IconCaretDown className="w-5 h-5" />
                                        </>
                                    }
                                >
                                    <ul className="!min-w-[140px]">
                                        {cols.map((col, i) => {
                                            return (
                                                <li
                                                    key={i}
                                                    className="flex flex-col"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Mencegah dropdown tertutup saat klik checkbox
                                                    }}
                                                >
                                                    <div className="flex items-center px-4 py-1">
                                                        <label className="cursor-pointer mb-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={!hideCols.includes(col.accessor)} // Status checkbox berdasarkan kolom yang disembunyikan
                                                                className="form-checkbox"
                                                                defaultValue={col.accessor}
                                                                onChange={(event: any) => {
                                                                    setHideCols(event.target.value); // Atur nilai hideCols saat checkbox berubah
                                                                    showHideColumns(col.accessor); // Panggil fungsi untuk tampil/sembunyikan kolom
                                                                }}
                                                            />
                                                            <span className="ltr:ml-2 rtl:mr-2">{col.title}</span>
                                                        </label>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </Dropdown>
                            </div>
                        </div>

                        {/* Dropdown Pilih Kolom + Input Filter */}
                        <div className="flex gap-3">
                            {/* Pilih kolom yang ingin difilter */}
                            <select 
                                value={selectedColumn} 
                                onChange={(e) => setSelectedColumn(e.target.value)}
                                className="form-select"
                            >
                                <option value="">Column Filter</option>
                                {cols
                                    .filter(col => col.accessor !== "no" && col.accessor !== "photo" && col.accessor !== "created_at") / Hilangkan "No" & "Created At"
                                    .map(col => (
                                        <option key={col.accessor} value={col.accessor}>{col.title}</option>
                                    ))
                                }
                            </select>

                            {/* Input untuk nilai filter */}
                            <input 
                                type="text"
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                placeholder="Enter value filter"
                                className="form-input"
                            />
                        </div>
                        
                        {/* Input pencarian umum */}
                        <div className="ltr:ml-auto rtl:mr-auto">
                            <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>

                    {/* Tabel */}
                    <div className="datatables pagination-padding">
                        <DataTable
                            className="whitespace-nowrap table-hover invoice-table"
                            records={records} // Data yang akan ditampilkan
                            columns={[
                                {
                                    accessor: 'no',
                                    hidden: hideCols.includes('no'), // Sembunyikan kolom jika termasuk dalam hideCols
                                },
                                {
                                    accessor: 'name',
                                    sortable: true,
                                    hidden: hideCols.includes('name'), // Sembunyikan kolom jika termasuk dalam hideCols
                                    render: ({ name, id}) => {
                                        return (
                                            <div className="flex items-center font-semibold">
                                                <div>
                                                    {/* Link menuju detail entitas */}
                                                    <a
                                                        href={`/${storeId}/${entity}/${id}`}
                                                        className="hover:underline"
                                                    >
                                                        {name}
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    },
                                },
                                {
                                    accessor: 'slug',
                                    sortable: true,
                                    hidden: hideCols.includes('slug'),
                                },
                                {
                                    accessor: 'created_at',
                                    sortable: true,
                                    hidden: hideCols.includes('created_at'),
                                },
                            ]}
                            highlightOnHover // Efek hover pada baris
                            totalRecords={total} // Total seluruh data (untuk pagination)
                            recordsPerPage={pageSize} // Jumlah data per halaman
                            page={page} // Halaman saat ini
                            onPageChange={(p) => setPage(p)} // Fungsi ubah halaman
                            sortStatus={sortStatus} // Status pengurutan kolom
                            onSortStatusChange={setSortStatus} // Ubah pengurutan kolom
                            selectedRecords={selectedRecords} // Data yang dipilih (checkbox)
                            onSelectedRecordsChange={setSelectedRecords} // Atur data yang dipilih
                            paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`} // Format teks pagination
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoriesList;
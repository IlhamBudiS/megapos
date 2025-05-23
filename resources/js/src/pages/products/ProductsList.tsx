import React from 'react';
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
import { useDeleteProductMutation, useGetProductsQuery } from '../../redux/features/products/productsApi';
import { capitalizeFirstLetter, deleteConfirmation } from '../../components/tools';

const ProductsList= () => {
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

    // Simpan halaman aktif
    const [page, setPage] = useState<number>(() => {
        const storedPage = localStorage.getItem(entityPage);
        return storedPage ? parseInt(storedPage, 10) : 1; // Konversi ke number, default ke 1
    });
    // Simpan kata kunci pencarian
    const [search, setSearch] = useState(() => {
        return localStorage.getItem(`${entity}_search`) || '';
    });
    // Status sorting kolom
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>(() => {
        const storedSort = localStorage.getItem(`${entitySort}`);
        return storedSort
            ? JSON.parse(storedSort) 
            : { columnAccessor: 'created_at', direction: 'desc' }; 
    });
    const dispatch = useDispatch();
    // State data utama
    const [items, setItems] = useState<any[]>([]);
    const [total, setTotal] = useState();
    // API delete
    const [deleteProduct] = useDeleteProductMutation();
    // Menyimpan kolom yang disembunyikan
    const [hideCols, setHideCols] = useState<string[]>([]);
    // Cek RTL
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;
    // Kolom yang difilter
    const [selectedColumn, setSelectedColumn] = useState<string>(() => {
        return localStorage.getItem(`${entity}_filter_column`) || '';
    }); // Kolom yang difilter
    // Nilai yang digunakan untuk filter
    const [filterValue, setFilterValue] = useState<string>(() => {
        return localStorage.getItem(`${entity}_filter_value`) || '';
    }); // nilai filter

    // Pagination dan record management
    const [pageSize, setPageSize] = useState(10);
    const [initialRecords, setInitialRecords] = useState<any[]>([]);
    const [records, setRecords] = useState(initialRecords);
    const [selectedRecords, setSelectedRecords] = useState<any>([]);

    // Fetch data produk
    const { data, refetch } = useGetProductsQuery(
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
    // Kolom 
    const cols = [
        { accessor: 'no', title: 'No' },
        { accessor: 'product_name', title: 'Product Name' },
        { accessor: 'upc_barcode', title: 'UPC Barcode' },
        { accessor: 'category', title: 'Category' },
        { accessor: 'supplier', title: 'Supplier' },
        { accessor: 'unit', title: 'Unit' },
        { accessor: 'product_image', title: 'Product Image' },
        { accessor: 'description', title: 'Description' },
        { accessor: 'discount_normal', title: 'Discount Normal' },
        { accessor: 'discount_member', title: 'Discount Member' },
        { accessor: 'created_at', title: 'Created At' },
    ];

    /*****************************
     * search 
     */

    // Simpan nilai pencarian ke localStorage
    useEffect(() => {
        localStorage.setItem(`${entity}_search`, search);
    }, [search]);

    /*****************************
     * filter 
     */

    // Simpan filter ke localStorage
    useEffect(() => {
        localStorage.setItem(entityFilterColumn, selectedColumn);
        localStorage.setItem(entityFilterValue, filterValue);
    }, [selectedColumn, filterValue]);

    /*****************************
     * sort 
     */

    // Simpan sorting ke localStorage
    useEffect(() => {
        localStorage.setItem(`${entitySort}`, JSON.stringify(sortStatus));
    }, [sortStatus]);

    // Ambil ulang sort dari localStorage saat pertama kali render
    useEffect(() => {
        const storedSort = localStorage.getItem(`${entitySort}`);
        if (storedSort) {
            setSortStatus(JSON.parse(storedSort));
        }
    }, []);

    /*****************************
     * delete 
     */

    // Fungsi hapus produk
    const deleteRow = () => {
        deleteConfirmation(selectedRecords, deleteProduct, refetch, storeId);
    };

    /*****************************
     * page 
     */

    // Set initial record dari items setiap kali items berubah
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

    // Mapping data produk dari response API
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
                    } else if (col.accessor === 'product_image') {
                        mappedObject[col.accessor] = d.product_image
                            ? d.product_image.startsWith('http') 
                                ? d.product_image // Jika merupakan URL online, gunakan langsung
                                : `${import.meta.env.VITE_SERVER_URI_BASE}storage/${entity}/${d.product_image}` // Jika merupakan path di server, tambahkan base URL
                            : '/assets/images/blank_product.png'; // Jika tidak ada gambar, pakai placeholder

                    } else if (col.accessor === 'category') {
                        mappedObject[col.accessor] =  d.category?.name ?? '-';

                    } else if (col.accessor === 'supplier') {
                        mappedObject[col.accessor] =  d.supplier?.name ?? '-';

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
            {/* Header Title dan Aksi Tambah / Hapus */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                {/* Judul, misal: Product, Category, dll */}
                <h2 className="text-xl">{capitalizeFirstLetter(entity)}</h2>
                {/* button Aksi - Delete & Add */}
                <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
                    <div className="relative">
                        <div className="flex items-center gap-2">
                            {/* button Hapus Data Terpilih */}
                            <button type="button" className="btn btn-danger gap-2" onClick={() => deleteRow()}>
                                <IconTrashLines />
                                Delete
                            </button>
                            {/* button Tambah Data Baru */}
                            <Link to={`/${storeId}/${entity}/create`} className="btn btn-primary gap-2">
                                <IconPlus />
                                Add New
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            {/* Panel Container Tabel */}
            <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
                <div className="invoice-table">
                    {/* Filter & Search Area */}
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        {/* Dropdown Columns */}
                        <div className="flex md:items-center md:flex-row flex-col gap-5">
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
                                    <ul className="!min-w-max">
                                        {cols
                                            .filter(col => 
                                                col.accessor !== "no" && 
                                                col.accessor !== "photo" && 
                                                col.accessor !== "product_image" && 
                                                col.accessor !== "created_at"
                                            ) // Hilangkan "No" & "Created At"
                                            .map((col, i) => {
                                            return (
                                                <li
                                                    key={i}
                                                    className="flex flex-col"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                    }}
                                                >
                                                    <div className="flex items-center px-4 py-1">
                                                        <label className="cursor-pointer mb-0">
                                                            {/* Checkbox untuk show/hide kolom */}
                                                            <input
                                                                type="checkbox"
                                                                checked={!hideCols.includes(col.accessor)}
                                                                className="form-checkbox"
                                                                defaultValue={col.accessor}
                                                                onChange={(event: any) => {
                                                                    setHideCols(event.target.value);
                                                                    showHideColumns(col.accessor);
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
                            {/* Pilih kolom untuk difilter */}
                            <select 
                                value={selectedColumn} 
                                onChange={(e) => setSelectedColumn(e.target.value)}
                                className="form-select"
                            >
                                <option value="">Column Filter</option>
                                {cols
                                    .filter(col => 
                                        col.accessor !== "no" && 
                                        col.accessor !== "photo" && 
                                        col.accessor !== "product_image" && 
                                        col.accessor !== "created_at"
                                    ) // Hilangkan "No" & "Created At"
                                    .map(col => (
                                        <option key={col.accessor} value={col.accessor}>{col.title}</option>
                                    ))
                                }
                            </select>

                            {/* Input nilai filter */}
                            <input 
                                type="text"
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                placeholder="Enter value filter"
                                className="form-input"
                            />
                        </div>

                        {/* Pencarian */}
                        <div className="ltr:ml-auto rtl:mr-auto">
                            <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>

                    {/* Tabel Data */}
                    <div className="datatables pagination-padding">
                        <DataTable
                            className="whitespace-nowrap table-hover invoice-table"
                            records={records}
                            columns={[
                                {
                                    accessor: 'no',
                                    hidden: hideCols.includes('no'),
                                },
                                {
                                    accessor: 'name',
                                    sortable: true,
                                    hidden: hideCols.includes('name'),
                                    render: ({ product_name, id, product_image}) => {
                                        return (
                                            <div className="flex items-center font-semibold">
                                                <div className="p-0.5 bg-white-dark/30 rounded-md w-max ltr:mr-2 rtl:ml-2">
                                                {/* Gambar Produk */}
                                                    <img 
                                                        className="w-8 h-8 rounded-md overflow-hidden object-cover" 
                                                        src={product_image}
                                                        alt={product_name}
                                                    />
                                                </div>
                                                <div>
                                                    <a
                                                        href={`/${storeId}/${entity}/${id}`}
                                                        className="hover:underline"
                                                    >
                                                        {product_name}
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    },
                                },
                                {
                                    accessor: 'category',
                                    sortable: true,
                                    hidden: hideCols.includes('category'),
                                },
                                {
                                    accessor: 'supplier',
                                    sortable: true,
                                    hidden: hideCols.includes('supplier'),
                                },
                                {
                                    accessor: 'unit',
                                    sortable: true,
                                    hidden: hideCols.includes('unit'),
                                },
                                {
                                    accessor: 'description',
                                    sortable: true,
                                    hidden: hideCols.includes('description'),
                                    render: ({description}) => {
                                        return (
                                            <div className="!text-wrap min-w-60 max-w-[400px] overflow-hidden text-ellipsis line-clamp-2">
                                                {description}
                                            </div>
                                        );
                                    },
                                },
                                {
                                    accessor: 'discount_normal',
                                    sortable: true,
                                    hidden: hideCols.includes('discount_normal'),
                                    render: ({discount_normal}) => {
                                        return (
                                            <div>
                                                {discount_normal ?? 0}%
                                            </div>
                                        );
                                    },
                                },
                                {
                                    accessor: 'discount_member',
                                    sortable: true,
                                    hidden: hideCols.includes('discount_member'),
                                    render: ({discount_member}) => {
                                        return (
                                            <div>
                                                {discount_member ?? 0}%
                                            </div>
                                        );
                                    },
                                },
                                {
                                    accessor: 'created_at',
                                    sortable: true,
                                    hidden: hideCols.includes('created_at'),
                                },
                            ]}
                            highlightOnHover // Efek hover saat mouse di atas baris
                            totalRecords={total} // Total jumlah data
                            recordsPerPage={pageSize} // jumlah data per halaman
                            page={page} // halaman saat ini
                            onPageChange={(p) => setPage(p)} // update halaman ketika pindah
                            sortStatus={sortStatus} // Status sorting saat ini
                            onSortStatusChange={setSortStatus} // Fungsi untuk mengatur sorting
                            selectedRecords={selectedRecords} // data yang dipilih (checkbox)
                            onSelectedRecordsChange={setSelectedRecords} // update selected
                            paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`} // teks pagination
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductsList;
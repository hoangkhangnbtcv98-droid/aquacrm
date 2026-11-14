// =========================================================================
// 1. DỮ LIỆU MẪU CHUẨN & CẤU HÌNH BAN ĐẦU
// =========================================================================
const DEFAULT_DATA = {
    DS_DL: [
        { KHID: "DL01", tenkhach: "Đại Lý Thanh Tòng", Khu_Vuc: "Gành Hào - Đông Hải", SDT: "0918456789", DIA_CHI: "TT Gành Hào, Đông Hải", TT: "Đang Kinh Doanh", CK: "12%", Hang: "VIP" },
        { KHID: "DL02", tenkhach: "Đại Lý Ba Tuấn", Khu_Vuc: "Đầm Dơi - Cà Mau", SDT: "0945112233", DIA_CHI: "Chợ Đầm Dơi, Cà Mau", TT: "Đang Kinh Doanh", CK: "10%", Hang: "Cấp 1" },
        { KHID: "DL03", tenkhach: "Đại Lý Gia Lạc", Khu_Vuc: "Giá Rai - Bạc Liêu", SDT: "0939778899", DIA_CHI: "Hộ Phòng, Giá Rai", TT: "Đang Kinh Doanh", CK: "15%", Hang: "VIP" }
    ],
    SAN_PHAM: [
        { SPID: "SP01", tenSP: "Actigen", PHAN_LOAI: "Dinh Dưỡng Bổ Sung", DVT: "Thùng", GIA_THUNG: 3700000, View: "NET" },
        { SPID: "SP02", tenSP: "Basolus", PHAN_LOAI: "Chế Phẩm Sinh Học", DVT: "Thùng", GIA_THUNG: 3360000, View: "CK" },
        { SPID: "SP03", tenSP: "Ajkon", PHAN_LOAI: "Xử Lí Mần Bệnh", DVT: "Thùng", GIA_THUNG: 3120000, View: "NET" },
        { SPID: "SP04", tenSP: "Aqua C30", PHAN_LOAI: "Cải Thiện Môi Trường", DVT: "Thùng", GIA_THUNG: 2500000, View: "CK" }
    ],
    DON_HANG: [
        // Đơn năm trước (2025) để so sánh tăng trưởng
        { DHID: "DH2025-01", KHID: "DL01", Ngay: "2025-11-10", So_Luong: 5, Tong_Tien: 16800000, ThanhToan: 16800000, TrangThai: "Hoàn Thành", Loai_Hang: "CK" },
        { DHID: "DH2025-02", KHID: "DL02", Ngay: "2025-11-15", So_Luong: 4, Tong_Tien: 12480000, ThanhToan: 12480000, TrangThai: "Hoàn Thành", Loai_Hang: "NET" },
        // Đơn năm nay (2026)
        { DHID: "748aeb30", KHID: "DL01", Ngay: "2026-11-05", So_Luong: 3, Tong_Tien: 10080000, ThanhToan: 3630000, TrangThai: "Công Nợ", Loai_Hang: "CK" },
        { DHID: "693bad4b", KHID: "DL01", Ngay: "2026-11-10", So_Luong: 2, Tong_Tien: 7400000, ThanhToan: 3500000, TrangThai: "Công Nợ", Loai_Hang: "NET" },
        { DHID: "8bc025d3", KHID: "DL01", Ngay: "2026-11-12", So_Luong: 6, Tong_Tien: 20160000, ThanhToan: 1956000, TrangThai: "Công Nợ", Loai_Hang: "CK" },
        { DHID: "DH2026-04", KHID: "DL03", Ngay: "2026-11-14", So_Luong: 5, Tong_Tien: 18500000, ThanhToan: 18500000, TrangThai: "Hoàn Thành", Loai_Hang: "NET" }
    ],
    DON_HANG_CT: [],
    DS_KH: [
        { HNID: "HN01", tenHN: "Anh Quốc Anh", Khu_Vuc: "Gành Hào", So_ao: 3, Muc_Do: "Tiềm Năng", KQ: "Tôm 42 ngày phát triển tốt" }
    ],
    THU_NO: [
        { ID: "TN01", KHID: "DL01", Ngay: "2026-11-08", So_Tien: 5000000, Ghi_Chu: "Chuyển khoản đợt 1" }
    ]
};

let db = JSON.parse(localStorage.getItem('aqua_crm_db')) || JSON.parse(JSON.stringify(DEFAULT_DATA));
let gasUrl = localStorage.getItem('aqua_crm_gas_url') || '';
let salesTargets = JSON.parse(localStorage.getItem('aqua_crm_targets')) || { CK: 40000000, NET: 30000000 };
let orderCart = [];

// =========================================================================
// 2. KHỞI TẠO HỆ THỐNG & LƯU CẤU HÌNH QUA CÁC PHIÊN
// =========================================================================
window.onload = function() {
    if (gasUrl) {
        document.getElementById('gas-web-app-url').value = gasUrl;
        document.getElementById('sync-badge').innerText = 'Đã lưu URL Sheet';
        document.getElementById('sync-badge').className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700';
    }
    document.getElementById('input-target-ck').value = salesTargets.CK;
    document.getElementById('input-target-net').value = salesTargets.NET;
    refreshUI();
};

function saveLocalDB() {
    localStorage.setItem('aqua_crm_db', JSON.stringify(db));
}

function refreshUI() {
    renderDashboard();
    renderOrders();
    renderDealers();
    renderFarmers();
    renderProducts();
}

function formatVND(num) {
    return Number(num || 0).toLocaleString('vi-VN') + ' ₫';
}

function getDealerName(khid) {
    const dl = db.DS_DL.find(d => String(d.KHID) === String(khid));
    return dl ? dl.tenkhach : khid;
}

// Xác định đơn hàng thuộc loại CK hay NET
function getOrderCategory(order) {
    if (order.Loai_Hang) return String(order.Loai_Hang).toUpperCase();
    // Tra cứu từ chi tiết đơn hàng nếu có
    const ct = db.DON_HANG_CT.find(c => String(c.DHID) === String(order.DHID));
    if (ct) {
        const sp = db.SAN_PHAM.find(s => String(s.SPID) === String(ct.SPID));
        if (sp && sp.View) return String(sp.View).toUpperCase();
    }
    return 'CK'; // Mặc định nếu chưa phân loại
}

// =========================================================================
// 3. BỘ NÃO TÍNH TOÁN BÁO CÁO ĐIỀU HÀNH (DASHBOARD)
// =========================================================================
function renderDashboard() {
    const selMonth = document.getElementById('report-month').value; // VD: "11"
    const selYear = document.getElementById('report-year').value;   // VD: "2026"
    const lastYear = String(Number(selYear) - 1);                   // VD: "2025"

    document.getElementById('lbl-curr-year').innerText = selYear;
    document.getElementById('lbl-last-year').innerText = lastYear;
    document.getElementById('lbl-month-sales-period').innerText = `Tháng ${selMonth}/${selYear}`;

    let ckThisYear = 0, ckLastYear = 0;
    let ckThisMonth = 0, netThisMonth = 0;
    let ckLastMonth = 0, netLastMonth = 0;

    // Tính tháng trước để đo tăng trưởng tháng
    let prevMonthNum = Number(selMonth) - 1;
    let prevMonthYear = selYear;
    if (prevMonthNum === 0) {
        prevMonthNum = 12;
        prevMonthYear = lastYear;
    }
    const prevMonthStr = String(prevMonthNum).padStart(2, '0');

    // Quét toàn bộ đơn hàng để tính doanh số
    db.DON_HANG.forEach(o => {
        const dateStr = String(o.Ngay || ''); // Định dạng YYYY-MM-DD
        const oYear = dateStr.slice(0, 4);
        const oMonth = dateStr.slice(5, 7);
        const amount = Number(o.Tong_Tien || 0);
        const type = getOrderCategory(o);

        // 1. Tổng doanh số CK năm nay vs năm rồi
        if (type === 'CK') {
            if (oYear === selYear) ckThisYear += amount;
            if (oYear === lastYear) ckLastYear += amount;
        }

        // 2. Doanh số trong tháng đang chọn (chia theo CK & NET)
        if (oYear === selYear && oMonth === selMonth) {
            if (type === 'CK') ckThisMonth += amount;
            if (type === 'NET') netThisMonth += amount;
        }

        // 3. Doanh số tháng liền trước để tính % tăng trưởng
        if (oYear === prevMonthYear && oMonth === prevMonthStr) {
            if (type === 'CK') ckLastMonth += amount;
            if (type === 'NET') netLastMonth += amount;
        }
    });

    // Hiển thị Doanh số CK Năm nay vs Năm rồi
    document.getElementById('kpi-ck-this-year').innerText = formatVND(ckThisYear);
    document.getElementById('kpi-ck-last-year').innerText = formatVND(ckLastYear);
    const yoyGrowth = ckLastYear > 0 ? (((ckThisYear - ckLastYear) / ckLastYear) * 100).toFixed(1) : (ckThisYear > 0 ? 100 : 0);
    const yoyBadge = document.getElementById('kpi-ck-yoy-badge');
    yoyBadge.innerText = `${yoyGrowth >= 0 ? '+' : ''}${yoyGrowth}% vs ${lastYear}`;
    yoyBadge.className = yoyGrowth >= 0 
        ? 'text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        : 'text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30';

    // Hiển thị Tiến độ Kế hoạch & Tăng trưởng Hàng CK
    const ckGrowth = ckLastMonth > 0 ? (((ckThisMonth - ckLastMonth) / ckLastMonth) * 100).toFixed(1) : (ckThisMonth > 0 ? 100 : 0);
    const ckPct = salesTargets.CK > 0 ? Math.min(100, Math.round((ckThisMonth / salesTargets.CK) * 100)) : 0;
    document.getElementById('ck-actual-month').innerText = formatVND(ckThisMonth);
    document.getElementById('ck-target-month').innerText = formatVND(salesTargets.CK);
    document.getElementById('ck-growth-badge').innerText = `Tăng trưởng: ${ckGrowth >= 0 ? '+' : ''}${ckGrowth}%`;
    document.getElementById('ck-percent-text').innerText = `${ckPct}%`;
    document.getElementById('ck-progress-bar').style.width = `${ckPct}%`;

    // Hiển thị Tiến độ Kế hoạch & Tăng trưởng Hàng NET
    const netGrowth = netLastMonth > 0 ? (((netThisMonth - netLastMonth) / netLastMonth) * 100).toFixed(1) : (netThisMonth > 0 ? 100 : 0);
    const netPct = salesTargets.NET > 0 ? Math.min(100, Math.round((netThisMonth / salesTargets.NET) * 100)) : 0;
    document.getElementById('net-actual-month').innerText = formatVND(netThisMonth);
    document.getElementById('net-target-month').innerText = formatVND(salesTargets.NET);
    document.getElementById('net-growth-badge').innerText = `Tăng trưởng: ${netGrowth >= 0 ? '+' : ''}${netGrowth}%`;
    document.getElementById('net-percent-text').innerText = `${netPct}%`;
    document.getElementById('net-progress-bar').style.width = `${netPct}%`;

    // Render Bảng Tổng Hợp Công Nợ Đại Lý (Gom nhóm)
    renderGroupedDebtorsTable();

    // Render Bảng Doanh Số Bán Trong Tháng Theo Khách Hàng
    renderMonthlyCustomerSalesTable(selYear, selMonth);

    // Render Lịch sử Phiếu Thu Nợ
    renderDebtCollectionHistory();
}

// =========================================================================
// 4. BẢNG CÔNG NỢ ĐẠI LÝ (GOM NHÓM) & CHỨC NĂNG THU NỢ
// =========================================================================
function renderGroupedDebtorsTable() {
    let totalAllDebt = 0;
    let debtorMap = {};

    db.DON_HANG.forEach(o => {
        const remain = Math.max(0, Number(o.Tong_Tien || 0) - Number(o.ThanhToan || 0));
        if (remain > 0) {
            totalAllDebt += remain;
            const khid = o.KHID;
            if (!debtorMap[khid]) {
                debtorMap[khid] = { khid: khid, name: getDealerName(khid), orderCount: 0, totalDebt: 0 };
            }
            debtorMap[khid].orderCount += 1;
            debtorMap[khid].totalDebt += remain;
        }
    });

    const debtors = Object.values(debtorMap);
    document.getElementById('kpi-total-debt').innerText = formatVND(totalAllDebt);
    document.getElementById('kpi-debtor-count').innerText = `${debtors.length} đại lý`;

    const tbody = document.getElementById('table-debtors-body');
    if (debtors.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400">Tuyệt vời! Hiện không có đại lý nào nợ tiền.</td></tr>`;
        return;
    }

    tbody.innerHTML = debtors.map(d => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td class="p-2.5 font-bold text-slate-800 dark:text-white">${d.name}</td>
            <td class="p-2.5 text-center"><span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">${d.orderCount} đơn</span></td>
            <td class="p-2.5 text-right font-extrabold text-rose-600">${formatVND(d.totalDebt)}</td>
            <td class="p-2.5 text-right">
                <button onclick="openCollectDebtModal('${d.khid}')" class="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-bold px-2.5 py-1 rounded-lg transition">
                    Thu nợ
                </button>
            </td>
        </tr>
    `).join('');
}

function openCollectDebtModal(preselectKhid = '') {
    document.getElementById('debt-collect-date').value = new Date().toISOString().split('T')[0];
    const select = document.getElementById('debt-dealer-select');
    select.innerHTML = db.DS_DL.map(d => `<option value="${d.KHID}" ${d.KHID === preselectKhid ? 'selected' : ''}>${d.tenkhach}</option>`).join('');
    updateSelectedDealerDebtInfo();
    openModal('modalCollectDebt');
}

function updateSelectedDealerDebtInfo() {
    const khid = document.getElementById('debt-dealer-select').value;
    let remain = 0;
    db.DON_HANG.forEach(o => {
        if (String(o.KHID) === String(khid)) {
            remain += Math.max(0, Number(o.Tong_Tien || 0) - Number(o.ThanhToan || 0));
        }
    });
    document.getElementById('debt-current-remain-lbl').innerText = `Dư nợ hiện tại: ${formatVND(remain)}`;
}

// Xử lý trừ nợ tự động vào các đơn hàng cũ nhất của đại lý khi nhập thu nợ
function submitDebtCollection(e) {
    e.preventDefault();
    const khid = document.getElementById('debt-dealer-select').value;
    const date = document.getElementById('debt-collect-date').value;
    let amountToCollect = Number(document.getElementById('debt-collect-amount').value || 0);
    const note = document.getElementById('debt-collect-note').value;

    if (amountToCollect <= 0) return;

    // Lưu lịch sử phiếu thu nợ
    if (!db.THU_NO) db.THU_NO = [];
    const receipt = {
        ID: 'TN' + Date.now().toString().slice(-4),
        KHID: khid,
        Ngay: date,
        So_Tien: amountToCollect,
        Ghi_Chu: note || 'Thu hồi công nợ'
    };
    db.THU_NO.unshift(receipt);

    // Phân bổ số tiền thu được để gạch nợ lần lượt các đơn hàng còn nợ của đại lý
    let remainingMoney = amountToCollect;
    db.DON_HANG.forEach(o => {
        if (String(o.KHID) === String(khid) && remainingMoney > 0) {
            const orderDebt = Math.max(0, Number(o.Tong_Tien || 0) - Number(o.ThanhToan || 0));
            if (orderDebt > 0) {
                const payForThisOrder = Math.min(orderDebt, remainingMoney);
                o.ThanhToan = Number(o.ThanhToan || 0) + payForThisOrder;
                remainingMoney -= payForThisOrder;
                if (o.ThanhToan >= Number(o.Tong_Tien)) {
                    o.TrangThai = 'Hoàn Thành';
                }
            }
        }
    });

    saveLocalDB();
    refreshUI();
    closeModal('modalCollectDebt');
    e.target.reset();
    showToast(`Đã thu ${formatVND(amountToCollect)} từ ${getDealerName(khid)}!`);
}

function renderDebtCollectionHistory() {
    const container = document.getElementById('debt-collection-history');
    const list = db.THU_NO || [];
    if (list.length === 0) {
        container.innerHTML = `<p class="text-slate-400">Chưa có phiếu thu nợ nào được ghi nhận.</p>`;
        return;
    }
    container.innerHTML = list.slice(0, 5).map(item => `
        <div class="flex justify-between items-center p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
            <div>
                <span class="font-bold text-slate-800 dark:text-white">${getDealerName(item.KHID)}</span>
                <p class="text-[11px] text-slate-500">${item.Ngay} • ${item.Ghi_Chu}</p>
            </div>
            <span class="font-extrabold text-emerald-600">+${formatVND(item.So_Tien)}</span>
        </div>
    `).join('');
}

// =========================================================================
// 5. BẢNG THÁNG NÀY BÁN CHO NHỮNG AI & BÁN BAO NHIÊU
// =========================================================================
function renderMonthlyCustomerSalesTable(year, month) {
    let customerSales = {};

    db.DON_HANG.forEach(o => {
        const dateStr = String(o.Ngay || '');
        if (dateStr.slice(0, 4) === year && dateStr.slice(5, 7) === month) {
            const khid = o.KHID;
            const amount = Number(o.Tong_Tien || 0);
            const type = getOrderCategory(o);

            if (!customerSales[khid]) {
                customerSales[khid] = { name: getDealerName(khid), orders: 0, ck: 0, net: 0, total: 0 };
            }
            customerSales[khid].orders += 1;
            if (type === 'CK') customerSales[khid].ck += amount;
            if (type === 'NET') customerSales[khid].net += amount;
            customerSales[khid].total += amount;
        }
    });

    const rows = Object.values(customerSales).sort((a, b) => b.total - a.total);
    const tbody = document.getElementById('table-monthly-sales-body');

    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">Tháng ${month}/${year} chưa có phát sinh đơn hàng nào.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(r => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td class="p-2.5 font-bold text-slate-800 dark:text-white">${r.name}</td>
            <td class="p-2.5 text-center text-slate-600 dark:text-slate-300">${r.orders}</td>
            <td class="p-2.5 text-right text-blue-600 font-semibold">${formatVND(r.ck)}</td>
            <td class="p-2.5 text-right text-aqua-600 font-semibold">${formatVND(r.net)}</td>
            <td class="p-2.5 text-right font-extrabold text-slate-900 dark:text-white">${formatVND(r.total)}</td>
        </tr>
    `).join('');
}

function saveSalesTargets(e) {
    e.preventDefault();
    salesTargets.CK = Number(document.getElementById('input-target-ck').value || 0);
    salesTargets.NET = Number(document.getElementById('input-target-net').value || 0);
    localStorage.setItem('aqua_crm_targets', JSON.stringify(salesTargets));
    renderDashboard();
    closeModal('modalSalesTarget');
    showToast('Đã cập nhật kế hoạch bán hàng!');
}

// =========================================================================
// 6. CÁC TAB QUẢN LÝ KHÁC (ĐƠN HÀNG, ĐẠI LÝ, HỘ NUÔI, SẢN PHẨM, CÀI ĐẶT)
// =========================================================================
function renderOrders() {
    const kw = (document.getElementById('search-order').value || '').toLowerCase();
    const yearFilter = document.getElementById('filter-order-year').value;
    const typeFilter = document.getElementById('filter-order-type').value;

    const filtered = db.DON_HANG.filter(o => {
        const matchKw = String(o.DHID).toLowerCase().includes(kw) || getDealerName(o.KHID).toLowerCase().includes(kw);
        const matchYear = !yearFilter || String(o.Ngay).startsWith(yearFilter);
        const matchType = !typeFilter || getOrderCategory(o) === typeFilter;
        return matchKw && matchYear && matchType;
    });

    const container = document.getElementById('orders-list');
    container.innerHTML = filtered.map(o => {
        const remain = Math.max(0, Number(o.Tong_Tien) - Number(o.ThanhToan));
        const cat = getOrderCategory(o);
        return `
        <div class="bg-white dark:bg-cardDark p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
            <div class="flex justify-between items-start">
                <div>
                    <span class="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">${o.DHID}</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded ${cat === 'NET' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}">${cat}</span>
                    <h4 class="font-bold text-sm mt-1">${getDealerName(o.KHID)}</h4>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${remain > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}">
                    ${remain > 0 ? 'Còn nợ' : 'Hoàn thành'}
                </span>
            </div>
            <div class="flex justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <span class="text-slate-500">Ngày: ${o.Ngay}</span>
                <span>Tổng: <strong>${formatVND(o.Tong_Tien)}</strong> | Nợ: <strong class="text-rose-600">${formatVND(remain)}</strong></span>
            </div>
        </div>`;
    }).join('') || `<p class="text-center text-xs text-slate-400 py-6">Không có đơn hàng phù hợp.</p>`;
}

function renderDealers() {
    const kw = (document.getElementById('search-dealer').value || '').toLowerCase();
    const list = db.DS_DL.filter(d => String(d.tenkhach).toLowerCase().includes(kw));
    document.getElementById('dealers-list').innerHTML = list.map(d => `
        <div class="bg-white dark:bg-cardDark p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center">
            <div>
                <h4 class="font-bold text-sm">${d.tenkhach}</h4>
                <p class="text-xs text-slate-500">${d.Khu_Vuc} • SĐT: ${d.SDT}</p>
            </div>
            <span class="text-xs font-bold text-blue-600">CK: ${d.CK}</span>
        </div>
    `).join('');
}

function renderFarmers() {
    const kw = (document.getElementById('search-farmer').value || '').toLowerCase();
    const list = db.DS_KH.filter(f => String(f.tenHN).toLowerCase().includes(kw));
    document.getElementById('farmers-list').innerHTML = list.map(f => `
        <div class="bg-white dark:bg-cardDark p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h4 class="font-bold text-sm">${f.tenHN} (${f.Khu_Vuc})</h4>
            <p class="text-xs text-slate-500 mt-1">${f.KQ || ''}</p>
        </div>
    `).join('');
}

function renderProducts() {
    const kw = (document.getElementById('search-product').value || '').toLowerCase();
    const list = db.SAN_PHAM.filter(s => String(s.tenSP).toLowerCase().includes(kw));
    document.getElementById('company-products-list').innerHTML = list.map(s => `
        <div class="bg-white dark:bg-cardDark p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center">
            <div>
                <h4 class="font-bold text-sm">${s.tenSP} <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">${s.View}</span></h4>
                <p class="text-xs text-slate-500">${s.PHAN_LOAI}</p>
            </div>
            <span class="font-extrabold text-aqua-600 text-xs">${formatVND(s.GIA_THUNG)}/thùng</span>
        </div>
    `).join('');
}

// Tạo đơn hàng mới
function openCreateOrderModal() {
    orderCart = [];
    document.getElementById('ord-ngay').value = new Date().toISOString().split('T')[0];
    document.getElementById('ord-khid').innerHTML = db.DS_DL.map(d => `<option value="${d.KHID}">${d.tenkhach}</option>`).join('');
    document.getElementById('ord-select-sp').innerHTML = db.SAN_PHAM.map(s => `<option value="${s.SPID}">${s.tenSP} (${s.View}) - ${formatVND(s.GIA_THUNG)}</option>`).join('');
    renderOrderCart();
    openModal('modalCreateOrder');
}

function addProductToOrderCart() {
    const spid = document.getElementById('ord-select-sp').value;
    const qty = parseInt(document.getElementById('ord-sp-qty').value) || 1;
    const sp = db.SAN_PHAM.find(s => s.SPID === spid);
    if (!sp) return;
    orderCart.push({ SPID: sp.SPID, tenSP: sp.tenSP, View: sp.View, qty: qty, total: qty * Number(sp.GIA_THUNG) });
    renderOrderCart();
}

function renderOrderCart() {
    let total = 0;
    document.getElementById('order-cart-items').innerHTML = orderCart.map(c => {
        total += c.total;
        return `<div class="flex justify-between text-xs bg-white dark:bg-slate-700 p-2 rounded-lg"><span>${c.tenSP} (${c.View}) x${c.qty}</span><strong>${formatVND(c.total)}</strong></div>`;
    }).join('');
    document.getElementById('cart-total-money').innerText = formatVND(total);
}

function submitNewOrder(e) {
    e.preventDefault();
    if (orderCart.length === 0) return;
    const totalMoney = orderCart.reduce((s, i) => s + i.total, 0);
    const paid = Number(document.getElementById('ord-thanhtoan').value || 0);
    const newOrd = {
        DHID: 'DH' + Date.now().toString().slice(-5),
        KHID: document.getElementById('ord-khid').value,
        Ngay: document.getElementById('ord-ngay').value,
        So_Luong: orderCart.reduce((s, i) => s + i.qty, 0),
        Tong_Tien: totalMoney,
        ThanhToan: paid,
        Loai_Hang: orderCart[0].View,
        TrangThai: paid >= totalMoney ? 'Hoàn Thành' : 'Công Nợ'
    };
    db.DON_HANG.unshift(newOrd);
    saveLocalDB();
    refreshUI();
    closeModal('modalCreateOrder');
    showToast('Đã tạo đơn hàng mới!');
}

// Điều hướng Tab & Tiện ích
function switchTab(tabName) {
    document.querySelectorAll('.tab-view').forEach(el => el.classList.add('hidden'));
    document.getElementById('tab-' + tabName).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('text-aqua-600', btn.dataset.tab === tabName);
        btn.classList.toggle('text-slate-400', btn.dataset.tab !== tabName);
    });
}
function toggleDarkMode() { document.documentElement.classList.toggle('dark'); }
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toast-text').innerText = msg;
    t.classList.remove('opacity-0', 'pointer-events-none');
    setTimeout(() => t.classList.add('opacity-0', 'pointer-events-none'), 2500);
}

// Đồng bộ Google Sheets & Lưu URL vĩnh viễn
function saveGasUrl() {
    const url = document.getElementById('gas-web-app-url').value.trim();
    gasUrl = url;
    localStorage.setItem('aqua_crm_gas_url', url);
    showToast('Đã lưu Web App URL vĩnh viễn!');
}

async function syncWithGoogleSheets() {
    if (!gasUrl) { switchTab('settings'); showToast('Vui lòng nhập URL Google Sheets trước!'); return; }
    try {
        const res = await fetch(gasUrl);
        const json = await res.json();
        if (json.status === 'success' && json.data) {
            ['DON_HANG', 'DON_HANG_CT', 'DS_DL', 'DS_KH', 'SAN_PHAM'].forEach(k => {
                if (Array.isArray(json.data[k]) && json.data[k].length > 0) db[k] = json.data[k];
            });
            saveLocalDB();
            refreshUI();
            document.getElementById('sync-badge').innerText = 'Đã đồng bộ Sheets';
            showToast('Đồng bộ dữ liệu thành công!');
        }
    } catch (e) { showToast('Lỗi kết nối Google Sheets!'); }
}

function resetDemoData() {
    db = JSON.parse(JSON.stringify(DEFAULT_DATA));
    saveLocalDB();
    refreshUI();
    showToast('Đã khôi phục dữ liệu mẫu!');
}
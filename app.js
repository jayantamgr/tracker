if (typeof window === "undefined" || typeof document === "undefined") {
    if (typeof module !== "undefined") {
        module.exports = {};
    }
} else {
const SUPABASE_URL = "https://eznhslxzxgisvjovodtq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_3QgVgJ0GXLSsNCm1W_9kzg_3zeSh3QO";
const MATERIALS_TABLE = "Materials";
const supabaseClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

let materials = [];

function getMaterialDate(material) {
    return material.Purchase_date || "";
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnly) {
        return new Date(
            Number(dateOnly[1]),
            Number(dateOnly[2]) - 1,
            Number(dateOnly[3])
        ).toLocaleDateString();
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function isSupabaseConfigured() {
    return Boolean(supabaseClient) &&
        !SUPABASE_URL.startsWith("YOUR_") &&
        !SUPABASE_ANON_KEY.startsWith("YOUR_");
}

function showError(message) {
    const error = document.getElementById("errorMessage");
    error.textContent = message;
    error.hidden = false;
}

function clearError() {
    const error = document.getElementById("errorMessage");
    error.textContent = "";
    error.hidden = true;
}

async function getLatestMaterials() {
    const { data, error } = await supabaseClient
        .from(MATERIALS_TABLE)
        .select("*")
        .order("Purchase_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        throw error;
    }

    return data || [];
}

async function getMaterialsByDateRange(fromDate, toDate) {
    let query = supabaseClient
        .from(MATERIALS_TABLE)
        .select("*")
        .order("Purchase_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

    if (fromDate) {
        query = query.gte("Purchase_date", fromDate);
    }
    if (toDate) {
        query = query.lte("Purchase_date", toDate);
    }

    const { data, error } = await query;
    if (error) {
        throw error;
    }

    return data || [];
}

async function getMaterialsByMonth(year, month) {
    const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(Date.UTC(year, month, 0))
        .toISOString()
        .slice(0, 10);
    return getMaterialsByDateRange(firstDay, lastDay);
}

async function getMaterialsByYear(year) {
    return getMaterialsByDateRange(`${year}-01-01`, `${year}-12-31`);
}

async function addMaterial() {
    clearError();
    const materialName = document.getElementById("materialName").value.trim();
    const quantity = Number(document.getElementById("quantity").value);
    const price = Number(document.getElementById("price").value);
    const vendor = document.getElementById("vendor").value.trim();
    const transactionDate = document.getElementById("transactionDate").value;

    if (!materialName || !Number.isFinite(quantity) || !Number.isFinite(price) || !vendor || !transactionDate) {
        showError("Please fill in material name, quantity, price, vendor, and transaction date.");
        return;
    }

    const { error } = await supabaseClient
        .from(MATERIALS_TABLE)
        .insert({
            Material_Name: materialName,
            Quantity: quantity,
            Price: price,
            Vendor: vendor,
            Purchase_date: transactionDate
        });

    if (error) {
        showError(`Unable to add material: ${error.message}`);
        return;
    }

    document.getElementById("materialForm").reset();
    await loadMaterials();
}

async function deleteMaterial(id) {
    clearError();
    const { error } = await supabaseClient
        .from(MATERIALS_TABLE)
        .delete()
        .eq("id", id);

    if (error) {
        showError(`Unable to delete material: ${error.message}`);
        return;
    }

    await loadMaterials();
}

function getFilteredMaterials() {
    const filters = {
        date: document.getElementById("dateFilter").value.toLowerCase(),
        entryDate: document.getElementById("entryDateFilter").value.toLowerCase(),
        material: document.getElementById("materialFilter").value.toLowerCase(),
        quantity: document.getElementById("quantityFilter").value.toLowerCase(),
        price: document.getElementById("priceFilter").value.toLowerCase(),
        vendor: document.getElementById("vendorFilter").value.toLowerCase()
    };

    return materials.filter((item) => {
        const date = formatDate(getMaterialDate(item)).toLowerCase();
        const entryDate = formatDate(item.created_at || "").toLowerCase();
        const material = String(item.Material_Name ?? "").toLowerCase();
        const quantity = String(item.Quantity ?? "").toLowerCase();
        const price = String(item.Price ?? "").toLowerCase();
        const vendor = String(item.Vendor ?? "").toLowerCase();

        return date.includes(filters.date) &&
            entryDate.includes(filters.entryDate) &&
            material.includes(filters.material) &&
            quantity.includes(filters.quantity) &&
            price.includes(filters.price) &&
            vendor.includes(filters.vendor);
    });
}

function renderTable() {
    const tbody = document.getElementById("materialTable");
    const filteredMaterials = getFilteredMaterials();
    let totalValue = 0;

    tbody.innerHTML = filteredMaterials.map((item) => {
        const price = Number(item.Price) || 0;
        totalValue += price;

        return `
            <tr>
                <td>${escapeHtml(formatDate(getMaterialDate(item)))}</td>
                <td>${escapeHtml(item.Material_Name)}</td>
                <td>${escapeHtml(item.Quantity)}</td>
                <td>${price.toFixed(2)}</td>
                <td>${escapeHtml(item.Vendor)}</td>
                <td>${escapeHtml(formatDate(item.created_at || ""))}</td>
                <td>
                    ${item.id ? `<button type="button" class="delete-button" data-material-id="${escapeHtml(item.id)}">Delete</button>` : ""}
                </td>
            </tr>
        `;
    }).join("");

    document.getElementById("totalValue").textContent = totalValue.toFixed(2);
    document.getElementById("resultCount").textContent =
        `${filteredMaterials.length} of ${materials.length} rows`;
}

async function loadMaterials(query = getLatestMaterials) {
    clearError();
    try {
        materials = await query();
        renderTable();
    } catch (error) {
        showError(`Unable to load materials: ${error.message}`);
    }
}

async function applyDateQuery() {
    const fromDate = document.getElementById("fromDate").value;
    const toDate = document.getElementById("toDate").value;

    if (fromDate && toDate && fromDate > toDate) {
        showError("The start date must be before the end date.");
        return;
    }

    await loadMaterials(() => getMaterialsByDateRange(fromDate, toDate));
}

async function applyMonthQuery() {
    const month = document.getElementById("monthFilter").value;
    if (!month) {
        await loadMaterials();
        return;
    }

    const [year, monthNumber] = month.split("-").map(Number);
    await loadMaterials(() => getMaterialsByMonth(year, monthNumber));
}

async function applyYearQuery() {
    const year = document.getElementById("yearFilter").value;
    if (!year) {
        await loadMaterials();
        return;
    }

    await loadMaterials(() => getMaterialsByYear(Number(year)));
}

document.getElementById("materialForm").addEventListener("submit", (event) => {
    event.preventDefault();
    addMaterial();
});
document.querySelectorAll(".column-filter").forEach((input) => {
    input.addEventListener("input", renderTable);
});
document.getElementById("materialTable").addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
        return;
    }

    const deleteButton = event.target.closest(".delete-button");
    const materialId = deleteButton?.getAttribute("data-material-id");
    if (materialId) {
        deleteMaterial(materialId);
    }
});
document.getElementById("dateQueryForm").addEventListener("submit", (event) => {
    event.preventDefault();
    applyDateQuery();
});
document.getElementById("monthFilter").addEventListener("change", applyMonthQuery);
document.getElementById("yearFilter").addEventListener("change", applyYearQuery);
document.getElementById("clearDateFilters").addEventListener("click", () => {
    document.getElementById("dateQueryForm").reset();
    loadMaterials();
});

const transactionDateInput = document.getElementById("transactionDate");
const localToday = new Date();
transactionDateInput.defaultValue = [
    localToday.getFullYear(),
    String(localToday.getMonth() + 1).padStart(2, "0"),
    String(localToday.getDate()).padStart(2, "0")
].join("-");
transactionDateInput.value = transactionDateInput.defaultValue;

if (!isSupabaseConfigured()) {
    showError(supabaseClient
        ? "Configure SUPABASE_URL and SUPABASE_ANON_KEY in app.js before using the tracker."
        : "The Supabase client library could not be loaded. Check your network connection.");
} else {
    loadMaterials();
}
}

let materials = JSON.parse(localStorage.getItem("materials")) || [];

function saveData() {
    localStorage.setItem("materials", JSON.stringify(materials));
}

function addMaterial() {
    const name = document.getElementById("materialName").value.trim();
    const qty = parseFloat(document.getElementById("quantity").value);
    const cost = parseFloat(document.getElementById("cost").value);

    if (!name || isNaN(qty) || isNaN(cost)) {
        alert("Please fill all fields");
        return;
    }

    materials.push({
        id: Date.now(),
        date: new Date().toLocaleString(),
        name,
        qty,
        cost
    });

    saveData();
    renderTable();

    document.getElementById("materialName").value = "";
    document.getElementById("quantity").value = "";
    document.getElementById("cost").value = "";
}

function deleteMaterial(id) {
    materials = materials.filter(item => item.id !== id);
    saveData();
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById("materialTable");
    const search = document.getElementById("search").value.toLowerCase();

    tbody.innerHTML = "";

    let totalValue = 0;

    materials
        .filter(item => item.name.toLowerCase().includes(search))
        .forEach(item => {
            const total = item.qty * item.cost;
            totalValue += total;

            tbody.innerHTML += `
                <tr>
                    <td>${item.date}</td>
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                    <td>${item.cost.toFixed(2)}</td>
                    <td>${total.toFixed(2)}</td>
                    <td>
                        <button onclick="deleteMaterial(${item.id})">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        });

    document.getElementById("totalValue").innerText =
        totalValue.toFixed(2);
}

renderTable();
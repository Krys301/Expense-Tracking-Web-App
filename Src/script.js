function calculateBalance() {
    updateBalance();
}

let fixedExpenses = [];
let transactions = [];

let myChart = null;

// -----------------------------
// WEEK SYSTEM VARIABLES
// -----------------------------
let currentWeek = 1;
let totalWeeks = 1;

// -----------------------------
// WEEK SAVE / LOAD
// -----------------------------
function saveWeekData() {
    const data = {
        startingBalance: document.getElementById("starting-balance").value,
        incomeAmount: document.getElementById("income-amount").value,
        incomeFrequency: document.getElementById("income-frequency").value,
        fixedExpenses: fixedExpenses,
        transactions: transactions
    };

    localStorage.setItem("week_" + currentWeek, JSON.stringify(data));
}

function loadWeekData() {
    const saved = localStorage.getItem("week_" + currentWeek);

    if (!saved) {
        // reset for new week
        document.getElementById("starting-balance").value = "";
        document.getElementById("income-amount").value = "";
        document.getElementById("income-frequency").value = "Weekly";

        fixedExpenses = [];
        transactions = [];

        document.getElementById("income").textContent = "0";
        document.getElementById("expenses").textContent = "0";
        document.getElementById("balance").textContent = "0";

        displayExpenses();
        displayTransactions();
        updateChart();
        return;
    }

    const data = JSON.parse(saved);

    document.getElementById("starting-balance").value = data.startingBalance || "";
    document.getElementById("income-amount").value = data.incomeAmount || "";
    document.getElementById("income-frequency").value = data.incomeFrequency || "Weekly";

    fixedExpenses = data.fixedExpenses || [];
    transactions = data.transactions || [];

    displayExpenses();
    displayTransactions();
    calculateIncome();
    calculateTotalExpenses();
    updateChart();
}

// -----------------------------
// WEEK UI
// -----------------------------
function populateWeeks() {
    const weekSelect = document.getElementById("week-select");
    weekSelect.innerHTML = "";

    for (let i = 1; i <= totalWeeks; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = "Week " + i;
        weekSelect.appendChild(option);
    }

    weekSelect.value = currentWeek;
}

// Week dropdown change
document.getElementById("week-select").addEventListener("change", function () {
    saveWeekData(); // save old week

    currentWeek = parseInt(this.value);

    saveWeekSettings(); // ✅ save selected week
    loadWeekData();     // load new week
});

// New week button
document.getElementById("new-week-btn").addEventListener("click", function () {
    saveWeekData(); // save current week

    totalWeeks++;
    currentWeek = totalWeeks;

    populateWeeks();
    loadWeekData(); // new week is blank
});

// -----------------------------
// FIXED EXPENSES
// -----------------------------
function addExpense() {
    let name = document.getElementById("expense-name").value;
    let amount = document.getElementById("expense-amount").value;

    if (name.trim() === "" || amount === "" || parseFloat(amount) <= 0) return;

    fixedExpenses.push({ name: name, amount: amount });

    displayExpenses();
    calculateTotalExpenses();

    // clear inputs
    document.getElementById("expense-name").value = "";
    document.getElementById("expense-amount").value = "";

    saveWeekData(); // ✅ save changes
}

function displayExpenses() {
    let list = document.getElementById("expense-list");
    list.innerHTML = "";

    for (let i = 0; i < fixedExpenses.length; i++) {
        list.innerHTML += `
            <div class="item-row">
                <span>${fixedExpenses[i].name}: $${fixedExpenses[i].amount}</span>
                <button class="delete-btn" onclick="deleteExpense(${i})">X</button>
            </div>
        `;
    }
}

function deleteExpense(index) {
    fixedExpenses.splice(index, 1);
    displayExpenses();
    calculateTotalExpenses();
    saveWeekData(); // ✅ save changes
}

// -----------------------------
// TRANSACTIONS
// -----------------------------
function addTransaction() {
    let desc = document.getElementById("transaction-desc").value;
    let amount = document.getElementById("transaction-amount").value;
    let category = document.getElementById("transaction-category").value;

    if (desc.trim() === "" || amount === "" || parseFloat(amount) <= 0) return;

    transactions.push({ desc: desc, amount: amount, category: category });

    displayTransactions();
    calculateTotalExpenses();
    updateChart();

    // clear inputs
    document.getElementById("transaction-desc").value = "";
    document.getElementById("transaction-amount").value = "";
    document.getElementById("transaction-category").selectedIndex = 0;

    saveWeekData(); // ✅ save changes
}

function displayTransactions() {
    let list = document.getElementById("transaction-list");
    list.innerHTML = "";

    for (let i = 0; i < transactions.length; i++) {
        list.innerHTML += `
            <div class="item-row">
                <span>${transactions[i].desc} (${transactions[i].category}): $${transactions[i].amount}</span>
                <button class="delete-btn" onclick="deleteTransaction(${i})">X</button>
            </div>
        `;
    }
}

function deleteTransaction(index) {
    transactions.splice(index, 1);
    displayTransactions();
    calculateTotalExpenses();
    updateChart();
    saveWeekData(); // ✅ save changes
}

// -----------------------------
// TOTAL EXPENSES
// -----------------------------
function calculateTotalExpenses() {
    let total = 0;

    for (let i = 0; i < fixedExpenses.length; i++) {
        total += parseFloat(fixedExpenses[i].amount);
    }

    for (let i = 0; i < transactions.length; i++) {
        total += parseFloat(transactions[i].amount);
    }

    document.getElementById("expenses").textContent = total;
    updateBalance();
}

// -----------------------------
// INCOME
// -----------------------------
function calculateIncome() {
    let amount = parseFloat(document.getElementById("income-amount").value) || 0;
    let frequency = document.getElementById("income-frequency").value;

    let monthlyIncome = 0;

    if (frequency === "Weekly") {
        monthlyIncome = amount * 4;
    } else {
        monthlyIncome = amount;
    }

    document.getElementById("income").textContent = monthlyIncome;
    updateBalance();
    saveWeekData(); // ✅ save changes
}

// -----------------------------
// BALANCE
// -----------------------------
function updateBalance() {
    let starting = parseFloat(document.getElementById("starting-balance").value) || 0;
    let income = parseFloat(document.getElementById("income").textContent) || 0;
    let expenses = parseFloat(document.getElementById("expenses").textContent) || 0;

    let balance = starting + income - expenses;

    document.getElementById("balance").textContent = balance;
}

// -----------------------------
// CHART + PERCENT BREAKDOWN
// -----------------------------
function updateChart() {
    let categories = {};

    for (let i = 0; i < transactions.length; i++) {
        let cat = transactions[i].category;
        let amt = parseFloat(transactions[i].amount);

        if (categories[cat]) {
            categories[cat] += amt;
        } else {
            categories[cat] = amt;
        }
    }

    let labels = Object.keys(categories);
    let data = Object.values(categories);

    updatePercentBreakdown(categories);

    if (myChart) {
        myChart.destroy();
    }

    let ctx = document.getElementById("expense-chart").getContext("2d");
    myChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [
                {
                    data: data,
                    backgroundColor: [
                        "#FF6384",
                        "#36A2EB",
                        "#FFCE56",
                        "#4BC0C0",
                        "#9966FF"
                    ]
                }
            ]
        }
    });
}

function updatePercentBreakdown(categories) {
    let total = 0;

    for (let cat in categories) {
        total += categories[cat];
    }

    let breakdownDiv = document.getElementById("percent-breakdown");

    if (!breakdownDiv) return;

    if (total === 0) {
        breakdownDiv.innerHTML = "";
        return;
    }

    let html = "<h3>Percent Breakdown</h3>";

    for (let cat in categories) {
        let percent = ((categories[cat] / total) * 100).toFixed(1);
        html += `<p>${cat}: ${percent}%</p>`;
    }

    breakdownDiv.innerHTML = html;
}

// -----------------------------
// ENTER KEY SUPPORT
// -----------------------------
document.getElementById("expense-name").addEventListener("keydown", function (e) {
    if (e.key === "Enter") addExpense();
});

document.getElementById("expense-amount").addEventListener("keydown", function (e) {
    if (e.key === "Enter") addExpense();
});

document.getElementById("transaction-desc").addEventListener("keydown", function (e) {
    if (e.key === "Enter") addTransaction();
});

document.getElementById("transaction-amount").addEventListener("keydown", function (e) {
    if (e.key === "Enter") addTransaction();
});

// -----------------------------
// INPUT CHANGE AUTOSAVE
// -----------------------------
document.getElementById("starting-balance").addEventListener("change", function () {
    updateBalance();
    saveWeekData();
});

// -----------------------------
// INITIAL LOAD
// -----------------------------
loadWeekSettings();   // ✅ load total weeks + last selected week
populateWeeks();
loadWeekData();


function saveWeekSettings() {
    localStorage.setItem("totalWeeks", totalWeeks);
    localStorage.setItem("currentWeek", currentWeek);
}

function loadWeekSettings() {
    totalWeeks = parseInt(localStorage.getItem("totalWeeks")) || 1;
    currentWeek = parseInt(localStorage.getItem("currentWeek")) || 1;
}


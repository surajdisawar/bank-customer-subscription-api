
const fields = {
    age: {type:"number", value:40, min:18},
    job: ["admin.","blue-collar","entrepreneur","housemaid","management","retired","self-employed","services","student","technician","unemployed","unknown"],
    marital: ["divorced","married","single"],
    education: ["primary","secondary","tertiary","unknown"],
    default: ["no","yes"],
    balance: {type:"number", value:640},
    housing: ["no","yes"],
    loan: ["no","yes"],
    contact: ["cellular","telephone","unknown"],
    day: {type:"number", value:8, min:1, max:31},
    month: ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"],
    campaign: {type:"number", value:2, min:1},
    pdays: {type:"number", value:-1, min:-1},
    previous: {type:"number", value:0, min:0},
    poutcome: ["failure","other","success","unknown"]
};

const form = document.getElementById("formFields");

for (const [name, config] of Object.entries(fields)) {
    const div = document.createElement("div");
    div.className = "field";

    const label = document.createElement("label");
    label.textContent = name.toUpperCase();

    let input;
    if (Array.isArray(config)) {
        input = document.createElement("select");
        config.forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            input.appendChild(option);
        });
    } else {
        input = document.createElement("input");
        input.type = "number";
        input.value = config.value;
        if (config.min !== undefined) input.min = config.min;
        if (config.max !== undefined) input.max = config.max;
    }

    input.name = name;
    input.required = true;
    div.append(label, input);
    form.appendChild(div);
}

document.getElementById("predictionForm").addEventListener("submit", async e => {
    e.preventDefault();
    const data = {};

    for (const [name, config] of Object.entries(fields)) {
        const value = e.target.elements[name].value;
        data[name] = Array.isArray(config) ? value : Number(value);
    }

    const box = document.getElementById("result");
    box.className = "result";
    box.textContent = "Please wait...";

    try {
        const response = await fetch("/predict", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Prediction failed");

        box.className = "result " + (result.prediction === "YES" ? "yes" : "no");
        box.innerHTML = `
            <h2>Prediction: ${result.prediction}</h2>
            <h3>Yes Probability: ${result.yes_probability}%</h3>
            <h3>No Probability: ${result.no_probability}%</h3>
        `;
        loadHistory();
    } catch(error) {
        box.className = "result no";
        box.textContent = "Error: " + error.message;
    }
});

async function loadHistory() {
    const response = await fetch("/history");
    const rows = await response.json();
    const area = document.getElementById("history");

    if (!rows.length) {
        area.textContent = "No predictions yet.";
        return;
    }

    let html = "<table><tr><th>Date</th><th>Prediction</th><th>Yes %</th><th>No %</th></tr>";
    rows.slice().reverse().forEach(row => {
        html += `<tr><td>${row.Date}</td><td>${row.Prediction}</td><td>${row["Yes Probability"]}</td><td>${row["No Probability"]}</td></tr>`;
    });
    area.innerHTML = html + "</table>";
}

async function loadMetrics() {
    const m = await (await fetch("/metrics")).json();
    document.getElementById("metrics").innerHTML = [
        ["Accuracy", m.accuracy],
        ["Precision", m.precision],
        ["Recall", m.recall],
        ["F1 Score", m.f1]
    ].map(x => `<div class="metric"><strong>${x[1]}%</strong><span>${x[0]}</span></div>`).join("");

    document.getElementById("matrix").innerHTML = `
        <table>
        <tr><th>Actual / Predicted</th><th>No</th><th>Yes</th></tr>
        <tr><th>No</th><td>${m.matrix[0][0]}</td><td>${m.matrix[0][1]}</td></tr>
        <tr><th>Yes</th><td>${m.matrix[1][0]}</td><td>${m.matrix[1][1]}</td></tr>
        </table>`;

    const max = Math.max(...m.features.map(x => x.value), 0.0001);
    document.getElementById("features").innerHTML = m.features.map(x =>
        `<div class="feature">${x.name}<div class="bar" style="width:${x.value/max*100}%"></div></div>`
    ).join("");
}

loadMetrics();
loadHistory();

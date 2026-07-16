(() => {
  const state = {
    rows: [],
    flaggedRows: [],
    analyzed: false,
    columns: {}
  };

  const elements = {
    fileInput: document.querySelector("#csv-file"),
    fileMessage: document.querySelector("#file-message"),
    kpiForm: document.querySelector("#kpi-form"),
    kpiGoalInputs: document.querySelectorAll('input[name="kpi-goal"]'),
    cpaSetting: document.querySelector("#cpa-setting"),
    roasSetting: document.querySelector("#roas-setting"),
    targetCpa: document.querySelector("#target-cpa"),
    targetRoas: document.querySelector("#target-roas"),
    zeroConvSpend: document.querySelector("#zero-conv-spend"),
    zeroConvClicks: document.querySelector("#zero-conv-clicks"),
    totalSpend: document.querySelector("#total-spend"),
    flaggedSpend: document.querySelector("#flagged-spend"),
    flaggedCount: document.querySelector("#flagged-count"),
    flaggedRate: document.querySelector("#flagged-rate"),
    analysisMessage: document.querySelector("#analysis-message"),
    reasonFilter: document.querySelector("#reason-filter"),
    exportButton: document.querySelector("#export-button"),
    resultsBody: document.querySelector("#results-body")
  };

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  });

  const stopWords = new Set([
    "a", "an", "and", "at", "by", "for", "from", "in", "near", "of",
    "on", "or", "the", "to", "with"
  ]);

  function normalizeHeader(header) {
    return String(header || "")
      .toLowerCase()
      .replace(/\uFEFF/g, "")
      .replace(/[._]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanNumber(value) {
    const cleaned = String(value ?? "")
      .replace(/[$,%"]/g, "")
      .replace(/,/g, "")
      .trim();

    if (!cleaned || cleaned === "--") return 0;
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : 0;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function formatMoney(value) {
    return currency.format(Number(value) || 0);
  }

function selectedGoal() {
  return document.querySelector('input[name="kpi-goal"]:checked')?.value || "cpa";
}

  function parseCSV(text) {
    const rows = [];
    let currentRow = [];
    let currentValue = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
      const character = text[i];
      const nextCharacter = text[i + 1];

      if (character === '"') {
        if (inQuotes && nextCharacter === '"') {
          currentValue += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (character === "," && !inQuotes) {
        currentRow.push(currentValue);
        currentValue = "";
      } else if ((character === "\n" || character === "\r") && !inQuotes) {
        if (character === "\r" && nextCharacter === "\n") i += 1;
        currentRow.push(currentValue);
        if (currentRow.some((cell) => String(cell).trim() !== "")) rows.push(currentRow);
        currentRow = [];
        currentValue = "";
      } else {
        currentValue += character;
      }
    }

    currentRow.push(currentValue);
    if (currentRow.some((cell) => String(cell).trim() !== "")) rows.push(currentRow);
    return rows;
  }

  function findColumn(headers, aliases) {
    const normalizedHeaders = headers.map(normalizeHeader);
    return normalizedHeaders.findIndex((header) => aliases.includes(header));
  }

  function mapColumns(headers) {
    return {
      searchTerm: findColumn(headers, ["search term", "search terms", "query"]),
      keyword: findColumn(headers, ["keyword", "keyword text"]),
      matchType: findColumn(headers, [
        "match type",
        "keyword match type",
        "search term match type",
        "search terms match type"
      ]),
      campaign: findColumn(headers, ["campaign", "campaign name"]),
      adGroup: findColumn(headers, ["ad group", "ad group name"]),
      clicks: findColumn(headers, ["clicks"]),
      cost: findColumn(headers, ["cost", "cost micros"]),
      conversions: findColumn(headers, ["conversions", "conv"]),
      conversionValue: findColumn(headers, [
        "conv value",
        "conversion value",
        "conversions value",
        "all conv value"
      ])
    };
  }

  function getCell(row, index) {
    return index >= 0 ? String(row[index] ?? "").trim() : "";
  }

  function tokenize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[\[\]"+]/g, " ")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 1 && !stopWords.has(word));
  }

  function keywordAlignment(searchTerm, keyword) {
    if (!keyword) {
      return {
        label: "N/A",
        score: "",
        category: "unavailable",
        note: "Keyword column not included."
      };
    }

    const termTokens = new Set(tokenize(searchTerm));
    const keywordTokens = [...new Set(tokenize(keyword))];

    if (!keywordTokens.length) {
      return {
        label: "N/A",
        score: "",
        category: "unavailable",
        note: "No comparable keyword words."
      };
    }

    const matches = keywordTokens.filter((word) => termTokens.has(word)).length;
    const score = Math.round((matches / keywordTokens.length) * 100);

    if (score === 100) {
      return {
        label: "High",
        score,
        category: "high",
        note: "All keyword words appear in the search term."
      };
    }

    if (score >= 50) {
      return {
        label: "Medium",
        score,
        category: "medium",
        note: "Some keyword words appear in the search term."
      };
    }

    return {
      label: "Low",
      score,
      category: "low",
      note: "Few or no keyword words appear in the search term."
    };
  }

  function importRows(csvText) {
    const parsed = parseCSV(csvText);

    if (parsed.length < 2) {
      throw new Error("The uploaded file does not contain report rows.");
    }

    const headers = parsed[0];
    const columns = mapColumns(headers);
    const requiredColumns = ["searchTerm", "cost", "clicks", "conversions"];
    const missing = requiredColumns.filter((key) => columns[key] < 0);

    if (missing.length) {
      const labels = {
        searchTerm: "Search term",
        cost: "Cost",
        clicks: "Clicks",
        conversions: "Conversions"
      };
      throw new Error(`Missing required column(s): ${missing.map((key) => labels[key]).join(", ")}.`);
    }

    state.columns = columns;
    state.rows = parsed.slice(1).map((row) => {
      const cost = cleanNumber(getCell(row, columns.cost));
      const conversions = cleanNumber(getCell(row, columns.conversions));
      const conversionValue = cleanNumber(getCell(row, columns.conversionValue));
      const keyword = getCell(row, columns.keyword);

      return {
        searchTerm: getCell(row, columns.searchTerm),
        keyword: keyword || "Not included",
        matchType: getCell(row, columns.matchType) || "Not included",
        campaign: getCell(row, columns.campaign) || "Not included",
        adGroup: getCell(row, columns.adGroup) || "Not included",
        clicks: cleanNumber(getCell(row, columns.clicks)),
        cost,
        conversions,
        conversionValue,
        cpa: conversions > 0 ? cost / conversions : null,
        roas: cost > 0 ? conversionValue / cost : null,
        alignment: keywordAlignment(getCell(row, columns.searchTerm), keyword)
      };
    }).filter((row) => row.searchTerm);

    const optionalMissing = [];
    if (columns.keyword < 0) optionalMissing.push("Keyword");
    if (columns.matchType < 0) optionalMissing.push("Match type");

    return optionalMissing;
  }

  function analyze() {
    if (!state.rows.length) {
      elements.analysisMessage.textContent = "Upload a CSV report before running analysis.";
      return;
    }

    const goal = selectedGoal();
    const targetCpa = cleanNumber(elements.targetCpa.value);
    const targetRoas = cleanNumber(elements.targetRoas.value);
    const zeroSpend = cleanNumber(elements.zeroConvSpend.value);
    const zeroClicks = cleanNumber(elements.zeroConvClicks.value);

    state.flaggedRows = state.rows.reduce((flagged, row) => {
      const reasons = [];
      const tags = [];

      if (row.conversions === 0 && row.cost >= zeroSpend) {
        reasons.push(`No conversions after ${formatMoney(row.cost)} spend`);
        tags.push("zero-conversions");
      }

      if (row.conversions === 0 && row.clicks >= zeroClicks) {
        reasons.push(`No conversions after ${row.clicks} clicks`);
        if (!tags.includes("zero-conversions")) tags.push("zero-conversions");
      }

      if ((goal === "cpa" || goal === "both") && row.conversions > 0 && row.cpa > targetCpa) {
        reasons.push(`CPA ${formatMoney(row.cpa)} exceeds target ${formatMoney(targetCpa)}`);
        tags.push("high-cpa");
      }

      if (
        (goal === "roas" || goal === "both") &&
        state.columns.conversionValue >= 0 &&
        row.cost > 0 &&
        row.roas < targetRoas
      ) {
        reasons.push(`ROAS ${row.roas.toFixed(2)} below target ${targetRoas.toFixed(2)}`);
        tags.push("low-roas");
      }

      if (reasons.length) {
        if (row.alignment.category === "low") tags.push("low-alignment");

        const reviewAction = row.alignment.category === "low"
          ? "Check relevance; consider negative keyword or tighter targeting."
          : "Review query intent and conversion path before excluding.";

        flagged.push({
          ...row,
          reasons,
          tags,
          reviewAction
        });
      }

      return flagged;
    }, []);

    state.analyzed = true;
    renderSummary();
    renderResults();
  }

  function renderSummary() {
    const totalSpend = state.rows.reduce((sum, row) => sum + row.cost, 0);
    const flaggedSpend = state.flaggedRows.reduce((sum, row) => sum + row.cost, 0);
    const flaggedRate = totalSpend ? (flaggedSpend / totalSpend) * 100 : 0;

    elements.totalSpend.textContent = formatMoney(totalSpend);
    elements.flaggedSpend.textContent = formatMoney(flaggedSpend);
    elements.flaggedCount.textContent = state.flaggedRows.length.toLocaleString();
    elements.flaggedRate.textContent = `${flaggedRate.toFixed(1)}%`;
    elements.exportButton.disabled = state.flaggedRows.length === 0;

    const relevanceAvailable = state.columns.keyword >= 0
      ? " Keyword alignment is shown as a directional review signal."
      : " Add a Keyword column to calculate keyword alignment.";

    elements.analysisMessage.textContent = state.flaggedRows.length
      ? `${state.flaggedRows.length} search term(s) meet your review rules.${relevanceAvailable}`
      : `No search terms meet the current review rules.${relevanceAvailable}`;
  }

  function filteredRows() {
    const filter = elements.reasonFilter.value;
    if (filter === "all") return state.flaggedRows;
    return state.flaggedRows.filter((row) => row.tags.includes(filter));
  }

  function renderResults() {
    const rows = filteredRows();

    if (!state.analyzed) return;

    if (!rows.length) {
      elements.resultsBody.innerHTML = `
        <tr>
          <td colspan="12" class="empty-results">No flagged terms match this filter.</td>
        </tr>
      `;
      return;
    }

    elements.resultsBody.innerHTML = rows.map((row) => {
      const alignmentText = row.alignment.score === ""
        ? row.alignment.label
        : `${row.alignment.label} (${row.alignment.score}%)`;

      return `
        <tr>
          <th scope="row">${escapeHtml(row.searchTerm)}</th>
          <td>${escapeHtml(row.keyword)}</td>
          <td>${escapeHtml(row.matchType)}</td>
          <td title="${escapeHtml(row.alignment.note)}">${escapeHtml(alignmentText)}</td>
          <td>${escapeHtml(row.campaign)}</td>
          <td>${row.clicks.toLocaleString()}</td>
          <td class="money">${formatMoney(row.cost)}</td>
          <td>${row.conversions.toLocaleString()}</td>
          <td class="money">${row.cpa === null ? "—" : formatMoney(row.cpa)}</td>
          <td>${row.roas === null || state.columns.conversionValue < 0 ? "—" : row.roas.toFixed(2)}</td>
          <td>${escapeHtml(row.reasons.join("; "))}</td>
          <td>${escapeHtml(row.reviewAction)}</td>
        </tr>
      `;
    }).join("");
  }

  function csvCell(value) {
    const stringValue = String(value ?? "");
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  function exportFlagged() {
    if (!state.flaggedRows.length) return;

    const headers = [
      "Search Term", "Keyword", "Match Type", "Keyword Alignment", "Alignment Score",
      "Alignment Note", "Campaign", "Ad Group", "Clicks", "Cost", "Conversions",
      "Conversion Value", "CPA", "ROAS", "Reason Flagged", "Review Action"
    ];

    const rows = state.flaggedRows.map((row) => [
      row.searchTerm,
      row.keyword,
      row.matchType,
      row.alignment.label,
      row.alignment.score,
      row.alignment.note,
      row.campaign,
      row.adGroup,
      row.clicks,
      row.cost.toFixed(2),
      row.conversions,
      row.conversionValue.toFixed(2),
      row.cpa === null ? "" : row.cpa.toFixed(2),
      row.roas === null ? "" : row.roas.toFixed(2),
      row.reasons.join("; "),
      row.reviewAction
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "flagged-search-term-review.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function updateGoalFields() {
    const goal = selectedGoal();
    // document.querySelector('[data-requires="cpa"]').classList.toggle("hidden", goal === "roas");
    // document.querySelector('[data-requires="roas"]').classList.toggle("hidden", goal === "cpa");
        elements.cpaSetting.hidden = goal === "roas";
    elements.roasSetting.hidden = goal === "cpa";
  }

  elements.fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const optionalMissing = importRows(await file.text());
      state.flaggedRows = [];
      state.analyzed = false;
      elements.fileMessage.textContent = `${file.name}: ${state.rows.length} search term(s) imported.`;
      if (optionalMissing.length) {
        elements.fileMessage.textContent += ` Optional column(s) not found: ${optionalMissing.join(", ")}.`;
      }
      elements.analysisMessage.textContent = "Set your rules, then select Analyze Search Terms.";
      elements.resultsBody.innerHTML = `
        <tr>
          <td colspan="12" class="empty-results">Report imported. Run analysis to see candidates.</td>
        </tr>
      `;
      elements.exportButton.disabled = true;
    } catch (error) {
      state.rows = [];
      state.flaggedRows = [];
      state.analyzed = false;
      elements.fileMessage.textContent = error.message;
      elements.analysisMessage.textContent = "The report could not be imported.";
    }
  });

  elements.kpiGoalInputs.forEach((input) => {
    input.addEventListener("change", updateGoalFields);
  });
  elements.kpiForm.addEventListener("submit", (event) => {
    event.preventDefault();
    analyze();
  });
  elements.reasonFilter.addEventListener("change", renderResults);
  elements.exportButton.addEventListener("click", exportFlagged);

  updateGoalFields();
})();
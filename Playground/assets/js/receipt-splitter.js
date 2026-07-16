(() => {
  const state = {
    people: [],
    items: []
  };

  const elements = {
    personForm: document.querySelector("#person-form"),
    personName: document.querySelector("#person-name"),
    personChips: document.querySelector("#person-chips"),
    itemForm: document.querySelector("#item-form"),
    itemName: document.querySelector("#item-name"),
    itemPrice: document.querySelector("#item-price"),
    resetButton: document.querySelector("#reset-button"),
    receiptHead: document.querySelector("#receipt-head"),
    receiptBody: document.querySelector("#receipt-body"),
    receiptFoot: document.querySelector("#receipt-foot"),
    emptyState: document.querySelector("#empty-state"),
    subtotal: document.querySelector("#subtotal"),
    assignmentMessage: document.querySelector("#assignment-message")
  };

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  });

  function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function toCents(value) {
    return Math.round(Number(value) * 100);
  }

  function formatCents(cents) {
    return currency.format(cents / 100);
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function addPerson(name) {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const alreadyExists = state.people.some(
      (person) => person.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (alreadyExists) {
      elements.personName.setCustomValidity("That name has already been added.");
      elements.personName.reportValidity();
      return;
    }

    elements.personName.setCustomValidity("");
    state.people.push({ id: createId("person"), name: trimmedName });
    render();
  }

  function removePerson(personId) {
    state.people = state.people.filter((person) => person.id !== personId);
    state.items.forEach((item) => item.assignedTo.delete(personId));
    render();
  }

  function addItem(name, price) {
    const cents = toCents(price);
    if (!name.trim() || !Number.isInteger(cents) || cents <= 0) return;

    state.items.push({
      id: createId("item"),
      name: name.trim(),
      cents,
      assignedTo: new Set()
    });
    render();
  }

  function removeItem(itemId) {
    state.items = state.items.filter((item) => item.id !== itemId);
    render();
  }

  function toggleAssignment(itemId, personId, checked) {
    const item = state.items.find((entry) => entry.id === itemId);
    if (!item) return;

    if (checked) item.assignedTo.add(personId);
    else item.assignedTo.delete(personId);

    renderTotals();
    renderStatus();
  }

  function calculateTotals() {
    const totals = Object.fromEntries(state.people.map((person) => [person.id, 0]));
    let unassignedCount = 0;

    state.items.forEach((item) => {
      const assignedPeople = state.people.filter((person) => item.assignedTo.has(person.id));

      if (!assignedPeople.length) {
        unassignedCount += 1;
        return;
      }

      const baseShare = Math.floor(item.cents / assignedPeople.length);
      const remainder = item.cents % assignedPeople.length;

      assignedPeople.forEach((person, index) => {
        totals[person.id] += baseShare + (index < remainder ? 1 : 0);
      });
    });

    return { totals, unassignedCount };
  }

  function renderPeople() {
    elements.personChips.innerHTML = state.people.map((person) => `
      <span class="chip">
        ${escapeHtml(person.name)}
        <button type="button" data-remove-person="${person.id}" aria-label="Remove ${escapeHtml(person.name)}">×</button>
      </span>
    `).join("");
  }

  function renderTable() {
    const personHeaders = state.people.map((person) => `
      <th scope="col" class="person-column">${escapeHtml(person.name)}</th>
    `).join("");

    elements.receiptHead.innerHTML = state.items.length ? `
      <tr>
        <th scope="col" class="item-column">Item</th>
        <th scope="col" class="price-column">Price</th>
        ${personHeaders}
        <th scope="col" class="action-column"><span class="sr-only">Actions</span></th>
      </tr>
    ` : "";

    elements.receiptBody.innerHTML = state.items.map((item) => {
      const checks = state.people.map((person) => `
        <td class="check-column">
          <label class="check-label">
            <input
              type="checkbox"
              data-item-id="${item.id}"
              data-person-id="${person.id}"
              ${item.assignedTo.has(person.id) ? "checked" : ""}
              aria-label="Assign ${escapeHtml(item.name)} to ${escapeHtml(person.name)}"
            >
          </label>
        </td>
      `).join("");

      return `
        <tr>
          <th scope="row">${escapeHtml(item.name)}</th>
          <td class="money">${formatCents(item.cents)}</td>
          ${checks}
          <td>
            <button class="icon-button" type="button" data-remove-item="${item.id}" aria-label="Remove ${escapeHtml(item.name)}">×</button>
          </td>
        </tr>
      `;
    }).join("");

    elements.emptyState.hidden = state.items.length > 0;
    elements.receiptFoot.innerHTML = state.items.length ? renderTotalsRow() : "";
  }

  function renderTotalsRow() {
    const { totals } = calculateTotals();
    const cells = state.people.map((person) => `
      <td class="money person-total">${formatCents(totals[person.id])}</td>
    `).join("");

    return `
      <tr>
        <th scope="row">Total</th>
        <td class="money">${formatCents(subtotalCents())}</td>
        ${cells}
        <td></td>
      </tr>
    `;
  }

  function subtotalCents() {
    return state.items.reduce((total, item) => total + item.cents, 0);
  }

  function renderTotals() {
    elements.subtotal.textContent = formatCents(subtotalCents());
    if (state.items.length) {
      elements.receiptFoot.innerHTML = renderTotalsRow();
    }
  }

  function renderStatus() {
    const { unassignedCount } = calculateTotals();

    if (!state.people.length && !state.items.length) {
      elements.assignmentMessage.textContent = "Add people and items to begin splitting.";
    } else if (!state.people.length) {
      elements.assignmentMessage.textContent = "Add at least one person to assign items.";
    } else if (unassignedCount > 0) {
      const noun = unassignedCount === 1 ? "item is" : "items are";
      elements.assignmentMessage.textContent = `${unassignedCount} ${noun} not assigned yet.`;
    } else if (state.items.length) {
      elements.assignmentMessage.textContent = "Every item has been assigned.";
    } else {
      elements.assignmentMessage.textContent = "Add receipt items to start calculating totals.";
    }
  }

  function render() {
    renderPeople();
    renderTable();
    renderTotals();
    renderStatus();
  }

  elements.personForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addPerson(elements.personName.value);
    if (!elements.personName.validationMessage) {
      elements.personName.value = "";
      elements.personName.focus();
    }
  });

  elements.personName.addEventListener("input", () => {
    elements.personName.setCustomValidity("");
  });

  elements.itemForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addItem(elements.itemName.value, elements.itemPrice.value);
    elements.itemName.value = "";
    elements.itemPrice.value = "";
    elements.itemName.focus();
  });

  elements.personChips.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-person]");
    if (button) removePerson(button.dataset.removePerson);
  });

  elements.receiptBody.addEventListener("change", (event) => {
    if (event.target.matches('input[type="checkbox"]')) {
      toggleAssignment(event.target.dataset.itemId, event.target.dataset.personId, event.target.checked);
    }
  });

  elements.receiptBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-item]");
    if (button) removeItem(button.dataset.removeItem);
  });

  elements.resetButton.addEventListener("click", () => {
    state.people = [];
    state.items = [];
    render();
  });

  render();
})();
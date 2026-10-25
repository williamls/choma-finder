const areaSelect = document.getElementById("area");
const filtersEl = document.getElementById("filters");
const listEl = document.getElementById("list");
const countEl = document.getElementById("count");

let food = null; // selected food id, or null for all
let areas = AREAS;
let vendors = VENDORS; // sample data until the database answers

async function loadData() {
  if (!db) return;
  const [a, l] = await Promise.all([
    db.from("areas").select("name").order("sort").order("name"),
    db.from("listings").select("*")
  ]);
  if (a.error || l.error) {
    countEl.textContent = "Could not load vendors. Check your connection and refresh.";
    areas = [];
    vendors = [];
    return;
  }
  areas = a.data.map(x => x.name);
  vendors = l.data;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function foodLabel(id) {
  return FOODS.find(f => f.id === id).label;
}

function telHref(phone) {
  return "tel:" + phone.replace(/[^\d+]/g, "");
}

function setupAreas() {
  areas.forEach(a => areaSelect.append(new Option(a, a)));
  const saved = localStorage.getItem("area");
  if (saved && areas.includes(saved)) areaSelect.value = saved;
  areaSelect.addEventListener("change", () => {
    localStorage.setItem("area", areaSelect.value);
    render();
  });
}

function setupFilters() {
  const options = [{ id: null, label: "All" }, ...FOODS];
  options.forEach(opt => {
    const btn = el("button", "chip", opt.label);
    btn.type = "button";
    btn.setAttribute("aria-pressed", String(opt.id === food));
    btn.addEventListener("click", () => {
      food = opt.id;
      filtersEl.querySelectorAll(".chip").forEach(b => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      render();
    });
    filtersEl.append(btn);
  });
}

function rank(v) {
  // Featured first, then available today, then the rest.
  return v.featured ? 0 : v.available ? 1 : 2;
}

function card(v) {
  const c = el("article", "card" + (v.featured ? " featured" : ""));

  const tags = el("div", "tags");
  if (v.featured) tags.append(el("span", "tag featured", "Featured"));
  if (v.available) tags.append(el("span", "tag", "Available today"));
  if (v.delivers) tags.append(el("span", "tag", "Delivers"));
  if (tags.children.length) c.append(tags);

  c.append(el("h2", "", v.name));
  c.append(el("p", "meta", v.area + " · " + v.sells.map(foodLabel).join(", ")));
  c.append(el("p", "note", v.note));

  const call = el("a", "call", "Call");
  call.href = telHref(v.phone);
  // Count the tap; the call itself is not delayed or blocked.
  call.addEventListener("click", () => { if (db) db.rpc("log_call", { vendor: v.id }); });
  c.append(call);

  const number = el("p", "number", v.phone);
  const copy = el("button", "copy", "Copy");
  copy.type = "button";
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(v.phone);
      copy.textContent = "Copied";
    } catch {
      copy.textContent = "Press and hold number";
    }
    setTimeout(() => (copy.textContent = "Copy"), 2000);
  });
  number.append(copy);
  c.append(number);

  return c;
}

function render() {
  const area = areaSelect.value;
  const shown = vendors
    .filter(v => v.area === area && (!food || v.sells.includes(food)))
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));

  listEl.replaceChildren();
  if (!shown.length) {
    countEl.textContent = "";
    listEl.append(el("p", "empty", "No vendors found. Try another food or area."));
    return;
  }
  countEl.textContent = shown.length + (shown.length === 1 ? " vendor" : " vendors");
  shown.forEach(v => listEl.append(card(v)));
}

(async function start() {
  await loadData();
  setupAreas();
  setupFilters();
  render();
})();

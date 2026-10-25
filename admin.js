const $ = id => document.getElementById(id);

let areas = [];
let vendors = [];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(text, className, onClick) {
  const b = el("button", className, text);
  b.type = "button";
  b.addEventListener("click", onClick);
  return b;
}

function say(text, bad) {
  $("msg").textContent = text || "";
  $("msg").className = "msg" + (bad ? " bad" : "");
}

function show(step) {
  $("step-login").hidden = step !== "login";
  $("step-admin").hidden = step !== "admin";
}

// Run a database call, show any error, then refresh the lists.
async function act(call, done) {
  const { error } = await call;
  if (error) return say(error.message, true);
  say(done || "Saved.");
  await reload();
}

// ---- Login ----

$("login").addEventListener("click", async e => {
  e.target.disabled = true;
  say();
  const { error } = await db.auth.signInWithPassword({ email: $("email").value.trim(), password: $("pass").value });
  e.target.disabled = false;
  if (error) return say("Wrong email or password.", true);
  await enter();
});

$("logout").addEventListener("click", async () => {
  await db.auth.signOut();
  $("pass").value = "";
  say("You are logged out.");
  show("login");
});

async function enter() {
  const { data: ok } = await db.rpc("is_admin");
  if (!ok) {
    await db.auth.signOut();
    show("login");
    return say("This account is not an admin.", true);
  }
  say();
  await reload();
  show("admin");
}

// ---- Data ----

async function reload() {
  const [a, v] = await Promise.all([
    db.from("areas").select("*").order("sort").order("name"),
    db.rpc("admin_vendors")
  ]);
  if (a.error || v.error) return say((a.error || v.error).message, true);
  areas = a.data;
  vendors = v.data;
  renderFilter();
  renderVendors();
  renderAreas();
}

// ---- Vendors ----

function renderFilter() {
  const current = $("filter").value || "all";
  const options = [new Option("Everything", "all"), new Option("Waiting for approval", "pending"),
    ...areas.map(a => new Option(a.name, "area:" + a.name))];
  $("filter").replaceChildren(...options);
  $("filter").value = [...$("filter").options].some(o => o.value === current) ? current : "all";
}
$("filter").addEventListener("change", renderVendors);

function setVendor(v, changes) {
  const next = { approved: v.approved, hidden: v.hidden, featured_until: v.featured_until, ...changes };
  return act(db.rpc("admin_set_vendor", {
    vendor: v.id, approve: next.approved, hide: next.hidden, feature_until: next.featured_until
  }));
}

function vendorCard(v) {
  const c = el("article", "card" + (v.featured ? " featured" : ""));

  const tags = el("div", "tags");
  if (!v.approved) tags.append(el("span", "tag featured", "Waiting for approval"));
  if (v.hidden) tags.append(el("span", "tag", "Hidden"));
  if (v.featured) tags.append(el("span", "tag featured", "Featured until " + v.featured_until));
  if (v.available) tags.append(el("span", "tag", "Available today"));
  if (tags.children.length) c.append(tags);

  c.append(el("h2", "", v.name));
  c.append(el("p", "meta", v.area + " · " + v.sells.join(", ") + " · " + v.taps_7d + " call taps in 7 days"));
  c.append(el("p", "note", v.note));

  const call = el("a", "call", "Call " + v.phone);
  call.href = "tel:" + v.phone.replace(/[^\d+]/g, "");
  c.append(call);

  const row = el("div", "actions");
  row.append(button(v.approved ? "Unapprove" : "Approve", "big", () => setVendor(v, { approved: !v.approved })));
  row.append(button(v.hidden ? "Show" : "Hide", "danger", () => setVendor(v, { hidden: !v.hidden })));
  c.append(row);

  const feat = el("div", "feature");
  feat.append(el("label", "", "Featured until (last day)"));
  const date = el("input");
  date.type = "date";
  date.value = v.featured_until || "";
  feat.append(date);
  feat.append(button("Save Featured date", "danger", () => setVendor(v, { featured_until: date.value || null })));
  if (v.featured_until) feat.append(button("Remove Featured", "link", () => setVendor(v, { featured_until: null })));
  c.append(feat);

  c.append(button("Delete listing", "link", () => {
    if (confirm("Delete " + v.name + " for good? Hiding is safer.")) {
      act(db.rpc("admin_delete_vendor", { vendor: v.id }), "Listing deleted.");
    }
  }));

  return c;
}

function renderVendors() {
  const waiting = vendors.filter(v => !v.approved).length;
  $("pending").hidden = !waiting;
  $("pending").textContent = waiting + (waiting === 1 ? " listing is" : " listings are") + " waiting for approval. Call them first.";

  const f = $("filter").value;
  const shown = vendors.filter(v =>
    f === "all" || (f === "pending" ? !v.approved : v.area === f.slice(5)));
  $("vendors").replaceChildren(...(shown.length ? shown.map(vendorCard) : [el("p", "empty", "No vendors here.")]));
}

// ---- Areas ----

function areaRow(a) {
  const row = el("div", "area-row");
  const name = el("input");
  name.type = "text";
  name.value = a ? a.name : "";
  name.placeholder = "New area name";
  name.maxLength = 60;
  const sort = el("input");
  sort.type = "number";
  sort.value = a ? a.sort : areas.length + 1;
  sort.title = "Order in the list";
  sort.setAttribute("aria-label", "Order in the list");

  row.append(name, sort);
  row.append(button(a ? "Save" : "Add area", a ? "danger" : "big", () =>
    act(db.rpc("admin_save_area", { area_id: a ? a.id : null, area_name: name.value, area_sort: Number(sort.value) || 0 }),
      a ? "Area saved." : "Area added.")));
  if (a) {
    row.append(button("Delete", "link", () => {
      if (confirm("Delete the area " + a.name + "?")) {
        act(db.rpc("admin_delete_area", { area_id: a.id }), "Area deleted.");
      }
    }));
  }
  return row;
}

function renderAreas() {
  $("areas").replaceChildren(...areas.map(areaRow), areaRow(null));
}

// ---- Start ----

(async function start() {
  if (!db) return say("The database is not set up yet. See README.md.", true);
  const { data } = await db.auth.getSession();
  if (data.session) await enter();
  else show("login");
})();

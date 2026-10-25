const $ = id => document.getElementById(id);
const steps = ["step-login", "step-listing"];

let signingUp = false;
let listing = null; // the vendor's saved row, or null if they have none yet

function show(step) {
  steps.forEach(s => ($(s).hidden = s !== step));
}

function say(text, bad) {
  $("msg").textContent = text || "";
  $("msg").className = "msg" + (bad ? " bad" : "");
}

// Turn 0700 000 000 into +256700000000 using DEFAULT_COUNTRY_CODE.
function toE164(input) {
  const cc = CONFIG.DEFAULT_COUNTRY_CODE || "+256";
  const digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return "+" + digits.slice(2);
  return cc + digits.replace(/^0/, "");
}

async function busy(btn, fn) {
  btn.disabled = true;
  try { await fn(); } finally { btn.disabled = false; }
}

// ---- Sign in (phone number + password, no SMS) ----
// Supabase logs in by email, so the phone number becomes a hidden login name. No email is ever sent.
const emailFor = phone => toE164(phone).replace("+", "") + "@vendors.example.com";

function setMode(up) {
  signingUp = up;
  $("login-title").textContent = up ? "Create an account" : "Log in";
  $("login-go").textContent = up ? "Create account" : "Log in";
  $("login-switch").textContent = up ? "Already have an account? Log in" : "New here? Create an account";
  $("pass-hint").textContent = up ? "(at least 6 characters, write it down)" : "";
  $("login-pass").autocomplete = up ? "new-password" : "current-password";
  say();
}
$("login-switch").addEventListener("click", () => setMode(!signingUp));

$("login-go").addEventListener("click", e => busy(e.target, async () => {
  say();
  const phone = $("login-phone").value;
  const password = $("login-pass").value;
  if (toE164(phone).length < 9) return say("Please enter your phone number.", true);
  if (password.length < 6) return say("Password must be at least 6 characters.", true);
  const creds = { email: emailFor(phone), password };

  if (signingUp) {
    const { data, error } = await db.auth.signUp(creds);
    if (error) {
      return say(/registered|exists/i.test(error.message)
        ? "This number already has an account. Tap Log in."
        : "Could not create the account. " + error.message, true);
    }
    // No session means Supabase still wants an email confirmation: see README step 4.
    if (!data.session) return say("Setup problem: turn off 'Confirm email' in Supabase.", true);
  } else {
    const { error } = await db.auth.signInWithPassword(creds);
    if (error) return say("Wrong phone number or password.", true);
  }
  say();
  await openListing();
}));

$("logout").addEventListener("click", async () => {
  await db.auth.signOut();
  $("login-pass").value = "";
  setMode(false);
  say("You are logged out.");
  show("step-login");
});

// ---- Listing ----

function buildForm() {
  const { areas } = window.lists;
  $("area-pick").replaceChildren(new Option("Choose your area", ""),
    ...areas.map(a => new Option(a.name, a.id)));
  $("sells").replaceChildren(...FOODS.map(f => {
    const label = document.createElement("label");
    label.className = "tick";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.value = f.id;
    label.append(box, " " + f.label);
    return label;
  }));
}

function fillForm() {
  const v = listing;
  $("name").value = v ? v.name : "";
  $("phone").value = v ? v.phone : "";
  $("area-pick").value = v ? v.area_id : "";
  $("note").value = v ? v.note : "";
  $("delivers").checked = v ? v.delivers : false;
  $("sells").querySelectorAll("input").forEach(b => (b.checked = !!v && v.sells.includes(b.value)));
  $("form-title").textContent = v ? "Your listing" : "Create your listing";
  $("remove").hidden = !v;
  $("available-box").hidden = !v;
  $("status").hidden = !v;
  if (v) {
    $("status").textContent = v.approved
      ? "Approved. Customers can see your listing."
      : "Waiting for approval. We will call you on " + v.phone + " to confirm. Customers cannot see you until then.";
    $("status").className = "status" + (v.approved ? " ok" : "");
  }
  showAvailable(v ? v.available_today : false);
  countLeft();
}

function showAvailable(on) {
  $("available").setAttribute("aria-pressed", String(on));
  $("available-text").textContent = "Available today: " + (on ? "ON" : "OFF");
}

function countLeft() {
  $("left").textContent = "(" + (280 - $("note").value.length) + " left)";
}
$("note").addEventListener("input", countLeft);

async function openListing() {
  const { data, error } = await db.from("my_listing").select("*").maybeSingle();
  if (error) return say("Could not load your listing. " + error.message, true);
  listing = data;
  fillForm();
  show("step-listing");
}

$("form").addEventListener("submit", async e => {
  e.preventDefault();
  const sells = [...$("sells").querySelectorAll("input:checked")].map(b => b.value);
  if (!sells.length) return say("Tick at least one thing you sell.", true);
  const row = {
    name: $("name").value.trim(),
    phone: $("phone").value.trim(),
    area_id: Number($("area-pick").value),
    sells,
    note: $("note").value.trim(),
    delivers: $("delivers").checked
  };
  const btn = e.submitter;
  await busy(btn, async () => {
    const { error } = listing
      ? await db.from("vendors").update(row).eq("id", listing.id)
      : await db.from("vendors").insert(row);
    if (error) return say("Could not save. " + error.message, true);
    say("Saved.");
    await openListing();
    window.scrollTo(0, 0);
  });
});

$("available").addEventListener("click", e => busy(e.currentTarget, async () => {
  const on = $("available").getAttribute("aria-pressed") !== "true";
  const { error } = await db.rpc("set_available", { on_: on });
  if (error) return say("Could not change this. " + error.message, true);
  say();
  showAvailable(on);
}));

$("remove").addEventListener("click", e => busy(e.target, async () => {
  if (!confirm("Remove your listing? Customers will no longer see it.")) return;
  const { error } = await db.from("vendors").delete().eq("id", listing.id);
  if (error) return say("Could not remove. " + error.message, true);
  say("Your listing was removed.");
  await openListing();
}));

// ---- Start ----

(async function start() {
  if (!db) {
    say("This page needs the database set up first. See README.md.", true);
    return;
  }
  const { data, error } = await db.from("areas").select("id,name").order("sort").order("name");
  if (error) return say("Could not load areas. " + error.message, true);
  window.lists = { areas: data };
  buildForm();

  const { data: session } = await db.auth.getSession();
  if (session.session) await openListing();
  else show("step-login");
})();

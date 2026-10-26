import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const loadingArea = document.querySelector("#loadingArea");
const accessArea = document.querySelector("#accessArea");
const deniedArea = document.querySelector("#deniedArea");
const welcomeText = document.querySelector("#welcomeText");
const statusBox = document.querySelector("#status");
const messagesBox = document.querySelector("#messages");
const logoutButton = document.querySelector("#logoutButton");
const refreshButton = document.querySelector("#refreshButton");

function showOnly(area) {
  [loadingArea, accessArea, deniedArea].forEach(item => item.classList.add("hidden"));
  area.classList.remove("hidden");
}
function setStatus(message, kind = "") {
  statusBox.textContent = message;
  statusBox.className = `notice ${kind}`.trim();
}
function escapeText(value) {
  return String(value ?? "");
}
function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}

async function loadMessages() {
  messagesBox.replaceChildren();
  const loading = document.createElement("div");
  loading.className = "empty";
  loading.textContent = "Loading messages…";
  messagesBox.append(loading);

  const { data, error } = await supabase
    .from("contact_messages")
    .select("id,name,email,subject,message,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  messagesBox.replaceChildren();
  if (error) {
    const errorBox = document.createElement("div");
    errorBox.className = "notice error";
    errorBox.textContent = error.message.includes("contact_messages")
      ? "The contact-message table is not ready yet. Run the provided Supabase setup SQL, then refresh this page."
      : `Could not load messages: ${error.message}`;
    messagesBox.append(errorBox);
    return;
  }
  if (!data?.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No messages yet. After the contact form is connected, submitted messages will appear here.";
    messagesBox.append(empty);
    return;
  }

  data.forEach(row => {
    const card = document.createElement("article");
    card.className = "message";
    const title = document.createElement("h3");
    title.textContent = escapeText(row.subject || "Website contact message");
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${escapeText(row.name)} · ${escapeText(row.email)} · ${formatDate(row.created_at)}`;
    const body = document.createElement("p");
    body.textContent = escapeText(row.message);
    const emailLink = document.createElement("a");
    emailLink.href = `mailto:${encodeURIComponent(String(row.email || ""))}`;
    emailLink.textContent = "Reply by email";
    card.append(title, meta, body, emailLink);
    messagesBox.append(card);
  });
}

async function checkAccess() {
  showOnly(loadingArea);
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    window.location.replace("./auth.html?next=admin");
    return;
  }

  const { data: adminRecord, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error || !adminRecord) {
    document.querySelector("#deniedText").textContent = error
      ? `We could not verify administrator access. Check that the Supabase setup SQL has been run. Details: ${error.message}`
      : "This account is signed in, but it has not been approved as an administrator yet.";
    showOnly(deniedArea);
    return;
  }

  welcomeText.textContent = `Signed in as ${session.user.email || "your account"}.`;
  logoutButton.classList.remove("hidden");
  showOnly(accessArea);
  setStatus("Administrator access verified.", "success");
  await loadMessages();
}

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  const { error } = await supabase.auth.signOut();
  logoutButton.disabled = false;
  if (error) {
    setStatus(`Could not sign out: ${error.message}`, "error");
    return;
  }
  window.location.replace("./auth.html");
});
refreshButton.addEventListener("click", loadMessages);
supabase.auth.onAuthStateChange(() => {
  // Let Supabase finish updating its stored session before checking again.
  window.setTimeout(checkAccess, 0);
});
checkAccess();

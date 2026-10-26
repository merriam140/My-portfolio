import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";

const configured = SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR-PROJECT") &&
  SUPABASE_ANON_KEY.length > 20 &&
  !SUPABASE_ANON_KEY.includes("YOUR-ANON-KEY");

const authArea = document.querySelector("#authArea");
const accountArea = document.querySelector("#accountArea");
const heading = document.querySelector("#heading");
const intro = document.querySelector("#intro");
const loginTab = document.querySelector("#loginTab");
const signupTab = document.querySelector("#signupTab");
const form = document.querySelector("#authForm");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const submitButton = document.querySelector("#submitButton");
const forgotButton = document.querySelector("#forgotButton");
const statusBox = document.querySelector("#status");
const accountText = document.querySelector("#accountText");
const accountStatus = document.querySelector("#accountStatus");
let mode = "login";
let supabase;

function showStatus(message, type = "success", box = statusBox) {
  box.textContent = message;
  box.className = `status show ${type}`;
}
function clearStatus() {
  statusBox.textContent = "";
  statusBox.className = "status";
}
function setMode(nextMode) {
  mode = nextMode;
  const signingUp = mode === "signup";
  loginTab.classList.toggle("active", !signingUp);
  signupTab.classList.toggle("active", signingUp);
  loginTab.setAttribute("aria-selected", String(!signingUp));
  signupTab.setAttribute("aria-selected", String(signingUp));
  heading.textContent = signingUp ? "Create your account." : "Welcome back.";
  intro.textContent = signingUp
    ? "Register with your email and a password to create your account."
    : "Sign in to your account. The portfolio itself remains public and can be viewed without signing in.";
  submitButton.textContent = signingUp ? "Create account" : "Sign in";
  passwordInput.autocomplete = signingUp ? "new-password" : "current-password";
  forgotButton.style.display = signingUp ? "none" : "block";
  clearStatus();
}
function showAccount(user) {
  authArea.classList.add("hidden");
  accountArea.classList.add("show");
  accountText.textContent = `Signed in as ${user.email || "your account"}.`;
}
function showAuthForm() {
  authArea.classList.remove("hidden");
  accountArea.classList.remove("show");
}

loginTab.addEventListener("click", () => setMode("login"));
signupTab.addEventListener("click", () => setMode("signup"));

if (!configured) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    showStatus("Authentication is not connected yet. Follow the Supabase setup steps in README.md, then add your project URL and anon/publishable key to supabase-config.js.", "error");
  });
  forgotButton.addEventListener("click", () => showStatus("First connect your Supabase project using the setup steps in README.md.", "error"));
  document.querySelector("#logoutButton").addEventListener("click", showAuthForm);
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearStatus();
    submitButton.disabled = true;
    submitButton.textContent = mode === "signup" ? "Creating account…" : "Signing in…";
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          showAccount(data.user);
        } else {
          showStatus("Account created. Check your email for the confirmation link, then return here to sign in.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showAccount(data.user);
      }
    } catch (error) {
      showStatus(error.message || "Something went wrong. Please try again.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = mode === "signup" ? "Create account" : "Sign in";
    }
  });

  forgotButton.addEventListener("click", async () => {
    clearStatus();
    const email = emailInput.value.trim();
    if (!email) {
      showStatus("Enter your email address above first.", "error");
      emailInput.focus();
      return;
    }
    try {
      const redirectTo = new URL("./auth.html", window.location.href).href;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      showStatus("If an account exists for that address, password-reset instructions will be sent. Check your inbox.");
    } catch (error) {
      showStatus(error.message || "Could not request a password reset.", "error");
    }
  });

  document.querySelector("#logoutButton").addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (error) showStatus(error.message, "error", accountStatus);
    else showAuthForm();
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) showAccount(session.user);
    else showAuthForm();
  });
}

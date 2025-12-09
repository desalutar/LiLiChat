let isLogin = true;

const form = document.getElementById("auth-form");
const title = document.getElementById("form-title");
const submitButton = document.getElementById("submit-button");
const toggleLink = document.getElementById("toggle-link");
const toggleText = document.getElementById("toggle-text");

function showMessage(text, type = "error") {
  const box = document.getElementById("message-box");
  box.style.display = "block";

  box.textContent = text;

  if (type === "error") {
    box.style.color = "#fff";
    box.style.background = "#d9534f";
  } else if (type === "success") {
    box.style.color = "#fff";
    box.style.background = "#5cb85c";
  }

  box.style.padding = "10px";
  box.style.borderRadius = "5px";
  box.style.marginTop = "10px";
}

toggleLink.addEventListener("click", (e) => {
  e.preventDefault();
  isLogin = !isLogin;
  if (isLogin) {
    title.textContent = "Login";
    submitButton.textContent = "Login";
    toggleText.firstChild.textContent = "Don't have an account? ";
    toggleLink.textContent = "Register";
  } else {
    title.textContent = "Register";
    submitButton.textContent = "Register";
    toggleText.firstChild.textContent = "Already have an account? ";
    toggleLink.textContent = "Login";
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = form.username.value.trim();
  const password = form.password.value.trim();

  if (!username || !password) {
    showMessage("Please fill in all fields");
    return;
  }

  const endpoint = isLogin ? "/api/1/auth/login" : "/api/1/auth/register";
  console.log("Sending request to:", endpoint);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    console.log("Response status:", res.status, res.statusText);

    if (res.ok) {
      const responseText = await res.text();
      console.log("Raw response text:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (err) {
        console.error("JSON parse error:", err, "Response was:", responseText);
        showMessage("Error: invalid server response format");
        return;
      }

      console.log("Parsed response data:", data);
      console.log("Has access_token?", !!data?.access_token);
      console.log("Has user_id?", !!data?.user_id);
      console.log("isLogin?", isLogin);

      if (isLogin) {
        if (data?.access_token) {
          // Save token and redirect to chat
          localStorage.setItem("accessToken", data.access_token);
          localStorage.setItem("userId", String(data.user_id));
          console.log("Token saved:", {
            accessToken: data.access_token ? "present" : "missing",
            userId: data.user_id,
          });
          console.log("About to redirect to /chat.html");

          // Try different redirect methods
          try {
            window.location.replace("/chat.html");
          } catch (e) {
            console.error("window.location.replace failed:", e);
            window.location.href = "/chat.html";
          }
        } else {
          console.error("Login response missing access_token:", data);
          showMessage("Error: server did not return access token");
        }
      } else if (!isLogin) {
        showMessage("Registration successful! You can now login.");
        // Switch form back to login
        isLogin = true;
        title.textContent = "Login";
        submitButton.textContent = "Login";
        toggleText.firstChild.textContent = "Don't have an account? ";
        toggleLink.textContent = "Register";
      } else {
        console.error("Unexpected response format:", data);
        showMessage("Unexpected server response format");
      }
    } else {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error("Error response:", errorText);
      showMessage("Error: " + errorText);
    }
  } catch (error) {
    console.error("Fetch error:", error);
    showMessage("Network error: " + error.message);
  }
});

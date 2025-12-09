// Get current user_id from localStorage
const currentUserId = localStorage.getItem("userId");
const accessToken = localStorage.getItem("accessToken");

// Check authorization
if (!currentUserId || !accessToken) {
  window.location.href = "/auth.html";
}

let selectedUserId = null;

const userList = document.getElementById("user-list");
const messagesDiv = document.getElementById("messages");
const chatHeader = document.getElementById("chat-header");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const dragbar = document.getElementById("dragbar");
const sidebar = document.getElementById("sidebar");
const chatContainer = document.querySelector(".chat-container");
const logoutBtn = document.getElementById("logout-btn");

let isDragging = false;
let ws = null; // WebSocket connection

// Load users list
function loadUsers() {
  if (!accessToken) {
    console.error("No access token available");
    return;
  }

  userList.innerHTML = "<li>Loading users...</li>";

  fetch("/api/1/users", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
  })
    .then((res) => {
      if (res.status === 401) {
        // Token invalid, redirect to login page
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userId");
        window.location.href = "/auth.html";
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load users: " + res.statusText);
      }
      return res.json();
    })
    .then((users) => {
      if (!users || !Array.isArray(users)) {
        console.error("Invalid users data:", users);
        userList.innerHTML = "<li>Error loading users</li>";
        return;
      }

      // Filter out current user from the list
      const currentUserIdNum = parseInt(currentUserId, 10);
      const otherUsers = users.filter((user) => user.id !== currentUserIdNum);

      if (otherUsers.length === 0) {
        userList.innerHTML = "<li>No other users</li>";
        return;
      }

      // Clear list and add users
      userList.innerHTML = "";
      otherUsers.forEach((user) => {
        const li = document.createElement("li");
        li.textContent = user.username;
        li.dataset.userid = user.id;
        userList.appendChild(li);
      });
    })
    .catch((error) => {
      console.error("Error loading users:", error);
      userList.innerHTML = "<li>Error loading users</li>";
    });
}

// Logout handler
logoutBtn.addEventListener("click", () => {
  closeWebSocket();
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userId");
  window.location.href = "/auth.html";
});

// Load users on page load
loadUsers();

// Close WebSocket connection
function closeWebSocket() {
  if (ws) {
    ws.close();
    ws = null;
    console.log("WebSocket connection closed");
  }
}

// Connect to WebSocket
function connectWebSocket() {
  // Close previous connection if exists
  closeWebSocket();

  if (!accessToken) {
    console.error("No access token available for WebSocket");
    return;
  }

  // Determine protocol (ws or wss)
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/api/1/ws`;

  console.log("Connecting to WebSocket:", wsUrl);

  // Create WebSocket connection with token in query parameter
  // (middleware supports token in query parameter)
  ws = new WebSocket(`${wsUrl}?token=${accessToken}`);

  ws.onopen = () => {
    console.log("WebSocket connection opened");
    // Load message history on connection
    loadMessages();
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("WebSocket message received:", data);

      if (data.type === "connected") {
        console.log("WebSocket connected, user_id:", data.user_id);
      } else if (data.type === "message") {
        // New message received
        const currentUserIdNum = parseInt(currentUserId, 10);
        const senderId =
          typeof data.sender_id === "number"
            ? data.sender_id
            : parseInt(data.sender_id, 10);
        const receiverId =
          typeof data.receiver_id === "number"
            ? data.receiver_id
            : parseInt(data.receiver_id, 10);
        const selectedUserIdNum = parseInt(selectedUserId, 10);

        console.log("Processing message:", {
          senderId,
          receiverId,
          currentUserIdNum,
          selectedUserIdNum,
          text: data.text,
        });

        // Check if message belongs to current chat
        // Message can be:
        // 1. From us to selected user (sender_id == our ID, receiver_id == selected)
        // 2. From selected user to us (sender_id == selected, receiver_id == our ID)
        if (
          (senderId === currentUserIdNum && receiverId === selectedUserIdNum) ||
          (senderId === selectedUserIdNum && receiverId === currentUserIdNum)
        ) {
          // Add message to chat
          const isSent = senderId === currentUserIdNum;
          console.log("Adding message to chat:", { text: data.text, isSent });
          addMessageToChat(data.text, isSent);
        } else {
          console.log("Message not for current chat, ignoring");
        }
      } else if (data.type === "error") {
        console.error("WebSocket error:", data.error);
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  ws.onclose = () => {
    console.log("WebSocket connection closed");
    ws = null;
  };
}

// User selection
userList.addEventListener("click", (e) => {
  if (e.target.tagName === "LI") {
    // Remove selection from previous selected element
    const prevSelected = userList.querySelector(".selected");
    if (prevSelected) {
      prevSelected.classList.remove("selected");
    }

    // Highlight current selected element
    e.target.classList.add("selected");

    selectedUserId = e.target.dataset.userid;
    chatHeader.textContent = "Chat with " + e.target.textContent;
    messagesDiv.innerHTML = "";
    messageForm.style.display = "flex";

    // Connect to WebSocket
    connectWebSocket();
  }
});

// Add message to chat
function addMessageToChat(text, isSent) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message");
  msgDiv.classList.add(isSent ? "sent" : "received");
  msgDiv.textContent = text;
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Send message via WebSocket
messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!selectedUserId) return;
  const content = messageInput.value.trim();
  if (!content) return;

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert("WebSocket connection not established. Please select a user again.");
    return;
  }

  // Send message via WebSocket
  const message = {
    receiver_id: parseInt(selectedUserId, 10),
    text: content,
  };

  try {
    ws.send(JSON.stringify(message));
    // Clear input field after sending
    messageInput.value = "";
    // Message will come from server via WebSocket and display automatically
  } catch (error) {
    console.error("Error sending message via WebSocket:", error);
    alert("Error sending message: " + error.message);
  }
});

// Load messages
function loadMessages() {
  if (!selectedUserId) return;

  fetch("/api/1/messages/" + selectedUserId, {
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
  })
    .then((res) => {
      if (res.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userId");
        window.location.href = "/auth.html";
        return;
      }
      if (res.status === 404) {
        // Endpoint doesn't exist, just skip history load
        console.log("Messages endpoint not found, skipping history load");
        return [];
      }
      if (!res.ok) {
        console.warn("Failed to load messages:", res.statusText);
        return [];
      }
      return res.json();
    })
    .then((data) => {
      if (!data || !Array.isArray(data)) {
        console.error("Invalid messages data:", data);
        return;
      }

      messagesDiv.innerHTML = "";
      if (data.length === 0) {
        const emptyMsg = document.createElement("div");
        emptyMsg.textContent = "No messages. Start a conversation!";
        emptyMsg.style.color = "#888";
        emptyMsg.style.textAlign = "center";
        emptyMsg.style.padding = "20px";
        messagesDiv.appendChild(emptyMsg);
        return;
      }

      const currentUserIdNum = parseInt(currentUserId, 10);
      data.forEach((msg) => {
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("message");
        const senderId =
          typeof msg.sender_id === "number"
            ? msg.sender_id
            : parseInt(msg.sender_id, 10);
        msgDiv.classList.add(
          senderId === currentUserIdNum ? "sent" : "received"
        );
        // Use text or content depending on what comes from server
        msgDiv.textContent = msg.text || msg.content || "";
        messagesDiv.appendChild(msgDiv);
      });
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    })
    .catch((error) => {
      console.error("Error loading messages:", error);
    });
}

// Auto-update messages no longer needed - using WebSocket

// Sidebar width adjustment
dragbar.addEventListener("mousedown", () => {
  isDragging = true;
  document.body.style.cursor = "ew-resize";
});

document.addEventListener("mouseup", () => {
  if (isDragging) {
    isDragging = false;
    document.body.style.cursor = "default";
  }
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  let containerOffsetLeft = chatContainer.getBoundingClientRect().left;
  let pointerRelativeXpos = e.clientX - containerOffsetLeft;

  const minWidth = 150;
  const maxWidth = 500;

  if (pointerRelativeXpos < minWidth) pointerRelativeXpos = minWidth;
  if (pointerRelativeXpos > maxWidth) pointerRelativeXpos = maxWidth;

  sidebar.style.width = pointerRelativeXpos + "px";
});

// Close WebSocket on page unload
window.addEventListener("beforeunload", () => {
  closeWebSocket();
});

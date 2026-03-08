let token = "";
let socket;
let isBlocked = false;

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.innerText = message;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 2000);
}

function disableAllCheckboxes() {
  document.querySelectorAll("#grid input").forEach(cb => {
    cb.disabled = true;
  });
}

function enableAllCheckboxes() {
  document.querySelectorAll("#grid input").forEach(cb => {
    cb.disabled = false;
  });
}

async function login() {
  const username = document.getElementById("username").value;

  const res = await fetch("https://checkbox-app-qioc.onrender.com/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  });

  const data = await res.json();
  token = data.token;

  document.getElementById("userBadge").innerText =
    `Connected as ${username}`;

  init();
}

async function init() {
  document.getElementById("login").style.display = "none";
  document.getElementById("loading").style.display = "block";

  const res = await fetch("https://checkbox-app-qioc.onrender.com/state");
  const state = await res.json();

  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  const fragment = document.createDocumentFragment();

  state.forEach((val, i) => {
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = val === 1;

    cb.addEventListener("click", () => {
      if (isBlocked) {
        showToast("Wait 5 seconds...");
        return;
      }

      socket.send(JSON.stringify({
        type: "TOGGLE",
        index: i
      }));
    });

    fragment.appendChild(cb);
  });

  grid.appendChild(fragment);

socket = new WebSocket(`wss://checkbox-app-qioc.onrender.com?token=${token}`);


socket.onopen = () => {
  console.log("WebSocket connected");
};

socket.onerror = (err) => {
  console.error("WebSocket error", err);
};

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "RATE_LIMIT") {
      if (!isBlocked) {
        isBlocked = true;

        showToast("Too many clicks! Wait 5 seconds");

     
        disableAllCheckboxes();

        setTimeout(() => {
          isBlocked = false;
          enableAllCheckboxes(); 
          showToast("You can click again");
        }, 5000);
      }
      return;
    }

    const { index, value } = data;

    const checkboxes = document.querySelectorAll("#grid input");
    if (checkboxes[index]) {
      checkboxes[index].checked = value === 1;
    }
  };

  document.getElementById("loading").style.display = "none";
}
const profileLayout = document.getElementById("profileLayout");
const profileForm = document.getElementById("profileForm");
const avatarInput = document.getElementById("avatarInput");
const avatarPreview = document.getElementById("avatarPreview");
const passwordInput = document.getElementById("passwordInput");
const passwordHint = document.getElementById("profilePasswordHint");
const logoutButton = document.getElementById("logoutButton");

let profileAvatarData = "";

const hasSymbol = (value) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(value);

const isPasswordValid = (value) => {
  if (!value) return true;
  return value.length >= 3 && value.length <= 15 && hasSymbol(value);
};

const safeText = (value) => String(value || "").replace(/[<>&"]/g, (char) => ({
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
}[char]));

const setPanel = (panelId) => {
  document.querySelectorAll(".profile-panel-section").forEach((panel) => {
    panel.classList.toggle("active", panel.id === panelId);
  });
  document.querySelectorAll(".profile-nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.panelTarget === panelId);
  });
};

const renderAvatar = (user) => {
  const initials = (user.name || user.email || "U").trim().charAt(0).toUpperCase();
  const avatarMarkup = user.avatar
    ? `<img src="${user.avatar}" alt="${safeText(user.name || "User")} profile image" />`
    : initials;

  document.getElementById("profileAvatar").innerHTML = avatarMarkup;
  avatarPreview.src = user.avatar || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='48' fill='%23eab308'/%3E%3Ctext x='50%25' y='56%25' text-anchor='middle' font-family='Arial' font-size='38' font-weight='700' fill='white'%3E${encodeURIComponent(initials)}%3C/text%3E%3C/svg%3E`;
};

const renderProfile = (user) => {
  document.getElementById("profileName").textContent = user.name || "User";
  document.getElementById("profileEmail").textContent = user.email || "";
  document.getElementById("profilePhone").textContent = user.phone || "No phone number added";
  document.getElementById("nameInput").value = user.name || "";
  document.getElementById("phoneInput").value = user.phone || "";
  document.getElementById("addressInput").value = user.address || "";
  document.getElementById("savedAddressText").textContent = user.address || "No address saved yet.";
  profileAvatarData = user.avatar || "";
  renderAvatar(user);
};

const redirectToLogin = (message) => {
  clearUser();
  toast(message);
  window.setTimeout(() => {
    window.location.href = "login.html";
  }, 900);
};

const loadProfile = async () => {
  const currentUser = getUser();
  if (!currentUser?.token) {
    redirectToLogin("Please sign in to view your profile");
    return;
  }

  try {
    const freshProfile = await request("/auth/profile", {
      headers: authHeaders(),
    });
    const userWithToken = { ...freshProfile, token: currentUser.token };
    setUser(userWithToken);
    renderProfile(userWithToken);
  } catch (error) {
    redirectToLogin(error.message || "Session expired. Please sign in again");
  }
};

document.querySelectorAll("[data-panel-target]").forEach((trigger) => {
  trigger.addEventListener("click", () => setPanel(trigger.dataset.panelTarget));
});

if (avatarInput) {
  avatarInput.addEventListener("change", () => {
    const file = avatarInput.files && avatarInput.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("Please upload an image file");
      avatarInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      profileAvatarData = reader.result;
      avatarPreview.src = profileAvatarData;
      renderAvatar({ ...getUser(), avatar: profileAvatarData });
    };
    reader.readAsDataURL(file);
  });
}

if (passwordInput) {
  passwordInput.addEventListener("input", () => {
    const valid = isPasswordValid(passwordInput.value);
    passwordHint.classList.toggle("valid", valid && passwordInput.value.length > 0);
    passwordHint.classList.toggle("invalid", !valid);
  });
}

if (profileForm) {
  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!isPasswordValid(passwordInput.value)) {
      toast("Password must be 3-15 characters and include a symbol");
      return;
    }

    const payload = {
      name: document.getElementById("nameInput").value.trim(),
      phone: document.getElementById("phoneInput").value.trim(),
      address: document.getElementById("addressInput").value.trim(),
      avatar: profileAvatarData,
    };

    if (passwordInput.value) {
      payload.password = passwordInput.value;
    }

    try {
      const updatedUser = await request("/auth/profile", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      setUser(updatedUser);
      renderProfile(updatedUser);
      passwordInput.value = "";
      passwordHint.className = "password-requirement-hint";
      toast("Profile updated");
      setPanel("overviewPanel");
    } catch (error) {
      toast(error.message);
    }
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    clearUser();
    toast("Logged out");
    window.setTimeout(() => {
      window.location.href = "login.html";
    }, 700);
  });
}

loadProfile();

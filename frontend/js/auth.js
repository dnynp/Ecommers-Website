const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const formData = (form) => Object.fromEntries(new FormData(form).entries());

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const user = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify(formData(loginForm)),
      });
      setUser(user);
      toast("Login successful");
      window.setTimeout(() => {
        window.location.href = "index.html";
      }, 700);
    } catch (error) {
      toast(error.message);
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const user = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify(formData(registerForm)),
      });
      setUser(user);
      toast("Account created");
      window.setTimeout(() => {
        window.location.href = "index.html";
      }, 700);
    } catch (error) {
      toast(error.message);
    }
  });
}

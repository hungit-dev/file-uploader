const html = document.querySelector("html");
const themeToggler = document.querySelector("i");

function setTheme() {
  const theme = localStorage.getItem("theme");
  if (theme === "dark") {
    themeToggler.classList.remove("bi-sun");
    themeToggler.classList.add("bi-moon");
  } else {
    themeToggler.classList.remove("bi-moon");
    themeToggler.classList.add("bi-sun");
  }
  html.setAttribute("data-bs-theme", theme);
}

let theme = localStorage.getItem("theme");
if (!theme) {
  //set light theme as default theme
  theme = "light";
  localStorage.setItem("theme", theme);
}
setTheme();

themeToggler.addEventListener("click", () => {
  theme = localStorage.getItem("theme") === "light" ? "dark" : "light";
  localStorage.setItem("theme", theme);
  setTheme(theme);
});

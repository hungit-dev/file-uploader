//Save theme in localStorage
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

//Set action attribute in editForm dynamically for editing Folder name
document.querySelectorAll(".rename-folder-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const folderId = button.dataset.folderId;
    const folderName = button.dataset.folderName;
    const form = document.getElementById("editFolderForm");
    const input = document.getElementById("editFolderInput");
    form.action = `/dashboard/folders/${folderId}/edit-folder`;
    // Prefill folder name
    input.value = folderName;
  });
});

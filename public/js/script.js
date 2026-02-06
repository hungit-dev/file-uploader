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

//Convert file size in bytes to MB or KB
function formatFileSize(bytes) {
  const size = Number(bytes);

  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 ** 2) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else {
    return `${(size / 1024 ** 2).toFixed(2)} MB`;
  }
}
//dynamic render file info in file-info modal
document.querySelectorAll(".item").forEach((item) => {
  item.addEventListener("click", () => {
    const name = item.dataset.name;
    const fileType = item.dataset.filetype;
    const size = item.dataset.size;
    const createdAt = new Date(item.dataset.createdat).toLocaleString();
    const url = item.dataset.url;
    const fileId = item.dataset.fileid;

    //render values into the modal
    document.querySelector(".file-name").textContent = name;
    document.querySelector(".file-url").href = url;
    document.querySelector(".file-size").textContent = formatFileSize(size);
    document.querySelector(".file-type").textContent = fileType;
    document.querySelector(".file-date-create").textContent = createdAt;

    //Handle delete file request
    document
      .querySelector("span.delete-file-btn")
      .addEventListener("click", async () => {
        try {
          const res = await fetch(`/dashboard/files/${fileId}`, {
            method: "DELETE",
          });
          if (res.ok) {
            window.location.reload();
          } else {
            console.error("Failed to delete file");
          }
        } catch (err) {
          console.log(err);
        }
      });
    //Direct to download file endpoint when clicking download btn
    document
      .querySelector("span.download-file-btn")
      .addEventListener("click", () => {
        window.location.href = `/dashboard/files/${fileId}/download`;
      });
  });
});

//Handle delete folder request
 document.querySelectorAll(".delete-folder-btn").forEach(button => {
    button.addEventListener("click", async (e) => {
      e.stopPropagation();
      const folderId = button.dataset.folderId;
      try {
        const res = await fetch(`/dashboard/folders/${folderId}/delete`, {
          method: "DELETE",
        });
        if (res.ok) {
          window.location.reload();
        } else {
          console.error("Failed to delete folder");
        }
      } catch (err) {
        console.log(err);
      }
    });
  });


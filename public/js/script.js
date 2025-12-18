const html=document.querySelector("html")
const themeToggler=document.querySelector("i");
themeToggler.addEventListener("click",()=>{
    if(themeToggler.classList.contains("bi-sun")){
        themeToggler.classList.remove("bi-sun");
        themeToggler.classList.add("bi-moon");
        html.setAttribute("data-bs-theme","dark")
    }else{
         themeToggler.classList.add("bi-sun");
        themeToggler.classList.remove("bi-moon")
        html.setAttribute("data-bs-theme","light")
    }
})
// var password = document.getElementById("password");
// var confirm_password = document.getElementById("confirm-password");
// const togglePasswordButton = document.getElementById("toggle-password");

// function validatePassword() {
//     if (password.value != confirm_password.value) {
//         confirm_password.setCustomValidity("Passwords do not match");
//         } 
//     else {
//         confirm_password.setCustomValidity("");
//         }
// }
  
// password.onchange = validatePassword;
// confirm_password.onkeyup = validatePassword;
    
// togglePasswordButton.addEventListener("click", function() {
//     if (password.type === "password") {
//         password.type = "text";
//         confirm_password.type = "text";
//         togglePasswordButton.textContent = "Hide password";
//     } 
//     else {
//         password.type = "password";
//         confirm_password.type = "password";
//         togglePasswordButton.textContent = "Show password";
//       }
// });

const passwordInput = document.querySelector("#password")
const eye = document.querySelector("#eye")

eye.addEventListener("click", function(){
    this.classList.toggle("fa-eye-slash")
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password"
    passwordInput.setAttribute("type", type)
  })
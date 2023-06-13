var password = document.getElementById("password");
var confirm_password = document.getElementById("confirm-password");
const togglePasswordButton = document.getElementById("toggle-password");

const togglePasswordButton2= document.getElementById("toggle-password-2");

function validatePassword() {
    if (password.value != confirm_password.value) {
        confirm_password.setCustomValidity("Passwords do not match");
        } 
    else {
        confirm_password.setCustomValidity("");
        }
}


password.onchange = validatePassword;
confirm_password.onkeyup = validatePassword;
    
togglePasswordButton.addEventListener("click", function() {
  this.classList.toggle("fa-eye-slash")
    if (password.type === "password") {
        password.type = "text";
        confirm_password.type = "text";
        togglePasswordButton.textContent = "";
    } 
    else {
        password.type = "password";
        confirm_password.type = "password";
        togglePasswordButton.textContent = "";
      }
});

password.onchange = validatePassword;
confirm_password.onkeyup = validatePassword;
    
togglePasswordButton2.addEventListener("click", function() {
  this.classList.toggle("fa-eye-slash")
    if (password.type === "password") {
        password.type = "text";
        confirm_password.type = "text";
        togglePasswordButton2.textContent = "";
    } 
    else {
        password.type = "password";
        confirm_password.type = "password";
        togglePasswordButton2.textContent = "";
      }
});



const togglePassword = document.querySelector('#togglePassword');
const password = document.querySelector('#pas');

togglePassword.addEventListener('click', function () {
  // Switch between password and text
  const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
  password.setAttribute('type', type);
  
  // Toggle the icon
  this.classList.toggle('zmdi-eye');
  this.classList.toggle('zmdi-eye-off');
});

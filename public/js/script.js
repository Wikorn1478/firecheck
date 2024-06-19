const formOpenBtn = document.querySelector("#form-open");
const home = document.querySelector(".home");
const formContainer = document.querySelector(".form_container");
const formCloseBtns = document.querySelectorAll(".form_close"); // ปรับเป็น querySelectorAll เพื่อรองรับหลายปุ่มปิดฟอร์ม
const forgetPasswordLink = document.getElementById('forget_password_link');
const forgetPasswordForm = document.querySelector('.forget_password_form');
const loginForm = document.querySelector('.login_form');
const backToLoginBtnForgetPassword = document.querySelector(".forget_password_form .back");

// Function to toggle visibility of password input
function togglePasswordVisibility(inputId, iconElement) {
  const passwordInput = document.getElementById(inputId);
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    iconElement.classList.remove("uil-eye-slash");
    iconElement.classList.add("uil-eye");
  } else {
    passwordInput.type = "password";
    iconElement.classList.remove("uil-eye");
    iconElement.classList.add("uil-eye-slash");
  }
}

// Function to toggle between login form and forget password form
function toggleLoginForm() {
  loginForm.classList.toggle('show');
  forgetPasswordForm.classList.toggle('show');
}

// Event listener for opening form
formOpenBtn.addEventListener("click", function () {
  formContainer.classList.add("show");
  home.classList.add("show");
  loginForm.classList.add('show');
});

// Event listener for closing form
formCloseBtns.forEach(button => {
  button.addEventListener("click", function () {
    formContainer.classList.remove("show");
    home.classList.remove("show");
  });
});

// Event listener for showing forget password form
forgetPasswordLink.addEventListener('click', () => {
  formContainer.classList.add("show");
  home.classList.add("show");
  document.querySelectorAll('.form').forEach(form => form.style.display = 'none');
  forgetPasswordForm.style.display = 'block';
});

// Event listener for back button in forget password form
backToLoginBtnForgetPassword.addEventListener('click', () => {
  toggleLoginForm();
});

// เรียกดูปุ่มจำลองการเผา
const fireButton = document.getElementById('fire-button');

// เรียกดูฟอร์มเมื่อปุ่มถูกคลิก
fireButton.addEventListener('click', () => {
    // เรียกดูฟอร์มโดยใช้ ID
    const formOpen = document.getElementById('form-open');
    // เปิดฟอร์ม
    formOpen.style.display = 'block';
});

// ฟังก์ชันเพื่อแสดงแผนที่
function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 13.7563, lng: 100.5018}, // ตำแหน่งเริ่มต้น
    zoom: 8 // ขนาดการซูม
  });

  // เพิ่มตัวเลือกการคลิกที่แผนที่
  map.addListener('click', function(e) {
    latitudeInput.value = e.latLng.lat(); // ตั้งค่าละติจูดใน input
    longitudeInput.value = e.latLng.lng(); // ตั้งค่าลองจิจูดใน input
  });
}

// ตรวจสอบการเข้าสู่ระบบและแสดงชื่อผู้ใช้
document.addEventListener('DOMContentLoaded', () => {
  const formOpenButton = document.getElementById('form-open');
  const usernameDisplay = document.getElementById('username-display');

  // ตรวจสอบว่ามีการเข้าสู่ระบบหรือไม่
  const isLoggedIn = JSON.parse('<?php echo json_encode($is_logged_in); ?>');
  const username = JSON.parse('<?php echo json_encode($username); ?>');

  if (isLoggedIn) {
    formOpenButton.style.display = 'none';
    usernameDisplay.textContent = `ยินดีต้อนรับ, ${username}`;
    usernameDisplay.style.display = 'block';
  } else {
    formOpenButton.style.display = 'block';
    usernameDisplay.style.display = 'none';
  }
});


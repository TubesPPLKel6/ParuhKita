import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# 3 Akun valid sesuai hasil database seeder ParuhKita
test_accounts = [
    {"role": "Mahasiswa", "email": "mahasiswa@paruhkita.test", "password": "password123"},
    {"role": "Merchant", "email": "merchant@paruhkita.test", "password": "password123"},
    {"role": "Admin", "email": "admin@paruhkita.test", "password": "password123"},
]

driver = webdriver.Edge()
driver.maximize_window()

try:
    for akun in test_accounts:
        print(f"=== Menguji Login Role: {akun['role']} ({akun['email']}) ===")
        
        # Bersihkan sesi/token login sebelumnya agar bisa masuk ke halaman login lagi
        driver.delete_all_cookies()
        driver.get("http://localhost:5173/login")
        driver.execute_script("window.localStorage.clear(); window.sessionStorage.clear();")
        driver.refresh()
        time.sleep(1.5)

        # Cari kolom email dan password
        email_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email'], input[name='email']"))
        )
        password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")

        # Isi email dan password
        email_input.clear()
        email_input.send_keys(akun["email"])
        
        password_input.clear()
        password_input.send_keys(akun["password"])
        time.sleep(1)

        # Klik tombol Submit / Login
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_btn.click()

        # Tunggu proses redirect setelah login berhasil
        time.sleep(3)
        print(f"Hasil URL setelah login ({akun['role']}): {driver.current_url}\n")

    print("SELURUH TEST CASE LOGIN (3 AKUN) SELESAI DIJALANKAN!")

finally:
    time.sleep(2)
    driver.quit()

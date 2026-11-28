import os
import time

from selenium import webdriver
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

BASE_URL = os.getenv("PARUHKITA_BASE_URL", "http://localhost:5173").rstrip("/")

MERCHANT_ACCOUNT = {"email": "merchant@paruhkita.test", "password": "password123"}
MAHASISWA_ACCOUNT = {"email": "mahasiswa@paruhkita.test", "password": "password123"}
ADMIN_ACCOUNT = {"email": "admin@paruhkita.test", "password": "password123"}

STUDENT_LOG_PATH = "/log-aktivitas"
MERCHANT_LOG_PATH = "/merchant/log-aktivitas"
ADMIN_LOG_PATH = "/admin/log-aktivitas"

DEFAULT_TIMEOUT = 45
CURRENT_ROLE = None


def create_driver():
    driver = webdriver.Edge()
    driver.maximize_window()
    return driver


def body_text(driver):
    try:
        return driver.execute_script("return document.body ? document.body.innerText : ''") or ""
    except WebDriverException:
        return ""


def current_path(driver):
    try:
        return driver.execute_script("return window.location.pathname") or ""
    except WebDriverException:
        return ""


def wait_body_contains(driver, needle, timeout=DEFAULT_TIMEOUT):
    needle = needle.lower()
    return WebDriverWait(driver, timeout).until(lambda d: needle in body_text(d).lower())


def wait_body_not_contains(driver, needle, timeout=DEFAULT_TIMEOUT):
    needle = needle.lower()
    return WebDriverWait(driver, timeout).until(lambda d: needle not in body_text(d).lower())


def wait_app_ready(driver, timeout=30):
    return wait_body_not_contains(driver, "memuat data...", timeout)


def spa_go(driver, path):
    driver.execute_script(
        "window.history.pushState({}, '', arguments[0]);"
        "window.dispatchEvent(new PopStateEvent('popstate'));",
        path,
    )


def spa_open(driver, path, timeout=DEFAULT_TIMEOUT):
    if current_path(driver) == path:
        return

    spa_go(driver, path)
    WebDriverWait(driver, timeout).until(lambda d: current_path(d) == path)


def wait_for_login_form(driver, timeout=DEFAULT_TIMEOUT):
    return WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='email'], input[name='email']"))
    )


def clear_session(driver):
    global CURRENT_ROLE
    CURRENT_ROLE = None
    driver.delete_all_cookies()
    driver.get(f"{BASE_URL}/login")
    try:
        driver.execute_script("window.localStorage.clear(); window.sessionStorage.clear();")
    except WebDriverException:
        pass
    driver.get(f"{BASE_URL}/login")
    wait_for_login_form(driver)


def login(driver, email, password, role_key=None):
    global CURRENT_ROLE
    if role_key and CURRENT_ROLE == role_key and "/login" not in driver.current_url:
        return

    clear_session(driver)

    email_input = wait_for_login_form(driver)
    password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")

    email_input.clear()
    email_input.send_keys(email)
    password_input.clear()
    password_input.send_keys(password)

    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
    ).click()

    try:
        WebDriverWait(driver, 30).until(lambda d: "/login" not in d.current_url)
        wait_app_ready(driver, 45)
    except TimeoutException as exc:
        error_boxes = driver.find_elements(By.CSS_SELECTOR, "div[role='alert'], div.bg-rose-50")
        err_text = (
            error_boxes[0].text.strip()
            if error_boxes
            else "Tidak ada pesan error terlihat; cek apakah frontend/backend berjalan."
        )
        raise AssertionError(f"Login gagal untuk {email} (tetap di {driver.current_url}): {err_text}") from exc

    if "/login" in driver.current_url:
        raise AssertionError("Sesi ditolak server (401) dan diarahkan kembali ke /login. Cek backend/database.")

    CURRENT_ROLE = role_key


def wait_log_table_loaded(driver, timeout=30):
    try:
        WebDriverWait(driver, timeout).until(
            lambda d: len(d.find_elements(By.CSS_SELECTOR, "div.animate-spin")) == 0
            and (
                "belum ada" in body_text(d).lower()
                or len(d.find_elements(By.CSS_SELECTOR, "div.rounded-xl span.rounded-full")) > 0
            )
        )
    except TimeoutException as exc:
        preview = body_text(driver)[:400].strip()
        raise AssertionError(
            f"Tabel Log Aktivitas tidak selesai dimuat dalam {timeout}s.\n"
            f"URL: {driver.current_url}\nIsi halaman:\n{preview}"
        ) from exc


def tc_log_001_mahasiswa_view_and_nav(driver):
    """TC.LOG.001 - Mahasiswa dapat mengakses halaman Log Aktivitas Saya melalui navigasi."""
    login(driver, MAHASISWA_ACCOUNT["email"], MAHASISWA_ACCOUNT["password"], role_key="mahasiswa")

    nav_link = WebDriverWait(driver, 15).until(
        EC.element_to_be_clickable((By.XPATH, "//a[@href='/log-aktivitas' and contains(normalize-space(.), 'Log Aktivitas')]"))
    )
    nav_link.click()

    WebDriverWait(driver, 15).until(lambda d: current_path(d) == STUDENT_LOG_PATH)
    wait_body_contains(driver, "log aktivitas saya", 15)
    wait_body_contains(driver, "waktu", 15)
    wait_body_contains(driver, "jenis aktivitas", 15)
    wait_body_contains(driver, "keterangan aktivitas", 15)
    wait_log_table_loaded(driver)
    print("PASS TC.LOG.001")


def tc_log_002_merchant_view_and_nav(driver):
    """TC.LOG.002 - Merchant dapat mengakses halaman Log Aktivitas Saya melalui sidebar."""
    login(driver, MERCHANT_ACCOUNT["email"], MERCHANT_ACCOUNT["password"], role_key="merchant")

    sidebar_btn = WebDriverWait(driver, 15).until(
        EC.element_to_be_clickable((By.XPATH, "//aside//button[contains(normalize-space(.), 'Log Aktivitas')]"))
    )
    sidebar_btn.click()

    WebDriverWait(driver, 15).until(lambda d: current_path(d) == MERCHANT_LOG_PATH)
    wait_body_contains(driver, "log aktivitas saya", 15)
    wait_body_contains(driver, "waktu", 15)
    wait_body_contains(driver, "jenis aktivitas", 15)
    wait_body_contains(driver, "keterangan aktivitas", 15)
    wait_log_table_loaded(driver)
    print("PASS TC.LOG.002")


def tc_log_003_admin_view_and_nav(driver):
    """TC.LOG.003 - Admin dapat mengakses halaman Log Aktivitas Admin melalui sidebar."""
    login(driver, ADMIN_ACCOUNT["email"], ADMIN_ACCOUNT["password"], role_key="admin")

    sidebar_link = WebDriverWait(driver, 15).until(
        EC.element_to_be_clickable((By.XPATH, "//aside//a[@href='/admin/log-aktivitas' and contains(normalize-space(.), 'Log Aktivitas')]"))
    )
    sidebar_link.click()

    WebDriverWait(driver, 15).until(lambda d: current_path(d) == ADMIN_LOG_PATH)
    wait_body_contains(driver, "log aktivitas admin", 15)
    wait_body_contains(driver, "waktu", 15)
    wait_body_contains(driver, "jenis aktivitas", 15)
    wait_body_contains(driver, "keterangan aktivitas", 15)
    wait_log_table_loaded(driver)
    print("PASS TC.LOG.003")


def tc_log_004_filter_search_type_and_date(driver):
    """TC.LOG.004 - Filter pencarian, jenis aktivitas (Create/Update/Delete), dan rentang tanggal berfungsi."""
    login(driver, ADMIN_ACCOUNT["email"], ADMIN_ACCOUNT["password"], role_key="admin")
    spa_open(driver, ADMIN_LOG_PATH)
    wait_log_table_loaded(driver)

    # Filter Jenis Aktivitas = Create
    select_el = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "select"))
    )
    Select(select_el).select_by_value("create")
    wait_log_table_loaded(driver)

    # Filter Pencarian
    search_input = driver.find_element(By.CSS_SELECTOR, "input[placeholder*='Cari']")
    search_input.clear()
    search_input.send_keys("kampus")
    wait_log_table_loaded(driver)

    # Buka popover Filter Tanggal
    date_btn = driver.find_element(By.XPATH, "//button[contains(normalize-space(.), 'Pilih rentang tanggal')]")
    date_btn.click()
    WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.XPATH, "//button[contains(normalize-space(.), 'Terapkan')]"))
    )
    driver.find_element(By.XPATH, "//button[contains(normalize-space(.), 'Terapkan')]").click()

    # Reset filter
    Select(select_el).select_by_value("")
    search_input.clear()
    wait_log_table_loaded(driver)
    print("PASS TC.LOG.004")


def tc_log_005_auto_record_from_crud_action(driver):
    """TC.LOG.005 - Aksi CRUD (misal update profil mahasiswa) otomatis tercatat di Log Aktivitas Saya."""
    login(driver, MAHASISWA_ACCOUNT["email"], MAHASISWA_ACCOUNT["password"], role_key="mahasiswa")
    spa_open(driver, "/profil")
    wait_app_ready(driver, 30)
    wait_body_not_contains(driver, "memuat data profil...", 30)

    save_btn = WebDriverWait(driver, 30).until(
        EC.presence_of_element_located((By.XPATH, "//button[contains(normalize-space(.), 'Simpan Semua Data Profil')]"))
    )
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", save_btn)
    WebDriverWait(driver, 15).until(EC.element_to_be_clickable(save_btn)).click()
    wait_body_contains(driver, "berhasil disimpan", 20)

    spa_open(driver, STUDENT_LOG_PATH)
    wait_log_table_loaded(driver)
    wait_body_contains(driver, "memperbarui profil dan informasi pendidikan", 20)
    wait_body_contains(driver, "update", 20)
    print("PASS TC.LOG.005")


def tc_log_006_role_isolation(driver):
    """TC.LOG.006 - Mahasiswa tidak dapat mengakses halaman Log Aktivitas Merchant maupun Admin."""
    login(driver, MAHASISWA_ACCOUNT["email"], MAHASISWA_ACCOUNT["password"], role_key="mahasiswa")

    spa_go(driver, MERCHANT_LOG_PATH)
    WebDriverWait(driver, 15).until(lambda d: current_path(d) != MERCHANT_LOG_PATH)

    spa_go(driver, ADMIN_LOG_PATH)
    WebDriverWait(driver, 15).until(lambda d: current_path(d) != ADMIN_LOG_PATH)
    print("PASS TC.LOG.006")


def main():
    driver = create_driver()
    try:
        tc_log_001_mahasiswa_view_and_nav(driver)
        tc_log_002_merchant_view_and_nav(driver)
        tc_log_003_admin_view_and_nav(driver)
        tc_log_004_filter_search_type_and_date(driver)
        tc_log_005_auto_record_from_crud_action(driver)
        tc_log_006_role_isolation(driver)
        print("\nSELURUH TEST CASE LOG AKTIVITAS SELESAI DIJALANKAN!")
    finally:
        time.sleep(1)
        driver.quit()


if __name__ == "__main__":
    main()

import os
import time

from selenium import webdriver
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

BASE_URL = os.getenv("PARUHKITA_BASE_URL", "http://localhost:5173").rstrip("/")

MERCHANT_ACCOUNT = {"email": "merchant@paruhkita.test", "password": "password123"}
MAHASISWA_ACCOUNT = {"email": "mahasiswa@paruhkita.test", "password": "password123"}
ADMIN_ACCOUNT = {"email": "admin@paruhkita.test", "password": "password123"}

TEMPLATES_PATH = "/merchant/messages/templates"
MESSAGES_PATH = "/merchant/messages"

RUN_ID = str(int(time.time()))
NEW_TEMPLATE_TITLE = f"Undangan Wawancara Selenium {RUN_ID}"
UPDATED_TEMPLATE_TITLE = f"{NEW_TEMPLATE_TITLE} (Updated)"
CHAT_TEMPLATE_TITLE = f"Undangan Chat Test {RUN_ID}"
CHAT_TEMPLATE_BODY = "Halo {nama_pelamar}, terima kasih sudah melamar posisi {posisi_lowongan}."

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


def open_template_page(driver):
    spa_open(driver, TEMPLATES_PATH)
    wait_app_ready(driver, 30)

    try:
        wait_body_contains(driver, "templat balasan cepat", 20)
        wait_body_contains(driver, "daftar templat", 20)
        wait_body_not_contains(driver, "memuat daftar templat...", 20)
    except TimeoutException as exc:
        preview = body_text(driver)[:400].strip()
        raise AssertionError(
            "Gagal membuka halaman templat (stuck loading atau error API).\n"
            f"Target URL : {TEMPLATES_PATH}\n"
            f"URL saat ini: {driver.current_url}\n"
            f"Cuplikan isi halaman:\n{preview}\n"
            "Pastikan server backend (API auth & templates) berjalan normal dan tidak menggantung."
        ) from exc


def open_add_template_modal(driver):
    WebDriverWait(driver, 15).until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(normalize-space(.), 'Tambah Templat')]"))
    ).click()
    WebDriverWait(driver, 10).until(EC.visibility_of_element_located((By.ID, "tpl-title")))


def fill_template_form(driver, title, category, text):
    title_input = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.ID, "tpl-title"))
    )
    title_input.clear()
    title_input.send_keys(title)

    category_select = Select(driver.find_element(By.ID, "tpl-category"))
    try:
        category_select.select_by_value(category)
    except WebDriverException:
        category_select.select_by_visible_text(category)

    body_input = driver.find_element(By.ID, "tpl-body")
    body_input.clear()
    body_input.send_keys(text)


def submit_template_form(driver):
    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//div[@role='dialog']//button[@type='submit']"))
    ).click()


def create_template_via_ui(driver, title, category, text):
    open_add_template_modal(driver)
    fill_template_form(driver, title, category, text)
    submit_template_form(driver)

    wait_body_contains(driver, title, 20)
    wait_body_not_contains(driver, "memuat daftar templat...", 15)


def tc_tmp_001_list_templates(driver):
    print("Running TC.TMP.001: Merchant melihat daftar templat balasan cepat")
    login(driver, MERCHANT_ACCOUNT["email"], MERCHANT_ACCOUNT["password"], role_key="merchant")
    open_template_page(driver)

    text = body_text(driver).lower()
    assert "templat balasan cepat" in text, f"Judul halaman templat tidak ditemukan di {driver.current_url}"
    assert "daftar templat" in text, f"Header daftar templat tidak ditemukan di {driver.current_url}"
    print("PASS TC.TMP.001")


def tc_tmp_002_create_template(driver):
    print("Running TC.TMP.002: Merchant menambah templat balasan cepat baru")
    login(driver, MERCHANT_ACCOUNT["email"], MERCHANT_ACCOUNT["password"], role_key="merchant")
    open_template_page(driver)

    create_template_via_ui(
        driver,
        title=NEW_TEMPLATE_TITLE,
        category="Undangan Wawancara",
        text="Halo {nama_pelamar}, posisi {posisi_lowongan} di {nama_usaha}.",
    )

    wait_body_contains(driver, NEW_TEMPLATE_TITLE, 15)
    print("PASS TC.TMP.002")


def tc_tmp_003_update_template(driver):
    print("Running TC.TMP.003: Merchant mengubah templat balasan cepat")
    login(driver, MERCHANT_ACCOUNT["email"], MERCHANT_ACCOUNT["password"], role_key="merchant")
    open_template_page(driver)

    edit_btn = WebDriverWait(driver, 15).until(
        EC.element_to_be_clickable(
            (
                By.XPATH,
                f"//tr[contains(normalize-space(.), '{NEW_TEMPLATE_TITLE}')]"
                "//button[@title='Ubah templat']",
            )
        )
    )
    edit_btn.click()

    title_input = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.ID, "tpl-title"))
    )
    WebDriverWait(driver, 10).until(
        lambda d: (title_input.get_attribute("value") or "") == NEW_TEMPLATE_TITLE
    )

    title_input.send_keys(Keys.CONTROL, "a")
    title_input.send_keys(Keys.BACKSPACE)
    title_input.clear()
    title_input.send_keys(UPDATED_TEMPLATE_TITLE)

    submit_template_form(driver)

    wait_body_contains(driver, UPDATED_TEMPLATE_TITLE, 20)
    wait_body_not_contains(driver, "memuat daftar templat...", 15)
    print("PASS TC.TMP.003")


def tc_tmp_004_delete_template(driver):
    print("Running TC.TMP.004: Merchant menghapus templat balasan cepat")
    login(driver, MERCHANT_ACCOUNT["email"], MERCHANT_ACCOUNT["password"], role_key="merchant")
    open_template_page(driver)

    delete_btn = WebDriverWait(driver, 15).until(
        EC.element_to_be_clickable(
            (
                By.XPATH,
                f"//tr[contains(normalize-space(.), '{UPDATED_TEMPLATE_TITLE}')]"
                "//button[@title='Hapus templat']",
            )
        )
    )
    delete_btn.click()

    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable(
            (By.XPATH, "//div[@role='dialog']//button[contains(normalize-space(.), 'Ya, Hapus')]")
        )
    ).click()

    wait_body_contains(driver, "templat berhasil dihapus", 15)
    wait_body_not_contains(driver, UPDATED_TEMPLATE_TITLE, 15)
    print("PASS TC.TMP.004")


def tc_tmp_005_required_validation(driver):
    print("Running TC.TMP.005: Validasi kolom wajib saat tambah templat")
    login(driver, MERCHANT_ACCOUNT["email"], MERCHANT_ACCOUNT["password"], role_key="merchant")
    open_template_page(driver)

    open_add_template_modal(driver)
    submit_template_form(driver)

    dialog = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "div[role='dialog']"))
    )
    WebDriverWait(driver, 10).until(lambda d: "wajib diisi" in dialog.text.lower())

    close_btn = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//div[@role='dialog']//button[@aria-label='Tutup modal']"))
    )
    driver.execute_script("arguments[0].click();", close_btn)

    WebDriverWait(driver, 10).until(
        EC.invisibility_of_element_located((By.CSS_SELECTOR, "div[role='dialog']"))
    )
    print("PASS TC.TMP.005")


def tc_tmp_006_non_merchant_forbidden(driver):
    print("Running TC.TMP.006: Non-merchant tidak dapat mengakses templat")
    login(driver, MAHASISWA_ACCOUNT["email"], MAHASISWA_ACCOUNT["password"], role_key="mahasiswa")

    spa_go(driver, TEMPLATES_PATH)

    WebDriverWait(driver, 15).until(lambda d: current_path(d) != TEMPLATES_PATH)
    wait_app_ready(driver, 20)

    assert current_path(driver) != TEMPLATES_PATH, "Mahasiswa tidak boleh tetap berada di halaman templat merchant."
    assert "templat balasan cepat" not in body_text(driver).lower(), (
        "Halaman templat merchant masih tampil untuk mahasiswa."
    )
    print("PASS TC.TMP.006")


def tc_tmp_007_insert_template_in_chat(driver):
    print("Running TC.TMP.007: Menyisipkan templat di kolom pesan chat")
    login(driver, MERCHANT_ACCOUNT["email"], MERCHANT_ACCOUNT["password"], role_key="merchant")
    open_template_page(driver)

    active_badges = driver.find_elements(By.XPATH, "//table//span[normalize-space()='Aktif']")
    if not active_badges:
        create_template_via_ui(
            driver,
            title=CHAT_TEMPLATE_TITLE,
            category="Undangan Wawancara",
            text=CHAT_TEMPLATE_BODY,
        )

    spa_open(driver, MESSAGES_PATH)
    wait_app_ready(driver, 25)

    conversation_section = WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "section[aria-label='Daftar percakapan']"))
    )
    WebDriverWait(driver, 20).until(
        lambda d: "memuat percakapan..." not in conversation_section.text.lower()
    )

    articles = WebDriverWait(driver, 15).until(
        lambda d: d.find_elements(By.CSS_SELECTOR, "section[aria-label='Daftar percakapan'] article")
    )
    assert len(articles) > 0, (
        "Tidak ada percakapan tersedia. Jalankan dulu: php artisan db:seed --class=CandidateFlowSeeder "
        "agar ada lamaran antara mahasiswa@paruhkita.test dan merchant@paruhkita.test."
    )
    articles[0].find_element(By.TAG_NAME, "button").click()

    textarea = WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "textarea[aria-label='Tulis pesan']"))
    )

    WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable(
            (By.XPATH, "//button[@aria-haspopup='dialog' and contains(normalize-space(.), 'Templat')]")
        )
    ).click()

    dialog = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, "div[role='dialog'][aria-label='Pilih Templat Balasan Cepat']")
        )
    )
    WebDriverWait(driver, 15).until(lambda d: "memuat templat aktif..." not in dialog.text.lower())

    template_buttons = driver.find_elements(
        By.CSS_SELECTOR,
        "div[role='dialog'][aria-label='Pilih Templat Balasan Cepat'] div.max-h-60 button",
    )
    assert len(template_buttons) > 0, "Tidak ada templat aktif yang tersedia di dialog."
    template_buttons[0].click()

    WebDriverWait(driver, 10).until(
        lambda d: (d.execute_script("return arguments[0].value", textarea) or "").strip() != ""
    )
    print("PASS TC.TMP.007")


def main():
    driver = create_driver()
    try:
        tc_tmp_001_list_templates(driver)
        tc_tmp_002_create_template(driver)
        tc_tmp_003_update_template(driver)
        tc_tmp_004_delete_template(driver)
        tc_tmp_005_required_validation(driver)
        tc_tmp_006_non_merchant_forbidden(driver)
        tc_tmp_007_insert_template_in_chat(driver)
        print("\nSELURUH TEST CASE TEMPLAT BALASAN CEPAT (TUBES 148) SELESAI DIJALANKAN!")
    finally:
        time.sleep(1)
        driver.quit()


if __name__ == "__main__":
    main()

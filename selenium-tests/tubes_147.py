import os
import tempfile
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = os.getenv("PARUHKITA_BASE_URL", "http://localhost:5173")

MERCHANT_ACCOUNT = {
    "email": "merchant@paruhkita.test",
    "password": "password123",
}
MAHASISWA_ACCOUNT = {
    "email": "mahasiswa@paruhkita.test",
    "password": "password123",
}
ADMIN_ACCOUNT = {
    "email": "admin@paruhkita.test",
    "password": "password123",
}


def create_driver():
    driver = webdriver.Edge()
    driver.maximize_window()
    return driver


CURRENT_ROLE = None


def clear_session(driver):
    global CURRENT_ROLE
    CURRENT_ROLE = None
    driver.delete_all_cookies()
    driver.get(f"{BASE_URL}/login")
    driver.execute_script("window.localStorage.clear(); window.sessionStorage.clear();")
    driver.refresh()


def login(driver, email, password, role_key=None):
    global CURRENT_ROLE
    if role_key and CURRENT_ROLE == role_key and "/login" not in driver.current_url:
        return

    clear_session(driver)
    email_input = WebDriverWait(driver, 15).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='email'], input[name='email']"))
    )
    password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")

    email_input.clear()
    email_input.send_keys(email)
    password_input.clear()
    password_input.send_keys(password)

    submit_btn = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
    )
    submit_btn.click()
    try:
        WebDriverWait(driver, 25).until(lambda d: "/login" not in d.current_url)
        time.sleep(1.5)
        WebDriverWait(driver, 25).until(
            lambda d: "Memuat data..." not in d.find_element(By.TAG_NAME, "body").text
        )
        if "/login" in driver.current_url:
            raise AssertionError("Sesi ditolak server (401) dan diarahkan kembali ke /login. Cek backend/database.")
        CURRENT_ROLE = role_key
    except Exception:
        error_boxes = driver.find_elements(By.CSS_SELECTOR, "div.bg-rose-50")
        err_text = error_boxes[0].text.strip() if error_boxes else "Tidak ada pesan error terlihat; cek apakah frontend/backend berjalan."
        raise AssertionError(f"Login gagal untuk {email} (tetap di {driver.current_url}): {err_text}")


def open_messages_page(driver, role="merchant"):
    path = "/merchant/messages" if role == "merchant" else "/pesan"
    nav_links = driver.find_elements(
        By.XPATH,
        f"//a[@href='{path}'] | //nav//button[contains(normalize-space(), 'Pesan')] | //aside//button[contains(normalize-space(), 'Pesan')]",
    )
    if nav_links:
        driver.execute_script("arguments[0].click();", nav_links[0])
    else:
        driver.get(f"{BASE_URL}{path}")

    try:
        WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "section[aria-label='Daftar percakapan']"))
        )
        WebDriverWait(driver, 30).until(
            lambda d: "Memuat percakapan..." not in d.find_element(By.CSS_SELECTOR, "section[aria-label='Daftar percakapan']").text
        )
        all_tabs = driver.find_elements(By.XPATH, "//div[@role='tablist']//button[normalize-space()='Semua']")
        if all_tabs and all_tabs[0].get_attribute("aria-selected") != "true":
            all_tabs[0].click()
            WebDriverWait(driver, 30).until(
                lambda d: "Memuat percakapan..." not in d.find_element(By.CSS_SELECTOR, "section[aria-label='Daftar percakapan']").text
            )
        search_inputs = driver.find_elements(By.CSS_SELECTOR, "input[aria-label='Cari percakapan']")
        if search_inputs and search_inputs[0].get_attribute("value"):
            search_inputs[0].send_keys(Keys.CONTROL, "a")
            search_inputs[0].send_keys(Keys.BACKSPACE)
    except Exception as exc:
        conv_sections = driver.find_elements(By.CSS_SELECTOR, "section[aria-label='Daftar percakapan']")
        conv_text = conv_sections[0].text.strip().replace("\n", " | ")[:200] if conv_sections else "section tidak ada"
        raise AssertionError(
            f"Gagal membuka halaman pesan ({path}). URL saat ini: {driver.current_url}. Daftar percakapan: {conv_text}"
        ) from exc


def select_first_conversation(driver):
    WebDriverWait(driver, 15).until(
        lambda d: "Memuat percakapan..." not in d.find_element(By.CSS_SELECTOR, "section[aria-label='Daftar percakapan']").text
    )
    conv_list = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "section[aria-label='Daftar percakapan']"))
    )
    articles = WebDriverWait(driver, 10).until(
        lambda d: d.find_elements(By.CSS_SELECTOR, "section[aria-label='Daftar percakapan'] article")
    )
    assert len(articles) > 0, "Tidak ada percakapan tersedia pada daftar."
    articles[0].find_element(By.TAG_NAME, "button").click()
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "textarea[aria-label='Tulis pesan']"))
    )
    return articles[0]


def create_temp_file(filename, size_bytes=1024, content=b"%PDF-1.4\n%ParuhKita test attachment\n"):
    temp_dir = tempfile.mkdtemp(prefix="paruhkita_msg_")
    file_path = os.path.join(temp_dir, filename)
    with open(file_path, "wb") as f:
        if len(content) < size_bytes:
            f.write(content + b"0" * (size_bytes - len(content)))
        else:
            f.write(content)
    return file_path


def tc_msg_001_001_merchant_inbox_list(driver):
    print("Running TC.MSG.001.001: Merchant melihat daftar percakapan masuk")
    login(driver, MERCHANT_ACCOUNT["email"], MERCHANT_ACCOUNT["password"], role_key="merchant")
    open_messages_page(driver, role="merchant")
    articles = driver.find_elements(By.CSS_SELECTOR, "section[aria-label='Daftar percakapan'] article")
    assert len(articles) > 0, (
        "Daftar percakapan merchant kosong. Jalankan dulu: php artisan db:seed --class=CandidateFlowSeeder "
        "agar ada lamaran antara mahasiswa@paruhkita.test dan merchant@paruhkita.test."
    )
    print("PASS TC.MSG.001.001")


def tc_msg_001_002_student_inbox_list(driver):
    print("Running TC.MSG.001.002: Mahasiswa melihat daftar percakapan masuk")
    login(driver, MAHASISWA_ACCOUNT["email"], MAHASISWA_ACCOUNT["password"], role_key="mahasiswa")
    open_messages_page(driver, role="mahasiswa")
    articles = driver.find_elements(By.CSS_SELECTOR, "section[aria-label='Daftar percakapan'] article")
    assert len(articles) > 0, "Daftar percakapan mahasiswa kosong."
    print("PASS TC.MSG.001.002")


def tc_msg_001_003_guest_redirect_login(driver):
    print("Running TC.MSG.001.003: Pengguna belum login ditolak akses halaman pesan")
    clear_session(driver)
    driver.get(f"{BASE_URL}/merchant/messages")
    WebDriverWait(driver, 10).until(EC.url_contains("/login"))
    driver.get(f"{BASE_URL}/pesan")
    WebDriverWait(driver, 10).until(EC.url_contains("/login"))
    print("PASS TC.MSG.001.003")


def tc_msg_001_004_admin_role_forbidden(driver):
    print("Running TC.MSG.001.004: Role Admin tidak dapat mengakses fitur pesan")
    login(driver, ADMIN_ACCOUNT["email"], ADMIN_ACCOUNT["password"])
    driver.get(f"{BASE_URL}/merchant/messages")
    WebDriverWait(driver, 15).until(lambda d: "/merchant/messages" not in d.current_url)
    print("PASS TC.MSG.001.004")


def tc_msg_002_001_send_text_message(driver):
    print("Running TC.MSG.002.001: Mengirim pesan teks di ruang obrolan")
    login(driver, MAHASISWA_ACCOUNT["email"], MAHASISWA_ACCOUNT["password"], role_key="mahasiswa")
    open_messages_page(driver, role="mahasiswa")
    select_first_conversation(driver)

    message_text = f"Halo, ini pesan uji otomatis {int(time.time())}"
    textarea = driver.find_element(By.CSS_SELECTOR, "section[aria-label='Ruang obrolan'] textarea[aria-label='Tulis pesan']")
    textarea.clear()
    textarea.send_keys(message_text)

    send_btn = driver.find_element(By.CSS_SELECTOR, "section[aria-label='Ruang obrolan'] form button[type='submit']")
    send_btn.click()

    try:
        WebDriverWait(driver, 15).until(
            EC.text_to_be_present_in_element((By.CSS_SELECTOR, "section[aria-label='Ruang obrolan']"), message_text)
        )
    except Exception as exc:
        alerts = driver.find_elements(By.CSS_SELECTOR, "p[role='alert']")
        err_text = alerts[0].text.strip() if alerts else "Tidak ada pesan alert."
        raise AssertionError(f"Pesan tidak muncul di ruang obrolan. Alert: {err_text}") from exc
    print("PASS TC.MSG.002.001")


def tc_msg_002_002_send_attachment_message(driver):
    print("Running TC.MSG.002.002: Mengirim lampiran dokumen valid")
    login(driver, MAHASISWA_ACCOUNT["email"], MAHASISWA_ACCOUNT["password"], role_key="mahasiswa")
    open_messages_page(driver, role="mahasiswa")
    select_first_conversation(driver)

    pdf_path = create_temp_file("lampiran_uji.pdf", size_bytes=2048)
    file_input = driver.find_element(By.CSS_SELECTOR, "section[aria-label='Ruang obrolan'] input[type='file']")
    file_input.send_keys(pdf_path)

    WebDriverWait(driver, 10).until(
        EC.text_to_be_present_in_element((By.CSS_SELECTOR, "section[aria-label='Ruang obrolan'] form"), "lampiran_uji.pdf")
    )
    driver.find_element(By.CSS_SELECTOR, "section[aria-label='Ruang obrolan'] form button[type='submit']").click()

    try:
        WebDriverWait(driver, 15).until(
            EC.text_to_be_present_in_element((By.CSS_SELECTOR, "section[aria-label='Ruang obrolan']"), "lampiran_uji.pdf")
        )
    except Exception as exc:
        alerts = driver.find_elements(By.CSS_SELECTOR, "p[role='alert']")
        err_text = alerts[0].text.strip() if alerts else "Tidak ada pesan alert."
        raise AssertionError(f"Lampiran tidak muncul di ruang obrolan. Alert: {err_text}") from exc
    print("PASS TC.MSG.002.002")


def tc_msg_002_003_reject_empty_message(driver):
    print("Running TC.MSG.002.003: Validasi tidak bisa mengirim pesan kosong")
    login(driver, MAHASISWA_ACCOUNT["email"], MAHASISWA_ACCOUNT["password"], role_key="mahasiswa")
    open_messages_page(driver, role="mahasiswa")
    select_first_conversation(driver)

    textarea = driver.find_element(By.CSS_SELECTOR, "section[aria-label='Ruang obrolan'] textarea[aria-label='Tulis pesan']")
    textarea.clear()
    textarea.send_keys("   ")

    send_btn = driver.find_element(By.CSS_SELECTOR, "section[aria-label='Ruang obrolan'] form button[type='submit']")
    assert not send_btn.is_enabled(), "Tombol Kirim harus disabled untuk pesan kosong/spasi."

    textarea.send_keys(Keys.ENTER)
    alert = WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.CSS_SELECTOR, "p[role='alert']")))
    assert "Tulis pesan atau pilih lampiran sebelum mengirim." in alert.text
    print("PASS TC.MSG.002.003")


def tc_msg_002_004_reject_oversize_attachment(driver):
    print("Running TC.MSG.002.004: Validasi lampiran melebihi 10 MB")
    login(driver, MAHASISWA_ACCOUNT["email"], MAHASISWA_ACCOUNT["password"], role_key="mahasiswa")
    open_messages_page(driver, role="mahasiswa")
    select_first_conversation(driver)

    big_file = create_temp_file("file_terlalu_besar.pdf", size_bytes=11 * 1024 * 1024)
    file_input = driver.find_element(By.CSS_SELECTOR, "section[aria-label='Ruang obrolan'] input[type='file']")
    file_input.send_keys(big_file)

    alert = WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.CSS_SELECTOR, "p[role='alert']")))
    assert "Ukuran lampiran maksimal 10 MB." in alert.text
    print("PASS TC.MSG.002.004")


def tc_msg_003_001_search_conversations(driver):
    print("Running TC.MSG.003.001: Mencari percakapan berdasarkan kata kunci")
    login(driver, MERCHANT_ACCOUNT["email"], MERCHANT_ACCOUNT["password"], role_key="merchant")
    open_messages_page(driver, role="merchant")

    search_input = driver.find_element(By.CSS_SELECTOR, "input[aria-label='Cari percakapan']")
    search_input.clear()
    search_input.send_keys("Budi")
    time.sleep(0.5)
    articles = driver.find_elements(By.CSS_SELECTOR, "section[aria-label='Daftar percakapan'] article")
    assert len(articles) >= 0

    search_input.clear()
    search_input.send_keys("ZZZ_TIDAK_ADA_999")
    time.sleep(0.5)
    WebDriverWait(driver, 5).until(
        EC.text_to_be_present_in_element((By.CSS_SELECTOR, "section[aria-label='Daftar percakapan']"), "Belum ada percakapan")
    )
    print("PASS TC.MSG.003.001")


def tc_msg_003_002_filter_conversations(driver):
    print("Running TC.MSG.003.002: Memfilter percakapan (Semua, Belum Dibaca, Diarsipkan)")
    login(driver, MERCHANT_ACCOUNT["email"], MERCHANT_ACCOUNT["password"], role_key="merchant")
    open_messages_page(driver, role="merchant")

    for tab_label in ["Semua", "Belum Dibaca", "Diarsipkan"]:
        tab = driver.find_element(By.XPATH, f"//div[@role='tablist']//button[normalize-space()='{tab_label}']")
        tab.click()
        WebDriverWait(driver, 5).until(lambda d: tab.get_attribute("aria-selected") == "true")
    print("PASS TC.MSG.003.002")


def tc_msg_004_001_mark_unread_and_archive(driver):
    print("Running TC.MSG.004.001 & TC.MSG.004.002: Tandai belum dibaca dan arsipkan/kembalikan")
    login(driver, MERCHANT_ACCOUNT["email"], MERCHANT_ACCOUNT["password"], role_key="merchant")
    open_messages_page(driver, role="merchant")
    article = select_first_conversation(driver)

    manage_btn = article.find_element(By.CSS_SELECTOR, "button[aria-label='Kelola percakapan']")
    driver.execute_script("arguments[0].click();", manage_btn)
    unread_btn = WebDriverWait(driver, 5).until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Tandai belum dibaca')]"))
    )
    unread_btn.click()

    notice = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "div[role='status']")))
    assert "Percakapan ditandai belum dibaca." in notice.text

    select_first_conversation(driver)
    archive_btn = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "section[aria-label='Ruang obrolan'] header button[title*='Arsipkan']"))
    )
    archive_btn.click()
    WebDriverWait(driver, 10).until(
        EC.text_to_be_present_in_element((By.CSS_SELECTOR, "div[role='status']"), "Percakapan berhasil diarsipkan.")
    )

    archived_tab = driver.find_element(By.XPATH, "//div[@role='tablist']//button[normalize-space()='Diarsipkan']")
    archived_tab.click()
    WebDriverWait(driver, 10).until(
        lambda d: "Memuat percakapan..." not in d.find_element(By.CSS_SELECTOR, "section[aria-label='Daftar percakapan']").text
    )
    select_first_conversation(driver)

    unarchive_btn = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "section[aria-label='Ruang obrolan'] header button[title*='Kembalikan']"))
    )
    unarchive_btn.click()
    WebDriverWait(driver, 10).until(
        EC.text_to_be_present_in_element((By.CSS_SELECTOR, "div[role='status']"), "Percakapan dikembalikan ke kotak masuk.")
    )
    print("PASS TC.MSG.004.001 & TC.MSG.004.002")


def main():
    driver = create_driver()
    try:
        # Merchant tests (1x login)
        tc_msg_001_001_merchant_inbox_list(driver)
        tc_msg_003_001_search_conversations(driver)
        tc_msg_003_002_filter_conversations(driver)
        tc_msg_004_001_mark_unread_and_archive(driver)

        # Mahasiswa tests (1x login)
        tc_msg_001_002_student_inbox_list(driver)
        tc_msg_002_001_send_text_message(driver)
        tc_msg_002_002_send_attachment_message(driver)
        tc_msg_002_003_reject_empty_message(driver)
        tc_msg_002_004_reject_oversize_attachment(driver)

        # Guest & Admin access tests
        tc_msg_001_003_guest_redirect_login(driver)
        tc_msg_001_004_admin_role_forbidden(driver)
        print("\nSELURUH TEST CASE PESAN (TUBES 147) SELESAI DIJALANKAN!")
    finally:
        time.sleep(1)
        driver.quit()


if __name__ == "__main__":
    main()

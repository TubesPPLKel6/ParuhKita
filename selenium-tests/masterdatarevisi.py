import os
import unittest
from uuid import uuid4

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait


BASE_URL = os.getenv("PARUHKITA_BASE_URL", "http://localhost:5173").rstrip("/")
ADMIN_EMAIL = os.getenv("PARUHKITA_ADMIN_EMAIL", "admin@paruhkita.test")
ADMIN_PASSWORD = os.getenv("PARUHKITA_ADMIN_PASSWORD", "password123")
WAIT_SECONDS = 15


class MasterDataCrudTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        options = webdriver.EdgeOptions()
        if os.getenv("SELENIUM_HEADLESS") == "1":
            options.add_argument("--headless=new")
        cls.driver = webdriver.Edge(options=options)
        cls.driver.set_window_size(1440, 1000)
        cls.wait = WebDriverWait(cls.driver, WAIT_SECONDS)
        cls._login()

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

    @classmethod
    def _login(cls):
        cls.driver.get(f"{BASE_URL}/login")
        cls.driver.delete_all_cookies()
        cls.driver.execute_script(
            "window.localStorage.clear(); window.sessionStorage.clear();"
        )
        cls.driver.refresh()
        email = cls.wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
        )
        email.send_keys(ADMIN_EMAIL)
        cls.driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys(
            ADMIN_PASSWORD
        )
        cls.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        cls.wait.until(EC.url_contains("/admin/dashboard"))

    def setUp(self):
        self.token = uuid4().hex[:10].upper()
        self.campus_names = []
        self.program_names = []
        self.category_names = []
        self._open_master_data()

    def tearDown(self):
        self._cleanup_created_data()

    def _open_master_data(self):
        self.driver.get(f"{BASE_URL}/admin/reference-data")
        self.wait.until(
            EC.visibility_of_element_located(
                (By.XPATH, "//*[normalize-space()='Pengelolaan Data Master']")
            )
        )

    def _field(self, label, element="input"):
        return self.wait.until(
            EC.visibility_of_element_located(
                (
                    By.XPATH,
                    f"//label[contains(normalize-space(.), '{label}')]/{element}",
                )
            )
        )

    def _fill(self, label, value, element="input"):
        field = self._field(label, element)
        field.clear()
        field.send_keys(value)

    def _select(self, label, value):
        Select(self._field(label, "select")).select_by_value(value)

    def _save_form(self):
        self.driver.find_element(
            By.CSS_SELECTOR, "form button[type='submit']"
        ).click()
        self.wait.until(
            lambda driver: driver.current_url.rstrip("/").endswith(
                "/admin/reference-data"
            )
        )
        self.wait.until(
            EC.presence_of_element_located(
                (By.CSS_SELECTOR, ".admin-table-card .admin-table")
            )
        )

    def _assert_success_notice(self):
        notice = self.wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "[role='status']"))
        )
        self.assertIn("berhasil", notice.text.lower())

    def _tab(self, label):
        self.wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, f"//button[normalize-space()='{label}']")
            )
        ).click()

    def _search(self, term, placeholder):
        search = self.wait.until(
            EC.visibility_of_element_located(
                (By.CSS_SELECTOR, f"input[placeholder='{placeholder}']")
            )
        )
        search.clear()
        search.send_keys(term)

    def _row(self, name):
        return self.wait.until(
            EC.presence_of_element_located(
                (By.XPATH, f"//tr[contains(normalize-space(.), '{name}')]")
            )
        )

    def _row_or_no_results(self, name):
        return self.wait.until(
            lambda driver: driver.find_elements(
                By.XPATH, f"//tr[contains(normalize-space(.), '{name}')]"
            )
            or (
                driver.find_element(By.CSS_SELECTOR, ".admin-table-card")
                .find_element(By.CSS_SELECTOR, ".admin-table-message")
                .text.startswith("Tidak ada")
            )
        )

    def _campus_search(self, name):
        self._search(name, "Cari nama kampus...")

    def _category_search(self, name):
        self._tab("Kategori Pekerjaan")
        self._search(name, "Cari nama kategori...")

    def _program_search(self, name):
        self._tab("Program Studi")
        self._search(name, "Cari nama atau kode program studi...")

    def _create_campus(self, name):
        self.driver.find_element(
            By.XPATH, "//a[contains(normalize-space(.), 'Tambah Data Baru')]"
        ).click()
        self._fill("Nama Kampus", name)
        self._fill("Kode Kampus", f"QA{uuid4().hex[:12].upper()}")
        self._fill("Kota", "Bandung")
        self._select("Status", "active")
        self._select("Akreditasi", "A")
        self.campus_names.append(name)
        self._save_form()
        self._assert_success_notice()
        self._campus_search(name)
        self.assertIn("Aktif", self._row(name).text)

    def _open_add_category(self):
        self._category_search("")
        self.driver.find_element(
            By.XPATH, "//a[contains(normalize-space(.), 'Tambah Kategori')]"
        ).click()

    def _create_category(self, name):
        self._open_add_category()
        self._fill("Nama Kategori", name)
        self._fill(
            "Deskripsi Kategori", "Kategori untuk pengujian UI.", "textarea"
        )
        self._select("Status", "active")
        self.category_names.append(name)
        self._save_form()
        self._assert_success_notice()
        self._category_search(name)
        self._row(name)

    def _submit_duplicate_campus(self, name):
        self.driver.find_element(
            By.XPATH, "//a[contains(normalize-space(.), 'Tambah Data Baru')]"
        ).click()
        self._fill("Nama Kampus", name)
        self._fill("Kode Kampus", f"QA{uuid4().hex[:12].upper()}")
        self._fill("Kota", "Bandung")
        self._select("Status", "active")
        self._select("Akreditasi", "A")
        self.driver.find_element(
            By.CSS_SELECTOR, "form button[type='submit']"
        ).click()
        error = self.wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "[role='alert']"))
        )
        self.assertTrue(error.text.strip())
        self.assertEqual(
            self.driver.find_elements(By.CSS_SELECTOR, "[role='status']"), []
        )
        self.assertIn("/campuses/new", self.driver.current_url)

    def _submit_duplicate_category(self, name):
        self._open_add_category()
        self._fill("Nama Kategori", name)
        self._fill(
            "Deskripsi Kategori", "Kategori duplikat untuk pengujian.", "textarea"
        )
        self._select("Status", "active")
        self.driver.find_element(
            By.CSS_SELECTOR, "form button[type='submit']"
        ).click()
        error = self.wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "[role='alert']"))
        )
        self.assertTrue(error.text.strip())
        self.assertEqual(
            self.driver.find_elements(By.CSS_SELECTOR, "[role='status']"), []
        )
        self.assertIn("/job-categories/new", self.driver.current_url)

    def _delete_row(self, tab, name, button_title):
        self._tab(tab)
        if tab == "Kampus":
            self._campus_search(name)
        elif tab == "Program Studi":
            self._program_search(name)
        else:
            self._category_search(name)
        rows = self._row_or_no_results(name)
        if isinstance(rows, bool):
            return
        if not rows:
            return
        row = rows[0]
        row.find_element(By.CSS_SELECTOR, f"button[title='{button_title}']").click()
        self.wait.until(EC.alert_is_present()).accept()
        self.wait.until(
            lambda driver: not driver.find_elements(
                By.XPATH, f"//tr[contains(normalize-space(.), '{name}')]"
            )
        )

    def _cleanup_created_data(self):
        self._open_master_data()
        for name in self.program_names:
            self._delete_row("Program Studi", name, "Hapus program studi")
        for name in self.category_names:
            self._delete_row("Kategori Pekerjaan", name, "Hapus kategori")
        for name in self.campus_names:
            self._delete_row("Kampus", name, "Hapus kampus")

    def test_TC_MDA_001_001_add_campus(self):
        name = f"Universitas Uji 001 {self.token}"
        self._create_campus(name)

    def test_TC_MDA_001_002_reject_duplicate_campus_name(self):
        name = f"Universitas Uji Duplikat {self.token}"
        self._create_campus(name)
        self._submit_duplicate_campus(name)
        self._open_master_data()
        self._campus_search(name)
        rows = self.wait.until(
            lambda driver: (
                rows
                if len(
                    rows := driver.find_elements(
                    By.XPATH, f"//tr[contains(normalize-space(.), '{name}')]"
                    )
                )
                == 1
                else False
            )
        )
        self.assertEqual(len(rows), 1)

    def test_TC_MDA_001_003_update_campus_city(self):
        name = f"Universitas Uji Ubah {self.token}"
        self._create_campus(name)
        self._row(name).find_element(
            By.CSS_SELECTOR, "a[title='Ubah kampus']"
        ).click()
        self.wait.until(EC.url_contains("?edit="))
        self._fill("Kota", "Jakarta")
        self._save_form()
        self._assert_success_notice()
        self._campus_search(name)
        self.assertIn("Jakarta", self._row(name).text)

    def test_TC_MDA_002_001_category_name_is_required(self):
        self._open_add_category()
        name = self._field("Nama Kategori")
        self.driver.find_element(
            By.CSS_SELECTOR, "form button[type='submit']"
        ).click()
        self.assertTrue(
            self.driver.execute_script("return arguments[0].validity.valueMissing", name)
        )
        self.assertEqual(
            self.driver.find_elements(By.CSS_SELECTOR, "[role='status']"), []
        )
        self.assertIn("/job-categories/new", self.driver.current_url)

    def test_TC_MDA_002_002_reject_duplicate_category_name(self):
        name = f"Kategori Uji Duplikat {self.token}"
        self._create_category(name)
        self._submit_duplicate_category(name)
        self._open_master_data()
        self._category_search(name)
        self.assertEqual(
            len(
                self.driver.find_elements(
                    By.XPATH, f"//tr[contains(normalize-space(.), '{name}')]"
                )
            ),
            1,
        )

    def test_TC_MDA_002_003_add_job_category(self):
        name = f"Kategori Uji 001 {self.token}"
        self._create_category(name)

    def test_TC_MDA_002_004_delete_job_category(self):
        name = f"Kategori Uji Hapus {self.token}"
        self._create_category(name)
        row = self._row(name)
        row.find_element(By.CSS_SELECTOR, "button[title='Hapus kategori']").click()
        self.wait.until(EC.alert_is_present()).accept()
        self.wait.until(
            lambda driver: not driver.find_elements(
                By.XPATH, f"//tr[contains(normalize-space(.), '{name}')]"
            )
        )
        self._assert_success_notice()

    def test_TC_MDA_003_001_update_campus_status(self):
        name = f"Universitas Uji Status {self.token}"
        self._create_campus(name)
        self._row(name).find_element(
            By.CSS_SELECTOR, "a[title='Ubah kampus']"
        ).click()
        self.wait.until(EC.url_contains("?edit="))
        self._select("Status", "inactive")
        self._save_form()
        self._assert_success_notice()
        self._campus_search(name)
        self.assertIn("Nonaktif", self._row(name).text)

    def test_TC_MDA_004_001_add_study_program(self):
        name = f"Prodi Uji 001 {self.token}"
        self._tab("Program Studi")
        self.driver.find_element(
            By.XPATH, "//a[contains(normalize-space(.), 'Tambah Program Studi')]"
        ).click()
        self._fill("Nama Prodi", name)
        self._fill("Kode Prodi", f"QA-{uuid4().hex[:12].upper()}")
        campus_select = Select(self._field("Pilih Kampus", "select"))
        self.assertGreater(len(campus_select.options), 1)
        campus_select.select_by_index(1)
        self._select("Jenjang", "S1")
        self._select("Status", "active")
        self.program_names.append(name)
        self._save_form()
        self._assert_success_notice()
        self._program_search(name)
        self._row(name)


if __name__ == "__main__":
    unittest.main(verbosity=2)

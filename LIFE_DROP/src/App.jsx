
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const BLOOD_GROUPS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
];

const INITIAL_DONORS = [
  {
    id: 1,
    name: "Aarav Sharma",
    email: "aarav@example.com",
    phone: "9876543210",
    age: 24,
    bloodGroup: "O+",
    city: "Pune",
    available: true,
  },
  {
    id: 2,
    name: "Ananya Patil",
    email: "ananya@example.com",
    phone: "8765432109",
    age: 22,
    bloodGroup: "B+",
    city: "Alandi",
    available: true,
  },
  {
    id: 3,
    name: "Rohan Deshmukh",
    email: "rohan@example.com",
    phone: "7654321098",
    age: 28,
    bloodGroup: "A+",
    city: "Pune",
    available: false,
  },
];

const DONORS_KEY = "lifedropDonors";
const FAVORITES_KEY = "lifedropFavorites";
const THEME_KEY = "lifedropDarkMode";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  age: "",
  bloodGroup: "",
  city: "",
  available: true,
};

function loadFromStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function validateForm(form) {
  const errors = {};

  if (!form.name.trim() || form.name.trim().length < 2) {
    errors.name = "Enter a name with at least 2 characters.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
    errors.phone = "Enter a valid 10-digit Indian mobile number.";
  }

  const age = Number(form.age);
  if (!form.age || !Number.isInteger(age) || age < 18 || age > 65) {
    errors.age = "Age must be a whole number between 18 and 65.";
  }

  if (!BLOOD_GROUPS.includes(form.bloodGroup)) {
    errors.bloodGroup = "Choose a valid blood group.";
  }

  if (!form.city.trim() || form.city.trim().length < 2) {
    errors.city = "Enter a valid city.";
  }

  return errors;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function App() {
  const [donors, setDonors] = useState(() =>
    loadFromStorage(DONORS_KEY, INITIAL_DONORS)
  );
  const [favorites, setFavorites] = useState(() =>
    loadFromStorage(FAVORITES_KEY, [])
  );
  const [darkMode, setDarkMode] = useState(() =>
    loadFromStorage(THEME_KEY, false)
  );

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [search, setSearch] = useState("");
  const [bloodFilter, setBloodFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    localStorage.setItem(DONORS_KEY, JSON.stringify(donors));
  }, [donors]);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, JSON.stringify(darkMode));
  }, [darkMode]);

  function showMessage(text, type = "success") {
    setMessage(text);
    setMessageType(type);
  }

  function handleInputChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((previous) => ({ ...previous, [name]: "" }));
  }

  function resetForm() {
    setForm(emptyForm);
    setErrors({});
    setEditingId(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const newErrors = validateForm(form);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showMessage("Please correct the highlighted fields.", "error");
      return;
    }

    const cleanDonor = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      age: Number(form.age),
      city: form.city.trim(),
    };

    if (editingId !== null) {
      setDonors((previous) =>
        previous.map((donor) =>
          donor.id === editingId ? { ...donor, ...cleanDonor } : donor
        )
      );
      showMessage("Donor profile updated successfully.");
    } else {
      const newDonor = { ...cleanDonor, id: Date.now() };
      setDonors((previous) => [newDonor, ...previous]);
      showMessage("Donor registered successfully. Thank you for helping!");
    }

    resetForm();
  }

  function startEditing(donor) {
    setForm({
      name: donor.name,
      email: donor.email,
      phone: donor.phone,
      age: String(donor.age),
      bloodGroup: donor.bloodGroup,
      city: donor.city,
      available: donor.available,
    });
    setEditingId(donor.id);
    setErrors({});
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function removeDonor(id) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this donor profile?"
    );

    if (!confirmed) return;

    setDonors((previous) => previous.filter((donor) => donor.id !== id));
    setFavorites((previous) => previous.filter((favoriteId) => favoriteId !== id));

    if (editingId === id) resetForm();
    showMessage("Donor profile removed.");
  }

  function toggleFavorite(id) {
    setFavorites((previous) =>
      previous.includes(id)
        ? previous.filter((favoriteId) => favoriteId !== id)
        : [...previous, id]
    );
  }

  const cities = useMemo(
    () => [...new Set(donors.map((donor) => donor.city).filter(Boolean))].sort(),
    [donors]
  );

  const bloodCounts = useMemo(
    () =>
      BLOOD_GROUPS.map((group) => ({
        group,
        count: donors.filter((donor) => donor.bloodGroup === group).length,
      })),
    [donors]
  );

  const filteredDonors = useMemo(() => {
    const result = donors.filter((donor) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        donor.name.toLowerCase().includes(searchText) ||
        donor.city.toLowerCase().includes(searchText);

      const matchesBlood =
        bloodFilter === "All" || donor.bloodGroup === bloodFilter;

      const matchesCity = cityFilter === "All" || donor.city === cityFilter;

      const matchesAvailability =
        availabilityFilter === "All" ||
        (availabilityFilter === "Available" && donor.available) ||
        (availabilityFilter === "Unavailable" && !donor.available);

      const matchesFavorite =
        !favoritesOnly || favorites.includes(donor.id);

      return (
        matchesSearch &&
        matchesBlood &&
        matchesCity &&
        matchesAvailability &&
        matchesFavorite
      );
    });

    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "city") return a.city.localeCompare(b.city);
      if (sortBy === "age") return a.age - b.age;
      if (sortBy === "bloodGroup") {
        return a.bloodGroup.localeCompare(b.bloodGroup);
      }
      if (sortBy === "availability") {
        return Number(b.available) - Number(a.available);
      }
      return 0;
    });

    return result;
  }, [
    donors,
    search,
    bloodFilter,
    cityFilter,
    availabilityFilter,
    favoritesOnly,
    favorites,
    sortBy,
  ]);

  function resetFilters() {
    setSearch("");
    setBloodFilter("All");
    setCityFilter("All");
    setAvailabilityFilter("All");
    setFavoritesOnly(false);
    setSortBy("name");
  }

  function exportCsv() {
    if (filteredDonors.length === 0) {
      showMessage("There are no donor profiles to export.", "error");
      return;
    }

    // Contact details are intentionally excluded from the downloaded file.
    const headings = ["Name", "Age", "Blood Group", "City", "Availability"];
    const rows = filteredDonors.map((donor) => [
      donor.name,
      donor.age,
      donor.bloodGroup,
      donor.city,
      donor.available ? "Available" : "Unavailable",
    ]);

    const csv = [headings, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lifedrop-donors.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showMessage("CSV downloaded. Contact details were not included.");
  }

  const availableCount = donors.filter((donor) => donor.available).length;

  return (
    <div className={`app ${darkMode ? "dark-mode" : ""}`}>
      <header className="topbar">
        <a className="brand" href="#home" aria-label="LifeDrop home">
          <span className="brand-icon">♥</span>
          <span>Life<span className="brand-accent">Drop</span></span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#register">Register</a>
          <a href="#directory">Donor Directory</a>
          <a href="#statistics">Statistics</a>
          <a href="#tips">Donation Guide</a>
        </nav>

        <button
          className="theme-button"
          type="button"
          onClick={() => setDarkMode((previous) => !previous)}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? "☀️ Light mode" : "🌙 Dark mode"}
        </button>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">A LITTLE HELP CAN SAVE A LIFE</span>
            <h1>Be someone's <span>lifeline.</span></h1>
            <p>
              Connect with blood donors in your community. One registration
              could make a life-changing difference.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#register">
                Become a donor <span aria-hidden="true">→</span>
              </a>
              <a className="button button-secondary" href="#directory">
                Find donors
              </a>
            </div>
            <div className="hero-note">
              <span className="pulse-dot" /> Built for community connection
            </div>
          </div>

          <div className="hero-art" aria-label="Blood donation illustration">
            <div className="art-circle circle-one" />
            <div className="art-circle circle-two" />
            <div className="blood-bag">
              <div className="bag-cap" />
              <div className="bag-label">LIFE<span>DROP</span></div>
              <div className="bag-heart">♥</div>
              <div className="blood-fill" />
              <div className="bag-tube" />
            </div>
            <span className="floating-heart heart-one">♥</span>
            <span className="floating-heart heart-two">♥</span>
            <div className="art-caption">
              <span className="caption-heart">♥</span>
              <span><strong>Give blood.</strong><br />Give hope.</span>
            </div>
          </div>
        </section>

        <section className="stats-strip" aria-label="Directory overview">
          <div className="quick-stat">
            <span className="quick-stat-icon">♙</span>
            <div><strong>{donors.length}</strong><span>Registered donors</span></div>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-icon">♥</span>
            <div><strong>{availableCount}</strong><span>Marked available</span></div>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-icon">✦</span>
            <div><strong>{favorites.length}</strong><span>Favorite profiles</span></div>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-icon">+</span>
            <div><strong>8</strong><span>Blood groups tracked</span></div>
          </div>
        </section>

        {message && (
          <div className={`message ${messageType}`} role="status" aria-live="polite">
            <span>{messageType === "success" ? "✓" : "!"}</span>
            {message}
            <button type="button" onClick={() => setMessage("")} aria-label="Dismiss message">
              ×
            </button>
          </div>
        )}

        <section className="section register-section" id="register">
          <div className="section-heading">
            <div>
              <span className="eyebrow">MAKE A DIFFERENCE</span>
              <h2>{editingId !== null ? "Edit donor profile" : "Become a donor"}</h2>
              <p>
                {editingId !== null
                  ? "Update the profile details below."
                  : "Join the LifeDrop community by filling out this simple form."}
              </p>
            </div>
            <div className="heading-decoration">♥</div>
          </div>

          <form className="donor-form" onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="name">Full name <span>*</span></label>
                <input id="name" name="name" value={form.name} onChange={handleInputChange} placeholder="Enter your full name" aria-invalid={!!errors.name} />
                {errors.name && <small className="field-error">{errors.name}</small>}
              </div>

              <div className="field">
                <label htmlFor="email">Email address <span>*</span></label>
                <input id="email" name="email" type="email" value={form.email} onChange={handleInputChange} placeholder="you@example.com" aria-invalid={!!errors.email} />
                {errors.email && <small className="field-error">{errors.email}</small>}
              </div>

              <div className="field">
                <label htmlFor="phone">Mobile number <span>*</span></label>
                <input id="phone" name="phone" inputMode="numeric" maxLength="10" value={form.phone} onChange={handleInputChange} placeholder="10-digit mobile number" aria-invalid={!!errors.phone} />
                {errors.phone && <small className="field-error">{errors.phone}</small>}
              </div>

              <div className="field">
                <label htmlFor="age">Age <span>*</span></label>
                <input id="age" name="age" type="number" min="18" max="65" value={form.age} onChange={handleInputChange} placeholder="Age (18–65)" aria-invalid={!!errors.age} />
                {errors.age && <small className="field-error">{errors.age}</small>}
              </div>

              <div className="field">
                <label htmlFor="bloodGroup">Blood group <span>*</span></label>
                <select id="bloodGroup" name="bloodGroup" value={form.bloodGroup} onChange={handleInputChange} aria-invalid={!!errors.bloodGroup}>
                  <option value="">Select blood group</option>
                  {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
                </select>
                {errors.bloodGroup && <small className="field-error">{errors.bloodGroup}</small>}
              </div>

              <div className="field">
                <label htmlFor="city">City / location <span>*</span></label>
                <input id="city" name="city" value={form.city} onChange={handleInputChange} placeholder="e.g. Pune" aria-invalid={!!errors.city} />
                {errors.city && <small className="field-error">{errors.city}</small>}
              </div>
            </div>

            <label className="availability-check">
              <input type="checkbox" name="available" checked={form.available} onChange={handleInputChange} />
              <span className="custom-check">✓</span>
              <span>
                <strong>Mark me as available</strong>
                <small>This is a self-reported status, not medical clearance.</small>
              </span>
            </label>

            <div className="form-actions">
              <button className="button button-primary" type="submit">
                {editingId !== null ? "Save changes" : "Register as donor"} <span>→</span>
              </button>
              {(editingId !== null || Object.keys(errors).length > 0) && (
                <button className="button button-secondary" type="button" onClick={resetForm}>
                  Cancel / clear
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="section directory-section" id="directory">
          <div className="section-heading directory-heading">
            <div>
              <span className="eyebrow">COMMUNITY OF HOPE</span>
              <h2>Donor directory</h2>
              <p>Search profiles and narrow down the list to find a possible match.</p>
            </div>
            <button className="button button-secondary export-button" type="button" onClick={exportCsv}>
              ↓ Export CSV
            </button>
          </div>

          <div className="filter-panel">
            <div className="field search-field">
              <label htmlFor="search">Search donors</label>
              <div className="search-input-wrap">
                <span aria-hidden="true">⌕</span>
                <input id="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or city..." />
              </div>
            </div>

            <div className="field">
              <label htmlFor="bloodFilter">Blood group</label>
              <select id="bloodFilter" value={bloodFilter} onChange={(event) => setBloodFilter(event.target.value)}>
                <option value="All">All groups</option>
                {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
              </select>
            </div>

            <div className="field">
              <label htmlFor="cityFilter">City</label>
              <select id="cityFilter" value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
                <option value="All">All cities</option>
                {cities.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>

            <div className="field">
              <label htmlFor="availabilityFilter">Availability</label>
              <select id="availabilityFilter" value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)}>
                <option value="All">All statuses</option>
                <option value="Available">Marked available</option>
                <option value="Unavailable">Not available</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="sortBy">Sort by</label>
              <select id="sortBy" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="name">Name (A–Z)</option>
                <option value="city">City (A–Z)</option>
                <option value="age">Age (youngest first)</option>
                <option value="bloodGroup">Blood group</option>
                <option value="availability">Available first</option>
              </select>
            </div>

            <div className="filter-bottom">
              <label className="favorite-filter">
                <input type="checkbox" checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} />
                <span>♥</span> Show favorites only
              </label>
              <button className="text-button" type="button" onClick={resetFilters}>Reset filters ↺</button>
            </div>
          </div>

          <div className="results-bar">
            <span>Showing <strong>{filteredDonors.length}</strong> of {donors.length} profiles</span>
            <span className="results-hint">♥ Every donor can make a difference</span>
          </div>

          {filteredDonors.length > 0 ? (
            <div className="donor-grid">
              {filteredDonors.map((donor) => {
                const isFavorite = favorites.includes(donor.id);

                return (
                  <article className="donor-card" key={donor.id}>
                    <div className="card-top">
                      <div className="avatar">{donor.name.trim().charAt(0).toUpperCase()}</div>
                      <button
                        className={`favorite-button ${isFavorite ? "is-favorite" : ""}`}
                        type="button"
                        onClick={() => toggleFavorite(donor.id)}
                        aria-label={isFavorite ? `Remove ${donor.name} from favorites` : `Add ${donor.name} to favorites`}
                        title={isFavorite ? "Remove favorite" : "Add to favorites"}
                      >
                        {isFavorite ? "♥" : "♡"}
                      </button>
                    </div>

                    <div className="card-name-row">
                      <h3>{donor.name}</h3>
                      <span className="blood-badge">{donor.bloodGroup}</span>
                    </div>
                    <p className="donor-location">⌖ {donor.city}</p>

                    <div className="donor-details">
                      <span>Age</span><strong>{donor.age} years</strong>
                      <span>Status</span>
                      <strong className={donor.available ? "status-available" : "status-unavailable"}>
                        <i /> {donor.available ? "Marked available" : "Unavailable"}
                      </strong>
                    </div>

                    <div className="card-actions">
                      <button className="small-button edit-button" type="button" onClick={() => startEditing(donor)}>
                        ✎ Edit
                      </button>
                      <button className="small-button delete-button" type="button" onClick={() => removeDonor(donor.id)}>
                        × Remove
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-heart">♡</div>
              <h3>No donor profiles found</h3>
              <p>Try changing your search or filters.</p>
              <button className="button button-secondary" type="button" onClick={resetFilters}>Clear filters</button>
            </div>
          )}
          <p className="privacy-note">
            Demo directory: donor contact details are not displayed publicly. Always obtain consent before sharing personal information.
          </p>
        </section>

        <section className="section statistics-section" id="statistics">
          <div className="section-heading">
            <div>
              <span className="eyebrow">KNOW YOUR COMMUNITY</span>
              <h2>Blood group statistics</h2>
              <p>Counts are based on profiles currently saved in this browser.</p>
            </div>
          </div>

          <div className="blood-stats-grid">
            {bloodCounts.map(({ group, count }) => {
              const percentage = donors.length ? (count / donors.length) * 100 : 0;

              return (
                <div className="blood-stat-card" key={group}>
                  <div className="blood-stat-top">
                    <span className="blood-stat-type">{group}</span>
                    <strong>{count}</strong>
                  </div>
                  <div className="progress-track" aria-label={`${group}: ${count} donors`}>
                    <div className="progress-fill" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="blood-stat-caption">{count === 1 ? "donor profile" : "donor profiles"}</span>
                </div>
              );
            })}
          </div>
          <p className="statistics-note">
            These figures describe this demo directory only. They do not indicate actual blood availability or compatibility.
          </p>
        </section>

        <section className="section guide-section" id="tips">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LEARN BEFORE YOU DONATE</span>
              <h2>Donation guide & FAQs</h2>
              <p>General information to help you prepare for a conversation with a qualified blood donation service.</p>
            </div>
            <div className="heading-decoration">✦</div>
          </div>

          <div className="guide-grid">
            <article className="guide-card">
              <div className="guide-icon">💧</div>
              <h3>Stay hydrated</h3>
              <p>Drink water as recommended by the donation service, and follow its preparation instructions.</p>
            </article>
            <article className="guide-card">
              <div className="guide-icon">🥗</div>
              <h3>Eat beforehand</h3>
              <p>Have a balanced meal and follow the blood centre's guidance about food and drinks.</p>
            </article>
            <article className="guide-card">
              <div className="guide-icon">🪪</div>
              <h3>Bring identification</h3>
              <p>Carry any identification or documents requested by the blood donation centre.</p>
            </article>
          </div>

          <div className="faq-list">
            <details>
              <summary>Can everyone listed here donate blood?</summary>
              <p>No. A profile or an “available” status does not confirm eligibility. A qualified blood donation service must screen each person and make the decision.</p>
            </details>
            <details>
              <summary>Does this app confirm blood group compatibility?</summary>
              <p>No. The directory only filters the blood group a user entered. A healthcare professional or blood bank must confirm compatibility and suitability for a specific donation.</p>
            </details>
            <details>
              <summary>Is this a live blood bank or emergency service?</summary>
              <p>No. LifeDrop is a frontend demonstration. It does not contact donors, verify identities, check real-time stock, or arrange emergency donations.</p>
            </details>
            <details>
              <summary>How is my information saved?</summary>
              <p>This demo stores profiles in your browser's local storage. It does not use a secure server or database. Avoid entering real personal information in a public demonstration.</p>
            </details>
          </div>
        </section>

        <section className="closing-banner">
          <div>
            <span className="eyebrow">SMALL ACT. BIG IMPACT.</span>
            <h2>Your kindness could mean another tomorrow.</h2>
            <p>Help grow a community that cares.</p>
          </div>
          <a className="button banner-button" href="#register">Join LifeDrop <span>→</span></a>
          <span className="banner-heart">♥</span>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">♥</span>
          <span>Life<span className="brand-accent">Drop</span></span>
        </a>
        <p>Made with care for a more connected community.</p>
        <span>© {new Date().getFullYear()} LifeDrop · Student project demo</span>
      </footer>
    </div>
  );
}

export default App;

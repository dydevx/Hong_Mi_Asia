const whatsappNumber = "4915115555883";
const menuTotalPages = 24;

const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector("#siteNav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("nav-open", isOpen);
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    }
  });
}

const schedule = {
  0: [{ start: "12:00", end: "21:00" }],
  1: [
    { start: "11:00", end: "14:30" },
    { start: "17:00", end: "21:00" },
  ],
  2: [
    { start: "11:00", end: "14:30" },
    { start: "17:00", end: "21:00" },
  ],
  3: [],
  4: [
    { start: "11:00", end: "14:30" },
    { start: "17:00", end: "21:00" },
  ],
  5: [
    { start: "11:00", end: "14:30" },
    { start: "17:00", end: "22:00" },
  ],
  6: [{ start: "16:30", end: "22:00" }],
};

const dayNames = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getBerlinParts(date) {
  const formatter = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  const dayMap = {
    Sonntag: 0,
    Montag: 1,
    Dienstag: 2,
    Mittwoch: 3,
    Donnerstag: 4,
    Freitag: 5,
    Samstag: 6,
  };
  const hour = Number(parts.hour) % 24;

  return {
    day: dayMap[parts.weekday],
    minutes: hour * 60 + Number(parts.minute),
  };
}

function getNextOpening(day) {
  for (let offset = 1; offset <= 7; offset += 1) {
    const nextDay = (day + offset) % 7;
    if (schedule[nextDay].length) {
      return `${dayNames[nextDay]} um ${schedule[nextDay][0].start}`;
    }
  }

  return "bald";
}

function updateOpenStatus() {
  const statusText = document.querySelector("#statusText");
  const todayHours = document.querySelector("#todayHours");

  if (!statusText || !todayHours) return;

  const { day, minutes } = getBerlinParts(new Date());
  const today = schedule[day];
  todayHours.textContent = today.length
    ? today.map((slot) => `${slot.start} - ${slot.end}`).join(" / ")
    : "Ruhetag";

  const currentSlot = today.find((slot) => {
    const start = timeToMinutes(slot.start);
    const end = timeToMinutes(slot.end);
    return minutes >= start && minutes < end;
  });

  if (currentSlot) {
    statusText.textContent = `Jetzt geöffnet bis ${currentSlot.end}`;
    return;
  }

  const nextTodaySlot = today.find((slot) => minutes < timeToMinutes(slot.start));

  if (nextTodaySlot) {
    statusText.textContent = `Öffnet heute um ${nextTodaySlot.start}`;
    return;
  }

  if (!today.length) {
    statusText.textContent = `Heute Ruhetag, öffnet ${getNextOpening(day)}`;
    return;
  }

  statusText.textContent = `Geschlossen, öffnet ${getNextOpening(day)}`;
}

function getMenuPageSrc(page) {
  return `assets/menu/page-${String(page).padStart(2, "0")}.webp`;
}

function setupMenuBook() {
  const menuBook = document.querySelector("#menuBook");
  const menuImage = document.querySelector("#menuPageImage");
  const menuLabel = document.querySelector("#menuPageLabel");
  const menuInput = document.querySelector("#menuPageInput");
  const prevButtons = document.querySelectorAll("[data-menu-prev]");
  const nextButtons = document.querySelectorAll("[data-menu-next]");

  if (!menuBook || !menuImage || !menuLabel || !menuInput) return;

  let currentPage = 1;
  let isChanging = false;

  function setButtonState() {
    prevButtons.forEach((button) => {
      button.disabled = currentPage === 1;
    });
    nextButtons.forEach((button) => {
      button.disabled = currentPage === menuTotalPages;
    });
  }

  function preloadNeighborPages() {
    [currentPage - 1, currentPage + 1]
      .filter((page) => page >= 1 && page <= menuTotalPages)
      .forEach((page) => {
        const image = new Image();
        image.src = getMenuPageSrc(page);
      });
  }

  function updateMenuPage(page, direction = "next") {
    const nextPage = Math.min(Math.max(page, 1), menuTotalPages);
    if (nextPage === currentPage || isChanging) {
      menuInput.value = String(currentPage);
      setButtonState();
      return;
    }

    isChanging = true;
    currentPage = nextPage;

    menuBook.classList.remove("is-turning-next", "is-turning-prev");
    menuBook.classList.add(direction === "prev" ? "is-turning-prev" : "is-turning-next");

    menuImage.src = getMenuPageSrc(currentPage);
    menuImage.alt = `Speisekarte Seite ${currentPage}`;
    menuLabel.textContent = `Seite ${currentPage} von ${menuTotalPages}`;
    menuInput.value = String(currentPage);
    setButtonState();
    preloadNeighborPages();

    window.setTimeout(() => {
      menuBook.classList.remove("is-turning-next", "is-turning-prev");
      isChanging = false;
    }, 380);
  }

  prevButtons.forEach((button) => {
    button.addEventListener("click", () => updateMenuPage(currentPage - 1, "prev"));
  });

  nextButtons.forEach((button) => {
    button.addEventListener("click", () => updateMenuPage(currentPage + 1, "next"));
  });

  menuInput.addEventListener("change", () => {
    const requestedPage = Number(menuInput.value);
    const direction = requestedPage < currentPage ? "prev" : "next";
    updateMenuPage(Number.isFinite(requestedPage) ? requestedPage : currentPage, direction);
  });

  document.addEventListener("keydown", (event) => {
    const isMenuFocused = menuBook.contains(document.activeElement);
    const rect = menuBook.getBoundingClientRect();
    const isMenuVisible = rect.top < window.innerHeight && rect.bottom > 0;

    if (!isMenuFocused && !isMenuVisible) return;

    if (event.key === "ArrowLeft") updateMenuPage(currentPage - 1, "prev");
    if (event.key === "ArrowRight") updateMenuPage(currentPage + 1, "next");
  });

  setButtonState();
  preloadNeighborPages();
}

updateOpenStatus();
setupMenuBook();

const orderForm = document.querySelector("#orderForm");

if (orderForm) {
  orderForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!orderForm.reportValidity()) return;

    const formData = new FormData(orderForm);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const pickup = String(formData.get("pickup") || "").trim();
    const items = String(formData.get("items") || "").trim();
    const notes = String(formData.get("notes") || "").trim();

    const message = [
      "Hallo Hong Mi,",
      "",
      "ich möchte gerne bestellen:",
      items,
      "",
      `Abholzeit: ${pickup}`,
      name ? `Name: ${name}` : "",
      phone ? `Telefon: ${phone}` : "",
      notes ? `Hinweise: ${notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });
}

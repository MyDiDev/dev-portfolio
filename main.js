/* ==========================================================================
   INTERACTIVE LOGIC & ANIMATIONS SYSTEM
   STACK: GSAP + ScrollTrigger (Loaded via CDN in index.html)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  // 0. INITIALIZE THEME CONTROL
  initThemeToggle();

  // 1. REGISTER GSAP PLUGINS
  if (typeof gsap !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    initScrollAnimations();
    initMetricCounters();
    initSectionTitleTyping();
  } else {
    console.warn(
      "GSAP library not detected. Running fallback static transitions.",
    );
    // Fallback layout activation
    document.querySelectorAll(".section-fade").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  }

  // 2. RUN OTHER COMPONENTS
  initProjectCatalogDrawers();
  initCollaborationForm();
  initLiveTelemetry();
  initTypingAnimation();
});

/**
 * GSAP Scroll-Triggered Animations for Page Sections
 */
function initScrollAnimations() {
  // Animate overall page loading
  gsap.to(".sheet-container", {
    opacity: 1,
    duration: 0.8,
    ease: "power2.out",
  });

  // Fade and slide up sections as they enter viewport
  const sections = gsap.utils.toArray(".section-fade");
  sections.forEach((section) => {
    gsap.to(section, {
      scrollTrigger: {
        trigger: section,
        start: "top 85%",
        toggleActions: "play none none none",
      },
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.15,
    });
  });

  // Subtle parallax on the background watermark grid
  gsap.to(".watermark-grid", {
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: true,
    },
    y: -30,
    ease: "none",
  });
}

/**
 * Animated number tickers for performance metrics (Micro-animations)
 */
function initMetricCounters() {
  // Scrapes numerical percentages/ratings inside the visible tables and rolls them up
  const ratings = document.querySelectorAll(
    ".parameters-table:not(.mini-specs) .param-val",
  );

  ratings.forEach((rating) => {
    const text = rating.textContent.trim();
    if (text.endsWith("%") && !isNaN(parseFloat(text))) {
      const finalValue = parseFloat(text);
      const targetCell = rating;

      targetCell.textContent = "0%";

      gsap.to(targetCell, {
        scrollTrigger: {
          trigger: targetCell,
          start: "top 90%",
          toggleActions: "play none none none",
        },
        duration: 1.5,
        ease: "power2.out",
        onUpdate: function () {
          const progress = this.progress();
          const currentValue = Math.floor(progress * finalValue);
          targetCell.textContent = `${currentValue}%`;
        },
        onComplete: function () {
          targetCell.textContent = `${finalValue}%`;
        },
      });
    }
  });
}

/**
 * Animated tickers for drawer metrics when expanded
 */
function animateDrawerMetrics(drawer) {
  const ratings = drawer.querySelectorAll(".mini-specs .param-val");
  ratings.forEach((rating) => {
    const text = rating.textContent.trim();
    if (text.endsWith("%") && !isNaN(parseFloat(text))) {
      const finalValue = parseFloat(text);
      const targetCell = rating;

      targetCell.textContent = "0%";

      gsap.to(targetCell, {
        duration: 1.0,
        ease: "power1.out",
        onUpdate: function () {
          const progress = this.progress();
          const currentValue = Math.floor(progress * finalValue);
          targetCell.textContent = `${currentValue}%`;
        },
        onComplete: function () {
          targetCell.textContent = `${finalValue}%`;
        },
      });
    }
  });
}

/**
 * Expandable Project Spec Registry (Accordion Drawers)
 */
function initProjectCatalogDrawers() {
  const registryItems = document.querySelectorAll(".registry-item");

  registryItems.forEach((item) => {
    const header = item.querySelector(".registry-header-row");
    const btnText = item.querySelector(".proj-trigger-btn");
    const drawer = item.querySelector(".registry-body-drawer");

    header.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      // Close other active drawers to maintain high readability focus
      registryItems.forEach((otherItem) => {
        if (otherItem !== item && otherItem.classList.contains("active")) {
          otherItem.classList.remove("active");
          const otherBtn = otherItem.querySelector(".proj-trigger-btn");
          const otherDrawer = otherItem.querySelector(".registry-body-drawer");
          otherBtn.textContent = "[VER_DETALLES]";
          otherDrawer.setAttribute("aria-hidden", "true");
        }
      });

      // Toggle current drawer
      if (isActive) {
        item.classList.remove("active");
        btnText.textContent = "[VER_DETALLES]";
        drawer.setAttribute("aria-hidden", "true");
      } else {
        item.classList.add("active");
        btnText.textContent = "[OCULTAR_DETALLES]";
        drawer.setAttribute("aria-hidden", "false");

        // GSAP drawer load sequence (slide components down)
        gsap.fromTo(
          drawer.querySelectorAll(".spec-detail-block, .spec-metric-block"),
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.1,
            ease: "power2.out",
            onComplete: () => {
              animateDrawerMetrics(drawer);
            },
          },
        );
      }
    });

    // Accessibility support
    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        header.click();
      }
    });
  });
}

/**
 * Request Inquiry Form Handler with EmailJS Integration & Success Modal
 */
function initCollaborationForm() {
  const form = document.getElementById("contact-form");
  const statusIndicator = document.getElementById("form-status-indicator");
  const submitBtn = document.getElementById("btn-submit-inquiry");
  const timestampLabel = document.getElementById("voucher-timestamp");

  // Dynamic timestamp updating
  if (timestampLabel) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    timestampLabel.textContent = `${year}.${month}.${day} // UTC_SYS`;
  }

  // Bind modal event listeners (close buttons, overlay click, escape key)
  initSuccessModalEvents();

  if (!form) return;

  // CONFIGURACIÓN DE VARIABLES DE ENTORNO (Cargadas desde config.js)
  const EMAILJS_PUBLIC_KEY =
    (window.CONFIG && window.CONFIG.EMAILJS_PUBLIC_KEY) || "YOUR_PUBLIC_KEY";
  const EMAILJS_SERVICE_ID =
    (window.CONFIG && window.CONFIG.EMAILJS_SERVICE_ID) || "YOUR_SERVICE_ID";
  const EMAILJS_TEMPLATE_ID =
    (window.CONFIG && window.CONFIG.EMAILJS_TEMPLATE_ID) || "YOUR_TEMPLATE_ID";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Actualizar campos ocultos de fecha, hora y día exactos
    updateFormTimestamps();

    // Bloquear el formulario durante el envío
    submitBtn.disabled = true;
    submitBtn.textContent = "[ENVIANDO_SOLICITUD...]";
    statusIndicator.textContent = "ESTADO: TRANSMITIENDO_DATOS";
    statusIndicator.style.color = "var(--color-primary)";

    const txId = "TX-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    // Si EmailJS está listo y se configuraron las llaves reales:
    if (
      typeof emailjs !== "undefined" &&
      EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY"
    ) {
      try {
        await emailjs.sendForm(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          form,
          EMAILJS_PUBLIC_KEY
        );

        statusIndicator.textContent = "ESTADO: ENVÍO_EXITOSO // CORREO_ENVIADO";
        statusIndicator.style.color = "green";
        submitBtn.textContent = "[SOLICITUD_ENVIADA]";
        form.reset();
        
        // Abrir modal estilizado de confirmación
        openSuccessModal(txId);
      } catch (error) {
        console.error("Error al enviar correo con EmailJS:", error);
        statusIndicator.textContent = "ESTADO: ERROR_ENVÍO // REINTENTAR";
        statusIndicator.style.color = "red";
        submitBtn.textContent = "[ERROR_EN_ENVÍO]";
      } finally {
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = "[ENVIAR_SOLICITUD_DE_PROYECTO]";
          statusIndicator.textContent = "ESTADO: ESPERANDO_DATOS";
          statusIndicator.style.color = "";
        }, 4000);
      }
    } else {
      // Modo simulación (funciona automáticamente mientras configuras tus llaves en EmailJS)
      setTimeout(() => {
        gsap.to(form, {
          opacity: 0.6,
          duration: 0.25,
          yoyo: true,
          repeat: 1,
          ease: "power1.inOut",
          onComplete: () => {
            statusIndicator.textContent = `ESTADO: MODO_PRUEBA_OK // ID: ${txId}`;
            statusIndicator.style.color = "green";
            submitBtn.textContent = "[SOLICITUD_ENVIADA]";
            form.reset();
            
            // Abrir modal de confirmación
            openSuccessModal(txId);

            setTimeout(() => {
              submitBtn.disabled = false;
              submitBtn.textContent = "[ENVIAR_SOLICITUD_DE_PROYECTO]";
              statusIndicator.textContent = "ESTADO: ESPERANDO_DATOS";
              statusIndicator.style.color = "";
              gsap.to(form, { opacity: 1, duration: 0.3 });
            }, 4000);
          }
        });
      }, 1000);
    }
  });
}

/**
 * Populates hidden form inputs with current date, time and day before sending
 */
function updateFormTimestamps() {
  const now = new Date();
  
  const optionsDay = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDay = now.toLocaleDateString('es-ES', optionsDay);
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dateNum = String(now.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${dateNum}`;
  
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const formattedTime = `${hours}:${minutes}:${seconds}`;

  const dayInput = document.getElementById('input-submission-day');
  const dateInput = document.getElementById('input-submission-date');
  const timeInput = document.getElementById('input-submission-time');
  const yearInput = document.getElementById('input-submission-year');

  if (dayInput) dayInput.value = formattedDay;
  if (dateInput) dateInput.value = formattedDate;
  if (timeInput) timeInput.value = formattedTime;
  if (yearInput) yearInput.value = year;
}

/**
 * Control Modal Logic & Event Handlers
 */
function openSuccessModal(txId) {
  const modal = document.getElementById("modal-success");
  const receiptIdEl = document.getElementById("modal-receipt-id");
  const receiptTimeEl = document.getElementById("modal-receipt-time");

  if (!modal) return;

  if (receiptIdEl) receiptIdEl.textContent = txId;
  if (receiptTimeEl) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    receiptTimeEl.textContent = `${year}.${month}.${day} // ${hours}:${minutes} UTC`;
  }

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");

  // Animate modal container entrance with GSAP if available
  if (typeof gsap !== "undefined") {
    gsap.fromTo(
      ".modal-container",
      { scale: 0.9, opacity: 0, y: 15 },
      { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.4)" }
    );
  }
}

function closeSuccessModal() {
  const modal = document.getElementById("modal-success");
  if (!modal) return;

  if (typeof gsap !== "undefined") {
    gsap.to(".modal-container", {
      scale: 0.92,
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
      }
    });
  } else {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }
}

function initSuccessModalEvents() {
  const closeBtn = document.getElementById("btn-close-modal");
  const confirmBtn = document.getElementById("btn-confirm-modal");
  const modalOverlay = document.getElementById("modal-success");

  if (closeBtn) closeBtn.addEventListener("click", closeSuccessModal);
  if (confirmBtn) confirmBtn.addEventListener("click", closeSuccessModal);

  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeSuccessModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay && modalOverlay.classList.contains("active")) {
      closeSuccessModal();
    }
  });
}

/**
 * Simulated Live System Telemetry in Footer
 */
function initLiveTelemetry() {
  const log = document.getElementById("telemetry-log");
  if (!log) return;

  const statuses = [
    "TELEMETRÍA: OK_200 // SISTEMA_ESTABLE",
    "TELEMETRÍA: CPU_NORMAL // LATENCIA_RED: 12ms",
    "TELEMETRÍA: BASE_DATOS_SEGURA // SUPABASE_LISTO",
    "TELEMETRÍA: MONITOREO_ACTIVO // REV_1.0.4",
    "TELEMETRÍA: OK_200 // DISEÑO_ALINEADO",
  ];

  setInterval(() => {
    // Randomly pick a system status to print
    const index = Math.floor(Math.random() * statuses.length);

    // Subtle fade transition for logging
    gsap.to(log, {
      opacity: 0.3,
      duration: 0.15,
      onComplete: () => {
        log.textContent = statuses[index];
        gsap.to(log, { opacity: 1, duration: 0.2 });
      },
    });
  }, 8000);
}

/**
 * Theme Toggle and Preference Management
 */
function initThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle-btn");
  if (!toggleBtn) return;

  // Check localStorage or document attribute (set by head script) to align button text
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  setTheme(isDark ? "dark" : "light");

  toggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  });

  // Support accessibility key presses (Enter / Space)
  toggleBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleBtn.click();
    }
  });
}

function setTheme(theme) {
  const toggleBtn = document.getElementById("theme-toggle-btn");
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
    if (toggleBtn) toggleBtn.textContent = "[MODO_OSCURO]";
  } else {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
    if (toggleBtn) toggleBtn.textContent = "[MODO_CLARO]";
  }
}

/**
 * Technical typewriter animation for page headers simulating system boot
 */
function initTypingAnimation() {
  const titleEl = document.querySelector(".main-title");
  if (!titleEl) return;

  const originalText = titleEl.textContent;
  titleEl.textContent = "";
  titleEl.style.visibility = "visible";
  titleEl.classList.add("typing-cursor");

  let charIndex = 0;
  const typingSpeed = 50; // Milliseconds per character

  function type() {
    if (charIndex < originalText.length) {
      titleEl.textContent += originalText.charAt(charIndex);
      charIndex++;
      setTimeout(type, typingSpeed);
    } else {
      // Keep cursor blinking for 2 seconds after completion, then remove
      setTimeout(() => {
        titleEl.classList.remove("typing-cursor");
      }, 2000);
    }
  }

  // Delayed activation to match page load entry transitions
  setTimeout(type, 500);
}

/**
 * Technical typewriter animation for section titles when scrolled into view
 */
function initSectionTitleTyping() {
  const titles = document.querySelectorAll(".section-title");

  titles.forEach((title) => {
    const originalText = title.textContent.trim();
    title.textContent = "";
    title.style.visibility = "visible";

    ScrollTrigger.create({
      trigger: title,
      start: "top 90%",
      onEnter: () => {
        let charIndex = 0;
        title.classList.add("typing-cursor");

        function type() {
          if (charIndex < originalText.length) {
            title.textContent += originalText.charAt(charIndex);
            charIndex++;
            setTimeout(type, 30); // Fast typing speed for section titles (30ms)
          } else {
            // Deactivate cursor after 1s
            setTimeout(() => {
              title.classList.remove("typing-cursor");
            }, 1000);
          }
        }
        type();
      },
      once: true, // Trigger only once per load
    });
  });
}

// Berry Systems – kleine Helfer für Menü und Animationen. Keine Bibliotheken, keine Datenübertragung.
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Kopfzeile: Linie beim Scrollen
  var head = document.querySelector(".site-head");
  function onScroll() { if (head) head.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Menü auf dem Handy
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) { menu.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Einblenden beim Scrollen
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // Zahlen hochzählen
  var counters = document.querySelectorAll("[data-count]");
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (reduce || target === 0) { el.textContent = target; return; }
    var start = null, dur = 1400;
    function tick(t) {
      if (!start) start = t;
      var p = Math.min(1, (t - start) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    }
    el.textContent = "0";
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); co.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  }

  // Arbeitsweise: Linie wächst mit dem Scrollen
  var steps = document.getElementById("steps");
  if (steps) {
    var bar = steps.querySelector(".line i");
    var stepEls = steps.querySelectorAll(".step");
    var ticking = false;
    var update = function () {
      ticking = false;
      var r = steps.getBoundingClientRect();
      var mark = window.innerHeight * 0.62;
      var p = Math.max(0, Math.min(1, (mark - r.top) / r.height));
      bar.style.height = (p * 100) + "%";
      stepEls.forEach(function (s) {
        s.classList.toggle("lit", s.getBoundingClientRect().top + 28 < mark);
      });
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  // Beispielrechnung: Positionen erscheinen, Summe zählt, Stempel
  var invoice = document.getElementById("invoice");
  if (invoice) {
    var rows = invoice.querySelectorAll(".row");
    var sumEl = document.getElementById("sum");
    var stamp = document.getElementById("stamp");
    var qr = document.getElementById("qr");
    var amounts = [9500, 3800, 1200];
    var timers = [];

    // Dekorativer Code (kein echter GiroCode)
    if (qr) {
      var seed = 7, svg = "";
      function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
      function finder(x, y) {
        return '<rect x="' + x + '" y="' + y + '" width="7" height="7"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" style="fill:var(--card)"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3"/>';
      }
      for (var y = 0; y < 25; y++) for (var x = 0; x < 25; x++) {
        var inFinder = (x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16);
        if (!inFinder && rnd() > 0.52) svg += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
      }
      qr.innerHTML = svg + finder(0, 0) + finder(18, 0) + finder(0, 18);
    }

    function euro(c) {
      var s = (c / 100).toFixed(2).split(".");
      return s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + s[1] + " €";
    }
    function animateSum(from, to) {
      if (reduce) { sumEl.textContent = euro(to); return; }
      var start = null;
      function tick(t) {
        if (!start) start = t;
        var p = Math.min(1, (t - start) / 420);
        sumEl.textContent = euro(Math.round(from + (to - from) * p));
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    function play() {
      timers.forEach(clearTimeout); timers = [];
      rows.forEach(function (r) { r.classList.add("pending"); });
      stamp.classList.remove("on"); invoice.classList.remove("qr-on");
      sumEl.textContent = euro(0);
      if (reduce) {
        rows.forEach(function (r) { r.classList.remove("pending"); });
        sumEl.textContent = euro(14500); invoice.classList.add("qr-on"); stamp.classList.add("on");
        return;
      }
      var total = 0;
      rows.forEach(function (r, i) {
        timers.push(setTimeout(function () {
          r.classList.remove("pending");
          var before = total; total += amounts[i];
          animateSum(before, total);
        }, 700 + i * 650));
      });
      timers.push(setTimeout(function () { invoice.classList.add("qr-on"); }, 700 + rows.length * 650 + 200));
      timers.push(setTimeout(function () { void stamp.offsetWidth; stamp.classList.add("on"); }, 700 + rows.length * 650 + 700));
    }
    play();
    var replay = document.getElementById("replay");
    if (replay) replay.addEventListener("click", play);
  }
})();

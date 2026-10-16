// Berry Systems – Menü und Animationen. Keine Bibliotheken, keine Datenübertragung.
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;

  // Kopfzeile: Hintergrund beim Scrollen
  var head = document.querySelector(".site-head");
  function onScroll() { if (head) head.classList.toggle("scrolled", window.scrollY > 10); }
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

  // Überschrift Wort für Wort einblenden (Text bleibt für Screenreader unverändert lesbar)
  document.querySelectorAll("[data-words]").forEach(function (h) {
    if (reduce) return;
    var i = 0;
    function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement("span");
            s.className = "w"; s.textContent = part; s.style.animationDelay = (0.12 + i++ * 0.08) + "s";
            frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          if (n.classList.contains("serif")) { n.classList.add("w"); n.style.animationDelay = (0.12 + i++ * 0.08) + "s"; }
          else wrap(n);
        }
      });
    }
    wrap(h);
  });

  // Einblenden beim Scrollen
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // Lichtfleck auf Karten folgt der Maus
  if (fine) {
    document.querySelectorAll("[data-spot]").forEach(function (c) {
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty("--mx", (e.clientX - r.left) + "px");
        c.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  // Bühne im Hero: leichte Parallaxe zur Maus
  var stage = document.getElementById("stage");
  if (stage && fine && !reduce && window.innerWidth > 860) {
    var floats = stage.querySelectorAll(".float");
    var hero = document.querySelector(".hero");
    hero.addEventListener("pointermove", function (e) {
      var x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
      floats.forEach(function (f) {
        var d = parseFloat(f.getAttribute("data-depth")) || 10;
        f.style.transform = "translate(" + (-x * d) + "px," + (-y * d) + "px)";
      });
    });
  }

  // Zahlen hochzählen
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (reduce || target === 0) { el.textContent = target; return; }
    var start = null;
    function tick(t) {
      if (!start) start = t;
      var p = Math.min(1, (t - start) / 1400);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    }
    el.textContent = "0"; requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); co.unobserve(en.target); } });
    }, { threshold: 0.6 });
    document.querySelectorAll("[data-count]").forEach(function (el) { co.observe(el); });
  }

  // Ablauf: Fortschrittsbalken und Schritte leuchten beim Scrollen auf
  var steps = document.getElementById("steps");
  var bar = document.getElementById("progress");
  if (steps && bar) {
    var stepEls = steps.querySelectorAll(".step");
    var ticking = false;
    var update = function () {
      ticking = false;
      var r = steps.getBoundingClientRect();
      var mark = window.innerHeight * 0.75;
      var p = Math.max(0, Math.min(1, (mark - r.top) / (r.height + window.innerHeight * 0.25)));
      bar.style.width = (p * 100) + "%";
      stepEls.forEach(function (s, i) { s.classList.toggle("lit", p >= (i + 0.5) / stepEls.length || (window.innerWidth < 900 && s.getBoundingClientRect().top < mark)); });
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  // Automationskarte: Schritte nacheinander abhaken, in Schleife
  var flow = document.getElementById("flow");
  if (flow) {
    var nodes = flow.querySelectorAll(".node");
    if (reduce) nodes.forEach(function (n) { n.classList.add("done"); });
    else {
      var k = 0;
      setInterval(function () {
        if (k === nodes.length) { nodes.forEach(function (n) { n.classList.remove("done"); }); k = 0; return; }
        nodes[k++].classList.add("done");
      }, 1100);
    }
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
      var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      var finder = function (x, y) {
        return '<rect x="' + x + '" y="' + y + '" width="7" height="7"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" style="fill:#fff"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3"/>';
      };
      for (var y = 0; y < 25; y++) for (var x = 0; x < 25; x++) {
        var inFinder = (x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16);
        if (!inFinder && rnd() > 0.52) svg += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
      }
      qr.innerHTML = svg + finder(0, 0) + finder(18, 0) + finder(0, 18);
    }

    var euro = function (c) {
      var s = (c / 100).toFixed(2).split(".");
      return s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + s[1] + " €";
    };
    var animateSum = function (from, to) {
      if (reduce) { sumEl.textContent = euro(to); return; }
      var start = null;
      var tick = function (t) {
        if (!start) start = t;
        var p = Math.min(1, (t - start) / 420);
        sumEl.textContent = euro(Math.round(from + (to - from) * p));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    var play = function () {
      timers.forEach(clearTimeout); timers = [];
      rows.forEach(function (r) { r.classList.add("pending"); });
      stamp.classList.remove("on"); invoice.classList.remove("qr-on");
      sumEl.textContent = euro(0);
      if (reduce) {
        rows.forEach(function (r) { r.classList.remove("pending"); });
        sumEl.textContent = euro(14500); invoice.classList.add("qr-on"); stamp.classList.add("on");
        return;
      }
      var total = 0, base = 1500;
      rows.forEach(function (r, i) {
        timers.push(setTimeout(function () {
          r.classList.remove("pending");
          var before = total; total += amounts[i];
          animateSum(before, total);
        }, base + i * 650));
      });
      timers.push(setTimeout(function () { invoice.classList.add("qr-on"); }, base + rows.length * 650 + 200));
      timers.push(setTimeout(function () { void stamp.offsetWidth; stamp.classList.add("on"); }, base + rows.length * 650 + 700));
    };
    play();
    var replay = document.getElementById("replay");
    if (replay) replay.addEventListener("click", play);
  }
})();

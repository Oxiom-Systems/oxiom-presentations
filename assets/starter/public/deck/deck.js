(() => {
  "use strict";

  const slides = [...document.querySelectorAll(".slide")];
  const overview = document.getElementById("overview-dialog");
  const overviewGrid = document.getElementById("overview-grid");
  const notesPanel = document.getElementById("notes-panel");
  const notesTitle = document.getElementById("notes-title");
  const notesContent = document.getElementById("notes-content");
  const notesDuration = document.getElementById("notes-duration");
  const currentSlideLabel = document.getElementById("current-slide");
  const totalSlidesLabel = document.getElementById("total-slides");
  const currentTitle = document.getElementById("current-title");
  const progressBar = document.getElementById("progress-bar");
  const previousButton = document.querySelector('[data-action="previous"]');
  const nextButton = document.querySelector('[data-action="next"]');
  const helpToast = document.getElementById("help-toast");
  const slideVideos = [...document.querySelectorAll("[data-slide-video]")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scriptGlobal =
    document.body.dataset.scriptGlobal || "OXIOM_PRESENTATION_SCRIPT";
  const presenterScript = window[scriptGlobal] || [];
  const presenterScriptUrl =
    document.body.dataset.presenterScript || "./presenter-script.html";
  const storageKey =
    document.body.dataset.storageKey || "oxiom-presentation-slide-index";
  const channelName =
    document.body.dataset.channel || "oxiom-presentation";
  const deckTitle =
    document.body.dataset.deckTitle || "Oxiom Presentation";
  const audienceSender = `${channelName}-audience`;
  const presenterSender = `${channelName}-presenter`;
  const stepMode = document.body.dataset.stepMode || "reveal";
  const audienceMode =
    new URLSearchParams(location.search).get("audience") === "1";

  document.body.classList.toggle("audience-mode", audienceMode);

  let presenterChannel = null;
  try {
    if ("BroadcastChannel" in window) {
      presenterChannel = new BroadcastChannel(channelName);
    }
  } catch {
    // Direct window messaging remains available for file:// decks.
  }
  const audienceId =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `audience-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  let index = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let helpTimer;
  let presenterWindow = null;
  let audienceWindow = null;

  const pad = (number) => String(number).padStart(2, "0");
  const activeSlide = () => slides[index];
  const revealItems = (slide = activeSlide()) => [...slide.querySelectorAll("[data-reveal]")];
  const revealedItems = (slide = activeSlide()) =>
    revealItems(slide).filter((item) => item.classList.contains("is-revealed"));

  function postToPresenter(message) {
    const payload = { ...message, audienceId };
    const targets = [
      ...new Set([window.opener, presenterWindow].filter(Boolean)),
    ];
    let sentDirectly = false;
    targets.forEach((target) => {
      try {
        if (target.closed) return;
        target.postMessage(
          { ...payload, sender: audienceSender },
          "*",
        );
        sentDirectly = true;
      } catch {
        // Fall through to BroadcastChannel below.
      }
    });
    if (sentDirectly) return;

    try {
      presenterChannel?.postMessage(payload);
    } catch {
      // localStorage still preserves the selected slide for the next reload.
    }
  }

  function syncSlideVideos({ restart = false } = {}) {
    slideVideos.forEach((video) => {
      const isActive =
        video.closest(".slide") === activeSlide();

      if (!isActive) {
        video.pause();
        try {
          video.currentTime = 0;
        } catch {
          // No reset is needed before metadata is available.
        }
        return;
      }

      if (restart) {
        try {
          video.currentTime = 0;
        } catch {
          // The poster remains visible until the video metadata is ready.
        }
      }

      if (reducedMotion || document.hidden) {
        video.pause();
        return;
      }

      if (video.ended && !restart) return;
      video.play().catch(() => {
        // Muted inline playback is normally allowed; the poster is the fallback.
      });
    });
  }

  function syncNarrationFocus({ restart = false } = {}) {
    const slide = activeSlide();
    slides.forEach((candidate) => {
      if (candidate !== slide) {
        candidate.classList.remove("is-narration-active");
      }
    });

    if (
      reducedMotion ||
      !slide.querySelector("[data-narration-focus]")
    ) {
      slide.classList.remove("is-narration-active");
      return;
    }

    if (restart) {
      slide.classList.remove("is-narration-active");
      void slide.offsetWidth;
    }
    slide.classList.add("is-narration-active");
  }

  function revealFirst(slide = activeSlide()) {
    const items = revealItems(slide);
    if (!items.length) return;
    window.setTimeout(
      () => {
        items[0].classList.add("is-revealed");
      },
      reducedMotion ? 0 : 120,
    );
  }

  function revealNext() {
    const items = revealItems();
    const next = items.find((item) => !item.classList.contains("is-revealed"));

    if (next) {
      next.classList.add("is-revealed");
      updateChrome();
      return true;
    }

    return false;
  }

  function revealAll(slide = activeSlide()) {
    revealItems(slide).forEach((item) => item.classList.add("is-revealed"));
  }

  function hideLastReveal() {
    const revealed = revealedItems();
    if (revealed.length <= 1) return false;
    revealed.at(-1).classList.remove("is-revealed");
    updateChrome();
    return true;
  }

  function setSlide(nextIndex, { reveal = "first", updateHash = true } = {}) {
    const bounded = Math.max(0, Math.min(slides.length - 1, nextIndex));
    const oldIndex = index;
    const oldSlide = slides[oldIndex];

    if (bounded !== oldIndex) {
      oldSlide.classList.remove("is-active");
      oldSlide.classList.toggle("was-active", bounded > oldIndex);
      oldSlide.setAttribute("aria-hidden", "true");

      index = bounded;
      const nextSlide = activeSlide();
      nextSlide.classList.remove("was-active");
      nextSlide.classList.add("is-active");
      nextSlide.setAttribute("aria-hidden", "false");

      revealItems(nextSlide).forEach((item) => item.classList.remove("is-revealed"));
      if (reveal === "all") revealAll(nextSlide);
      else revealFirst(nextSlide);
    } else if (reveal === "all") {
      revealAll(activeSlide());
    } else if (revealedItems().length === 0) {
      revealFirst(activeSlide());
    }

    updateChrome();
    syncSlideVideos({ restart: bounded !== oldIndex });
    syncNarrationFocus({ restart: bounded !== oldIndex });

    if (updateHash) {
      history.replaceState(null, "", `#slide-${index + 1}`);
    }

    try {
      localStorage.setItem(storageKey, String(index));
    } catch {
      // Direct window messaging remains available for local file presentations.
    }
    postToPresenter({ type: "slide-change", index });
  }

  function next() {
    if (stepMode === "slide") {
      if (index < slides.length - 1) {
        setSlide(index + 1, { reveal: "all" });
      }
      return;
    }

    if (revealNext()) return;
    if (index < slides.length - 1) setSlide(index + 1);
  }

  function previous() {
    if (stepMode === "slide") {
      if (index > 0) {
        setSlide(index - 1, { reveal: "all" });
      }
      return;
    }

    if (hideLastReveal()) return;
    if (index > 0) setSlide(index - 1, { reveal: "all" });
  }

  function updateChrome() {
    const slide = activeSlide();
    const title = slide.dataset.title || `Slide ${index + 1}`;
    const script = presenterScript[index];
    const notes =
      script?.paragraphs ||
      [slide.querySelector(".speaker-notes")?.textContent.trim() || "No script for this slide."];

    currentSlideLabel.textContent = pad(index + 1);
    totalSlidesLabel.textContent = pad(slides.length);
    currentTitle.textContent = title;
    progressBar.style.width = `${((index + 1) / slides.length) * 100}%`;
    previousButton.disabled = index === 0 && revealedItems().length <= 1;
    nextButton.disabled = index === slides.length - 1 && revealItems().every((item) => item.classList.contains("is-revealed"));
    notesTitle.textContent = title;
    notesDuration.textContent = script?.duration || "Reference slide";
    notesContent.innerHTML = notes.map((paragraph) => `<p>${paragraph}</p>`).join("");

    document.title = `${pad(index + 1)} · ${title} | ${deckTitle}`;
    [...overviewGrid.children].forEach((card, cardIndex) => {
      card.classList.toggle("is-current", cardIndex === index);
    });
  }

  function buildOverview() {
    const fragment = document.createDocumentFragment();

    slides.forEach((slide, slideIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "overview-card";
      button.classList.toggle("is-annex", slide.hasAttribute("data-annex"));
      button.innerHTML = `<span>${pad(slideIndex + 1)}</span><strong>${slide.dataset.title || `Slide ${slideIndex + 1}`}</strong>`;
      button.addEventListener("click", () => {
        overview.close();
        setSlide(slideIndex);
      });
      fragment.appendChild(button);
    });

    overviewGrid.appendChild(fragment);
  }

  function toggleOverview(force) {
    const shouldOpen = typeof force === "boolean" ? force : !overview.open;
    if (shouldOpen && !overview.open) overview.showModal();
    if (!shouldOpen && overview.open) overview.close();
  }

  function toggleNotes(force) {
    const shouldOpen =
      typeof force === "boolean" ? force : !notesPanel.classList.contains("is-open");
    notesPanel.classList.toggle("is-open", shouldOpen);
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      showHelp();
    }
  }

  function showHelp() {
    window.clearTimeout(helpTimer);
    helpToast.classList.add("is-visible");
    helpTimer = window.setTimeout(() => helpToast.classList.remove("is-visible"), 3800);
  }

  function openPresenterView() {
    presenterWindow = window.open(
      `${presenterScriptUrl}#script-slide-${index + 1}`,
      `${channelName}-presenter-script`,
    );
    presenterWindow?.focus();
    if (!presenterWindow) showHelp();
  }

  function openAudienceView() {
    const audienceUrl = new URL(location.href);
    audienceUrl.searchParams.set("audience", "1");
    audienceUrl.hash = `slide-${index + 1}`;
    audienceWindow = window.open(
      audienceUrl.href,
      `${channelName}-audience`,
      "popup=yes,width=1280,height=720",
    );
    audienceWindow?.focus();
    if (!audienceWindow) showHelp();
  }

  function handleAction(action) {
    const handlers = {
      next,
      previous,
      overview: () => toggleOverview(),
      "close-overview": () => toggleOverview(false),
      notes: () => toggleNotes(),
      "close-notes": () => toggleNotes(false),
      fullscreen: toggleFullscreen,
      script: openPresenterView,
      audience: openAudienceView,
      annex: () => {
        const annexIndex = slides.findIndex((slide) => slide.hasAttribute("data-annex"));
        if (annexIndex >= 0) setSlide(annexIndex);
      },
    };

    handlers[action]?.();
  }

  document.addEventListener("click", (event) => {
    const control = event.target.closest("[data-action]");
    if (control) {
      handleAction(control.dataset.action);
      return;
    }

    if (!audienceMode || event.button !== 0 || event.defaultPrevented) {
      return;
    }
    if (
      overview.open ||
      notesPanel.classList.contains("is-open") ||
      event.target.closest(
        "a, button, input, select, textarea, label, canvas, dialog, [contenteditable], [data-no-advance]",
      )
    ) {
      return;
    }
    next();
  });

  document.addEventListener("keydown", (event) => {
    const tag = event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if (overview.open && event.key !== "Escape" && event.key.toLowerCase() !== "o") return;

    const key = event.key.toLowerCase();
    const forward = ["arrowright", "arrowdown", " ", "pagedown", "enter"];
    const backward = ["arrowleft", "arrowup", "pageup", "backspace"];

    if (forward.includes(key)) {
      event.preventDefault();
      next();
    } else if (backward.includes(key)) {
      event.preventDefault();
      previous();
    } else if (key === "home") {
      event.preventDefault();
      setSlide(0);
    } else if (key === "end") {
      event.preventDefault();
      setSlide(slides.length - 1);
    } else if (key === "o") {
      event.preventDefault();
      toggleOverview();
    } else if (key === "n") {
      event.preventDefault();
      toggleNotes();
    } else if (key === "p") {
      event.preventDefault();
      openPresenterView();
    } else if (key === "a" && !audienceMode) {
      event.preventDefault();
      openAudienceView();
    } else if (key === "f") {
      event.preventDefault();
      toggleFullscreen();
    } else if (key === "?" || key === "h") {
      showHelp();
    } else if (key === "escape") {
      toggleNotes(false);
      toggleOverview(false);
    }
  });

  document.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    },
    { passive: true },
  );

  document.addEventListener(
    "touchend",
    (event) => {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;

      if (Math.abs(deltaX) < 52 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
      if (deltaX < 0) next();
      else previous();
    },
    { passive: true },
  );

  window.addEventListener("hashchange", () => {
    const hashIndex = Number.parseInt(location.hash.replace("#slide-", ""), 10) - 1;
    if (Number.isInteger(hashIndex)) {
      setSlide(hashIndex, {
        updateHash: false,
        reveal: stepMode === "slide" ? "all" : "first",
      });
    }
  });

  document.addEventListener("visibilitychange", () => {
    syncSlideVideos();
  });

  function handlePresenterMessage(data) {
    if (!data || typeof data !== "object") return;

    if (data.type === "set-slide") {
      const nextIndex = Number.parseInt(String(data.index), 10);
      if (Number.isInteger(nextIndex)) {
        setSlide(nextIndex, { reveal: "all" });
      }
      return;
    }

    if (data.type === "restart-animation") {
      syncSlideVideos({ restart: true });
      syncNarrationFocus({ restart: true });
      postToPresenter({ type: "animation-restarted", index });
      return;
    }

    if (data.type === "presenter-ready") {
      postToPresenter({
        type: "audience-ready",
        index,
        fullscreen: Boolean(document.fullscreenElement),
      });
      postToPresenter({ type: "slide-change", index });
    }
  }

  presenterChannel?.addEventListener("message", (event) => {
    handlePresenterMessage(event.data);
  });

  window.addEventListener("message", (event) => {
    if (event.data?.sender !== presenterSender) return;
    const knownPresenter = window.opener || presenterWindow;
    if (
      knownPresenter &&
      event.source &&
      event.source !== knownPresenter
    ) {
      return;
    }
    if (event.source) presenterWindow = event.source;
    handlePresenterMessage(event.data);
  });

  document.addEventListener("fullscreenchange", () => {
    postToPresenter({
      type: "fullscreen-change",
      fullscreen: Boolean(document.fullscreenElement),
    });
  });

  window.addEventListener("pagehide", () => {
    postToPresenter({ type: "audience-closing", index });
  });

  slides.forEach((slide, slideIndex) => {
    slide.setAttribute("aria-label", `Slide ${slideIndex + 1} of ${slides.length}: ${slide.dataset.title || ""}`);
    slide.setAttribute("aria-hidden", slideIndex === 0 ? "false" : "true");
  });

  buildOverview();

  const requestedIndex = Number.parseInt(location.hash.replace("#slide-", ""), 10) - 1;
  if (Number.isInteger(requestedIndex) && requestedIndex >= 0 && requestedIndex < slides.length) {
    setSlide(requestedIndex, {
      updateHash: false,
      reveal:
        stepMode === "slide" || requestedIndex === 0
          ? "all"
          : "first",
    });
  } else {
    revealAll(slides[0]);
    updateChrome();
    syncSlideVideos({ restart: true });
    syncNarrationFocus({ restart: true });
  }

  postToPresenter({
    type: "audience-ready",
    index,
    fullscreen: Boolean(document.fullscreenElement),
  });

  if (!audienceMode) {
    window.setTimeout(showHelp, reducedMotion ? 0 : 900);
  }
})();

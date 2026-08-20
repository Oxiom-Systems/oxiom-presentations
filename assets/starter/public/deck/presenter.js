(() => {
  "use strict";

  const scriptGlobal =
    document.body.dataset.scriptGlobal || "OXIOM_PRESENTATION_SCRIPT";
  const scripts = window[scriptGlobal] || [];
  const list = document.getElementById("script-list");
  const select = document.getElementById("slide-select");
  const followToggle = document.getElementById("follow-live");
  const liveStatus = document.getElementById("live-status");
  const audienceStatus = document.getElementById("audience-status");
  const position = document.getElementById("script-position");
  const title = document.getElementById("script-title");
  const previous = document.getElementById("script-previous");
  const next = document.getElementById("script-next");
  const openAudienceButton = document.getElementById("open-audience");
  const restartButton = document.getElementById("restart-animation");
  const storageKey = document.body.dataset.storageKey || "oxiom-presentation-slide-index";
  const channelName = document.body.dataset.channel || "oxiom-presentation";
  const audienceUrl = document.body.dataset.audienceUrl || "./index.html?audience=1";
  const audienceSender = `${channelName}-audience`;
  const presenterSender = `${channelName}-presenter`;

  if (!scripts.length || !list || !select || !position || !title) {
    if (liveStatus) liveStatus.textContent = "Presenter script data is unavailable";
    return;
  }

  let channel = null;
  try {
    if ("BroadcastChannel" in window) channel = new BroadcastChannel(channelName);
  } catch {
    // Direct window messaging remains available for local file presentations.
  }

  function openerIsAudience() {
    try {
      return Boolean(
        window.opener &&
          new URLSearchParams(window.opener.location.search).get("audience") === "1",
      );
    } catch {
      return false;
    }
  }

  function storedSlide() {
    try {
      return Number.parseInt(localStorage.getItem(storageKey) || "0", 10);
    } catch {
      return 0;
    }
  }

  const hashSlide = Number.parseInt(location.hash.replace("#script-slide-", ""), 10) - 1;
  let current = Number.isInteger(hashSlide) ? hashSlide : storedSlide();
  current = Math.max(0, Math.min(scripts.length - 1, current));
  let audienceWindow = openerIsAudience() ? window.opener : null;
  let activeAudienceId = null;

  const pad = (value) => String(value).padStart(2, "0");

  function audienceWindowIsOpen() {
    try {
      return Boolean(audienceWindow && !audienceWindow.closed);
    } catch {
      return Boolean(audienceWindow);
    }
  }

  function setLiveStatus(message) {
    if (liveStatus) liveStatus.textContent = message;
  }

  function setAudienceState(state, message) {
    document.body.dataset.audienceState = state;
    if (audienceStatus) audienceStatus.textContent = message;
    if (openAudienceButton) {
      openAudienceButton.textContent =
        state === "connected" ? "Show audience screen" : "Open audience screen";
    }
    if (restartButton) {
      restartButton.disabled = state !== "connected" && !audienceWindowIsOpen();
    }
  }

  function postToAudience(message) {
    if (audienceWindowIsOpen()) {
      try {
        audienceWindow.postMessage(
          { ...message, sender: presenterSender },
          "*",
        );
      } catch {
        // The broadcast channel below remains the fallback.
      }
    }
    try {
      channel?.postMessage(message);
    } catch {
      // Shared localStorage preserves the selected slide if channels are unavailable.
    }
  }

  function buildScript() {
    const fragment = document.createDocumentFragment();

    scripts.forEach((item, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = `${pad(item.slide)} · ${item.title}`;
      select.appendChild(option);

      const article = document.createElement("article");
      article.className = "script-card";
      article.id = `script-slide-${item.slide}`;
      article.dataset.index = String(index);
      article.tabIndex = 0;

      const header = document.createElement("header");
      const number = document.createElement("span");
      const duration = document.createElement("time");
      number.textContent = `Slide ${pad(item.slide)}`;
      duration.textContent = item.duration;
      header.append(number, duration);

      const heading = document.createElement("h2");
      heading.textContent = item.title;
      const narration = document.createElement("div");
      narration.className = "read-aloud";

      item.paragraphs.forEach((paragraph) => {
        const copy = document.createElement("p");
        copy.textContent = paragraph;
        narration.appendChild(copy);
      });

      article.append(header, heading, narration);
      fragment.appendChild(article);
    });

    list.appendChild(fragment);
  }

  function setCurrent(index, { broadcast = false } = {}) {
    current = Math.max(0, Math.min(scripts.length - 1, index));
    const item = scripts[current];

    list.querySelectorAll(".script-card").forEach((card, cardIndex) => {
      const isCurrent = cardIndex === current;
      card.classList.toggle("is-current", isCurrent);
      card.setAttribute("aria-current", isCurrent ? "step" : "false");
    });

    select.value = String(current);
    position.textContent = `${pad(current + 1)} / ${pad(scripts.length)}`;
    title.textContent = item.title;
    previous.disabled = current === 0;
    next.disabled = current === scripts.length - 1;
    history.replaceState(null, "", `#script-slide-${current + 1}`);

    try {
      localStorage.setItem(storageKey, String(current));
    } catch {
      // Direct messaging remains available when local file storage is unavailable.
    }

    if (broadcast) {
      postToAudience({ type: "set-slide", index: current });
      setLiveStatus(`Audience moved to slide ${pad(current + 1)}`);
    }
  }

  function move(delta) {
    const target = current + delta;
    if (target < 0 || target >= scripts.length) return;
    setCurrent(target, { broadcast: true });
  }

  function openAudience() {
    if (audienceWindowIsOpen()) {
      audienceWindow.focus();
      postToAudience({ type: "set-slide", index: current });
      return;
    }

    const target = new URL(audienceUrl, location.href);
    target.hash = `slide-${current + 1}`;
    audienceWindow = window.open(
      target.href,
      `${channelName}-audience`,
      "popup=yes,width=1280,height=720",
    );

    if (!audienceWindow) {
      setAudienceState("blocked", "Popup blocked—allow popups and try again");
      setLiveStatus("The browser blocked the audience window");
      return;
    }

    audienceWindow.focus();
    setAudienceState("opening", "Opening and synchronizing…");
    window.setTimeout(() => {
      postToAudience({ type: "set-slide", index: current });
    }, 350);
  }

  function restartAnimation() {
    postToAudience({ type: "restart-animation", index: current });
    setLiveStatus(`Animation restarted on slide ${pad(current + 1)}`);
  }

  function handleAudienceMessage(data, sourceWindow = null) {
    if (!data || typeof data !== "object") return;

    if (data.type === "audience-ready") {
      if (sourceWindow) audienceWindow = sourceWindow;
      activeAudienceId = data.audienceId || null;
      setAudienceState(
        "connected",
        data.fullscreen ? "Connected · fullscreen" : "Connected · windowed",
      );
      setLiveStatus("Audience screen connected");
      postToAudience({ type: "set-slide", index: current });
      return;
    }

    if (activeAudienceId && data.audienceId && data.audienceId !== activeAudienceId) return;

    if (data.type === "slide-change" && (!followToggle || followToggle.checked)) {
      const nextIndex = Number.parseInt(String(data.index), 10);
      if (!Number.isInteger(nextIndex)) return;
      setCurrent(nextIndex);
      setLiveStatus(`Following audience slide ${pad(nextIndex + 1)}`);
      return;
    }

    if (data.type === "fullscreen-change") {
      setAudienceState(
        "connected",
        data.fullscreen ? "Connected · fullscreen" : "Connected · windowed",
      );
      return;
    }

    if (data.type === "audience-closing") {
      audienceWindow = null;
      activeAudienceId = null;
      setAudienceState("closed", "Audience screen closed");
    }
  }

  select.addEventListener("change", () => {
    setCurrent(Number.parseInt(select.value, 10), { broadcast: true });
  });
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  openAudienceButton?.addEventListener("click", openAudience);
  restartButton?.addEventListener("click", restartAnimation);
  document.getElementById("print-script")?.addEventListener("click", () => window.print());

  document.addEventListener("keydown", (event) => {
    const tag = event.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || event.repeat) return;

    const key = event.key.toLowerCase();
    if (["arrowright", "arrowdown", " ", "pagedown", "enter"].includes(key)) {
      event.preventDefault();
      move(1);
    } else if (["arrowleft", "arrowup", "pageup", "backspace"].includes(key)) {
      event.preventDefault();
      move(-1);
    } else if (key === "r") {
      event.preventDefault();
      restartAnimation();
    } else if (key === "p") {
      event.preventDefault();
      openAudience();
    }
  });

  channel?.addEventListener("message", (event) => handleAudienceMessage(event.data));
  window.addEventListener("message", (event) => {
    if (event.data?.sender !== audienceSender) return;
    handleAudienceMessage(event.data, event.source);
  });
  window.addEventListener("beforeunload", () => channel?.close());

  buildScript();
  setCurrent(current);
  setAudienceState(audienceWindowIsOpen() ? "opening" : "idle", audienceWindowIsOpen() ? "Connecting…" : "Not open yet");
  postToAudience({ type: "presenter-ready" });
})();

let listening = false;

const tapZone = document.getElementById("tapZone");
const output = document.getElementById("output");
const statusEl = document.getElementById("status");

let recognition = null;

// ---------------- SPEECH RECOGNITION ----------------
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-GB";

  recognition.onstart = () => {
    listening = true;
    output.textContent = "Listening...";
    statusEl.textContent = "Speak a command now.";
    tapZone.classList.add("listening");
  };

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript.trim();

    output.textContent = text;
    statusEl.textContent = "Command captured.";

    handleCommand(text);
  };

  recognition.onerror = () => {
    listening = false;
    tapZone.classList.remove("listening");
    statusEl.textContent = "Mic error. Try again.";
  };

  recognition.onend = () => {
    listening = false;
    tapZone.classList.remove("listening");

    if (
      !output.textContent ||
      output.textContent === "Listening..."
    ) {
      output.textContent = "Tap the mic and say a command.";
    }

    if (statusEl.textContent === "Speak a command now.") {
      statusEl.textContent = "";
    }
  };
} else {
  statusEl.textContent =
    "Speech recognition not supported in this browser.";
}

// ---------------- TAP ZONE ----------------
tapZone.addEventListener("click", () => {
  if (!recognition) return;

  if (!listening) {
    recognition.start();
  } else {
    recognition.stop();
  }
});

// ---------------- COMMAND HANDLER ----------------
function handleCommand(command) {
  const cmd = command.toLowerCase();

  const newJobWords = ["create", "new", "book", "add"];
  const updateWords = ["update", "existing", "change", "complete", "ready"];

  // ---------- CREATE NEW JOB ----------
  if (newJobWords.some(word => cmd.includes(word))) {
    const newJob = {
      id: Date.now().toString(),
      reference: `Job-${Date.now()}`,
      description: command,
      status: "Pending",
      actions: []
    };

    const jobs = JSON.parse(localStorage.getItem("jobs") || "[]");

    jobs.push(newJob);
    localStorage.setItem("jobs", JSON.stringify(jobs));

    // Tell dashboard which job to open
    localStorage.setItem("currentJobId", newJob.id);

    output.textContent = `Created ${newJob.reference}`;
    statusEl.textContent = "Opening dashboard...";

    window.location.href = "dashboard.html";
    return;
  }

  // ---------- UPDATE EXISTING JOB ----------
  if (updateWords.some(word => cmd.includes(word))) {
    const jobs = JSON.parse(localStorage.getItem("jobs") || "[]");

    const matchedJob = jobs.find(job => {
      const description = job.description.toLowerCase();
      const reference = job.reference.toLowerCase();

      // Match reference directly
      if (cmd.includes(reference)) return true;

      // Match significant words from description
      const importantWords = description
        .split(" ")
        .filter(word => word.length > 3);

      return importantWords.some(word => cmd.includes(word));
    });

    if (matchedJob) {
      localStorage.setItem("currentJobId", matchedJob.id);

      output.textContent = `Opening ${matchedJob.reference}`;
      statusEl.textContent = "Opening dashboard...";

      window.location.href = "dashboard.html";
      return;
    } else {
      output.textContent = "No matching job found.";
      statusEl.textContent =
        "Try saying the customer name, bike model or job number.";
      return;
    }
  }

  // ---------- UNKNOWN COMMAND ----------
  output.textContent = "Command not recognised.";
  statusEl.textContent =
    "Try: 'Create new job for...' or 'Update John Smith Ducati job'";
    }

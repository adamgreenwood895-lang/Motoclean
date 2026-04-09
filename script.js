let listening = false;

const tapZone = document.getElementById("tapZone");
const output = document.getElementById("output");
const statusEl = document.getElementById("status");

let recognition = null;

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
    const text = event.results[0][0].transcript;
    output.textContent = text;
    statusEl.textContent = "Command captured.";

    // --- Handle voice commands for new/update jobs ---
    handleCommand(text);
  };

  recognition.onerror = () => {
    statusEl.textContent = "Mic error. Try again.";
  };

  recognition.onend = () => {
    listening = false;
    tapZone.classList.remove("listening");
    if (!output.textContent || output.textContent === "Listening...") {
      output.textContent = "Tap the mic and say a command.";
    }
  };
} else {
  statusEl.textContent = "Speech recognition not supported in this browser.";
}

tapZone.addEventListener("click", () => {
  if (!recognition) return;
  if (!listening) recognition.start();
  else recognition.stop();
});

// ---------------- COMMAND HANDLER ----------------
function handleCommand(command) {
  const cmd = command.toLowerCase();

  const newJobWords = ["create", "new", "book", "add"];
  const updateWords = ["update", "existing", "change", "complete", "ready"];

  // --- NEW JOB ---
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

    window.location.href = "dashboard.html";
    return;
  }

  // --- UPDATE EXISTING JOB ---
  if (updateWords.some(word => cmd.includes(word))) {
    // open dashboard and find matching job
    const jobs = JSON.parse(localStorage.getItem("jobs") || "[]");
    const job = jobs.find(j => cmd.includes(j.description.toLowerCase()));
    if (job) {
      localStorage.setItem("currentJobId", job.id);
      window.location.href = "dashboard.html";
      return;
    } else {
      output.textContent = "No matching job found";
    }
  }
}

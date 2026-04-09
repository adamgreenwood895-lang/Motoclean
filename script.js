let listening = false;

const tapZone = document.getElementById("tapZone");
const output = document.getElementById("output");

let recognition = null;

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-GB";

  recognition.onstart = () => {
    listening = true;
    tapZone.classList.add("listening");
    output.textContent = "Listening... Speak a command now.";
  };

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript.trim();
    output.textContent = text;

    handleCommand(text);
  };

  recognition.onerror = () => {
    listening = false;
    tapZone.classList.remove("listening");
    output.textContent = "Mic error. Tap and try again.";
  };

  recognition.onend = () => {
    listening = false;
    tapZone.classList.remove("listening");

    if (
      !output.textContent ||
      output.textContent === "Listening... Speak a command now."
    ) {
      output.textContent = "Tap the mic and say a command.";
    }
  };
} else {
  output.textContent = "Speech recognition is not supported on this device.";
}

tapZone.addEventListener("click", () => {
  if (!recognition) return;

  if (!listening) {
    recognition.start();
  } else {
    recognition.stop();
  }
});

function handleCommand(command) {
  const cmd = command.toLowerCase();

  const newJobWords = ["create", "new", "book", "add"];
  const updateWords = ["update", "existing", "change", "complete", "ready"];

  // CREATE NEW JOB
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

    // Important: tells dashboard which job to open
    localStorage.setItem("currentJobId", newJob.id);

    output.textContent = `${newJob.reference} created. Opening dashboard...`;

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 500);

    return;
  }

  // UPDATE EXISTING JOB
  if (updateWords.some(word => cmd.includes(word))) {
    const jobs = JSON.parse(localStorage.getItem("jobs") || "[]");

    const matchedJob = jobs.find(job => {
      const description = job.description.toLowerCase();
      const reference = job.reference.toLowerCase();

      if (cmd.includes(reference)) return true;

      const importantWords = description
        .split(" ")
        .filter(word => word.length > 3);

      return importantWords.some(word => cmd.includes(word));
    });

    if (matchedJob) {
      localStorage.setItem("currentJobId", matchedJob.id);

      output.textContent = `${matchedJob.reference} found. Opening dashboard...`;

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 500);

      return;
    }

    output.textContent =
      "No matching job found. Try saying the customer name, bike model or job number.";

    return;
  }

  output.textContent =
    "Command not recognised. Try 'Create new job for...' or 'Update John Smith Ducati job'.";
}

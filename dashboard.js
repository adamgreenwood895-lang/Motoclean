document.addEventListener("DOMContentLoaded", () => {

  // ---------- APPLY GARAGE SKIN ----------
  // Change as needed: "motoflow", "truckflow", "washflow", "autoflow"
  document.body.classList.add("motoflow");

  // ---------- GRAB DOM ELEMENTS ----------
  const jobList = document.getElementById("jobList");
  const completedJobList = document.getElementById("completedJobList");
  const jobPanel = document.getElementById("jobPanel");
  const jobDesc = document.getElementById("jobDesc");
  const saveJobBtn = document.getElementById("saveJob");
  const closePanelBtn = document.getElementById("closePanel");
  const toast = document.getElementById("toast");
  const dashboardMic = document.getElementById("dashboardMic");

  let listening = false;
  let currentJobId = null;

  // ---------- MAIN MIC RECOGNITION ----------
  let recognition = null;
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-GB";

    recognition.onstart = () => {
      listening = true;
      showToast("Listening...");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleVoiceCommand(transcript);
    };

    recognition.onerror = () => showToast("Mic error. Try again.");

    recognition.onend = () => {
      listening = false;
    };
  }

  // ---------- WAKE-WORD LISTENER ----------
  let wakeRecognition = null;
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    wakeRecognition = new SpeechRecognition();
    wakeRecognition.continuous = true;
    wakeRecognition.interimResults = false;
    wakeRecognition.lang = "en-GB";

    wakeRecognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      if (["activate dashboard mic", "open dashboard mic", "moto listen", "start listening"]
          .some(phrase => transcript.includes(phrase))) {
        if (!listening && recognition) recognition.start();
        showToast("Dashboard mic activated via voice");
      }
    };

    wakeRecognition.onend = () => wakeRecognition.start(); // always restart
    wakeRecognition.start();
  }

  // ---------- HANDLE VOICE COMMAND ----------
  function handleVoiceCommand(transcript) {
    const command = transcript.toLowerCase().trim();
    const newJobWords = ["create", "new", "book", "add"];
    const updateWords = ["update", "existing", "change", "complete", "ready", "progress"];

    // NEW JOB
    if (newJobWords.some(word => command.includes(word))) {
      const newJob = {
        id: Date.now().toString(),
        reference: `JOB-${Date.now()}`,
        description: transcript,
        status: "Pending",
        actions: []
      };
      const jobs = JSON.parse(localStorage.getItem("jobs") || "[]");
      jobs.push(newJob);
      localStorage.setItem("jobs", JSON.stringify(jobs));

      window.location.href = "dashboard.html";
      return;
    }

    // UPDATE EXISTING JOB
    if (updateWords.some(word => command.includes(word))) {
      openExistingJobPanel(command);
      return;
    }

    showToast("Command not recognised");
  }

  // ---------- JOB STORAGE ----------
  function getJobs() {
    return JSON.parse(localStorage.getItem("jobs") || "[]");
  }

  // ---------- RENDER JOBS ----------
  function renderJobs() {
    const jobs = getJobs();
    const activeJobs = jobs.filter(j => j.status !== "Ready");
    const completedJobs = jobs.filter(j => j.status === "Ready");

    // Active jobs
    jobList.innerHTML = "";
    if (!activeJobs.length) jobList.innerHTML = "<p>No active jobs.</p>";
    activeJobs.forEach(job => {
      const div = document.createElement("div");
      div.className = "job-card";
      div.innerHTML = `
        <p><strong>${job.reference}</strong></p>
        <p>${job.description}</p>
        <span class="status-${job.status.toLowerCase()}">Status: ${job.status}</span>
        <button class="mark-ready-btn">Mark Ready</button>
        <button class="delete-btn">Delete</button>
      `;
      div.querySelector(".mark-ready-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        markJobReady(job.id);
      });
      div.querySelector(".delete-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        deleteJob(job.id);
      });
      div.addEventListener("click", () => openJobPanel(job.id));
      jobList.appendChild(div);
    });

    // Completed jobs
    completedJobList.innerHTML = "";
    if (!completedJobs.length) completedJobList.innerHTML = "<p>No completed jobs.</p>";
    completedJobs.forEach(job => {
      const div = document.createElement("div");
      div.className = "job-card completed";
      div.innerHTML = `
        <p><strong>${job.reference}</strong></p>
        <p>${job.description}</p>
        <span class="status-${job.status.toLowerCase()}">Status: ${job.status}</span>
        <button class="delete-btn">Delete</button>
      `;
      div.querySelector(".delete-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        deleteJob(job.id);
      });
      completedJobList.appendChild(div);
    });
  }

  // ---------- JOB PANEL ----------
  function openJobPanel(id) {
    const jobs = getJobs();
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    currentJobId = id;
    jobDesc.value = job.description;
    jobPanel.classList.remove("hidden");
  }

  function saveJob() {
    if (!currentJobId) return;
    const jobs = getJobs();
    const updatedJobs = jobs.map(j => j.id === currentJobId ? { ...j, description: jobDesc.value } : j);
    localStorage.setItem("jobs", JSON.stringify(updatedJobs));
    jobPanel.classList.add("hidden");
    renderJobs();
    showToast("Job saved");
  }

  function closePanel() {
    jobPanel.classList.add("hidden");
  }

  // ---------- MARK JOB READY ----------
  function markJobReady(id) {
    let jobs = getJobs();
    jobs = jobs.map(j => j.id === id ? { ...j, status: "Ready" } : j);
    localStorage.setItem("jobs", JSON.stringify(jobs));
    renderJobs();
    showToast("Job marked as completed");
  }

  // ---------- DELETE JOB ----------
  function deleteJob(id) {
    let jobs = getJobs();
    jobs = jobs.filter(j => j.id !== id);
    localStorage.setItem("jobs", JSON.stringify(jobs));
    renderJobs();
    showToast("Job deleted");
  }

  // ---------- OPEN EXISTING JOB VIA COMMAND ----------
  function openExistingJobPanel(command) {
    const jobs = getJobs();
    const job = jobs.find(j => command.includes(j.description.toLowerCase()));
    if (job) {
      openJobPanel(job.id);
      showToast("Existing job opened");
    } else {
      showToast("No matching job found");
    }
  }

  // ---------- TOAST ----------
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  }

  // ---------- EVENT LISTENERS ----------
  saveJobBtn.addEventListener("click", saveJob);
  closePanelBtn.addEventListener("click", closePanel);
  dashboardMic.addEventListener("click", () => {
    if (recognition && !listening) recognition.start();
  });

  // ---------- INITIAL RENDER ----------
  renderJobs();

});

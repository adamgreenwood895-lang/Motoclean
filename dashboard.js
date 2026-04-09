const jobListEl = document.getElementById('jobList');
const jobPanel = document.getElementById('jobPanel');
const jobDescInput = document.getElementById('jobDesc');
const saveJobBtn = document.getElementById('saveJob');
const closePanelBtn = document.getElementById('closePanel');
const toastEl = document.getElementById('toast');
const dashboardMic = document.getElementById('dashboardMic');

const liveJobsCount = document.getElementById('liveJobsCount');
const progressJobsCount = document.getElementById('progressJobsCount');
const readyJobsCount = document.getElementById('readyJobsCount');

let jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
let selectedJobId = null;
let recognition = null;
let listening = false;

function saveJobs() {
  localStorage.setItem('jobs', JSON.stringify(jobs));
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');

  clearTimeout(window.toastTimeout);

  window.toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2500);
}

function updateOverviewCounts() {
  liveJobsCount.textContent = jobs.length;
  progressJobsCount.textContent = jobs.filter(
    job => job.status === 'In Progress'
  ).length;
  readyJobsCount.textContent = jobs.filter(
    job => job.status === 'Ready'
  ).length;
}

function getStatusClass(status) {
  switch ((status || '').toLowerCase()) {
    case 'ready':
      return 'status-ready';

    case 'in progress':
      return 'status-inprogress';

    default:
      return 'status-pending';
  }
}

function renderJobs() {
  jobListEl.innerHTML = '';

  if (jobs.length === 0) {
    jobListEl.innerHTML = `
      <div class="job-card">
        <h3>No Jobs Yet</h3>
        <p>Create a new job using the main screen or dashboard microphone.</p>
      </div>
    `;

    updateOverviewCounts();
    return;
  }

  jobs.forEach(job => {
    const card = document.createElement('div');
    card.className = 'job-card';

    const shortDescription = job.description.length > 120
      ? job.description.slice(0, 120) + '...'
      : job.description;

    card.innerHTML = `
      <span class="${getStatusClass(job.status)}">${job.status}</span>
      <h3>${job.reference}</h3>
      <p>${shortDescription}</p>
    `;

    card.addEventListener('click', () => openJob(job.id));

    jobListEl.appendChild(card);
  });

  updateOverviewCounts();
}

function openJob(jobId) {
  const job = jobs.find(j => j.id === jobId);

  if (!job) return;

  selectedJobId = job.id;
  jobDescInput.value = job.description;
  jobPanel.classList.remove('hidden');
}

function closeJobPanel() {
  selectedJobId = null;
  jobPanel.classList.add('hidden');
}

function saveCurrentJob() {
  if (!selectedJobId) return;

  const job = jobs.find(j => j.id === selectedJobId);

  if (!job) return;

  job.description = jobDescInput.value.trim();

  saveJobs();
  renderJobs();
  showToast('Job updated');
}

function createJobFromCommand(command) {
  const jobNumber = jobs.length + 1;

  const newJob = {
    id: 'job-' + Date.now(),
    reference: 'JOB-' + String(jobNumber).padStart(3, '0'),
    description: command,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  jobs.unshift(newJob);

  saveJobs();
  renderJobs();
  openJob(newJob.id);
  showToast(`${newJob.reference} created`);
}

function updateExistingJobFromCommand(command) {
  const match = command.match(/update existing job for (.+)/i);

  if (!match) {
    showToast('No job search term found');
    return;
  }

  const searchTerm = match[1].toLowerCase().trim();

  const job = jobs.find(j =>
    j.description.toLowerCase().includes(searchTerm) ||
    j.reference.toLowerCase().includes(searchTerm)
  );

  if (!job) {
    showToast('No matching job found');
    return;
  }

  job.description += `\nAction Added: Updated via voice command`;

  if (job.status === 'Pending') {
    job.status = 'In Progress';
  }

  saveJobs();
  renderJobs();
  openJob(job.id);
  showToast(`${job.reference} updated`);
}

function handleVoiceCommand(transcript) {
  const command = transcript.toLowerCase().trim();

  const newJobWords = ["create", "new", "book", "add"];
  const updateWords = ["update", "existing", "change", "complete", "ready", "progress"];

  const isNewJob = newJobWords.some(word => command.includes(word));
  const isUpdate = updateWords.some(word => command.includes(word));

  if (isNewJob && !isUpdate) {
    createJobFromVoice(transcript);
    return;
  }

  if (isUpdate) {
    updateExistingJobFromVoice(transcript);
    return;
  }

  showToast("Command not recognised");
}

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    dashboardMic.style.display = 'none';
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'en-GB';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    listening = true;
    dashboardMic.classList.add('listening');
    showToast('Listening...');
  };

  recognition.onend = () => {
    listening = false;
    dashboardMic.classList.remove('listening');
  };

  recognition.onerror = () => {
    listening = false;
    dashboardMic.classList.remove('listening');
    showToast('Microphone error');
  };

  recognition.onresult = (event) => {
    const command = event.results[0][0].transcript;
    handleVoiceCommand(command);
  };
}
let wakeRecognition = null;

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const WakeSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  wakeRecognition = new WakeSpeechRecognition();
  wakeRecognition.continuous = true;
  wakeRecognition.interimResults = false;
  wakeRecognition.lang = "en-GB";

  wakeRecognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript
      .toLowerCase()
      .trim();

    const wakePhrases = [
      "activate dashboard mic",
      "open dashboard mic",
      "start listening",
      "moto listen",
      "motoflow listen"
    ];

    const matchedWake = wakePhrases.some(phrase => transcript.includes(phrase));

    if (matchedWake) {
      showToast("Listening...");

      if (recognition) {
        recognition.start();
      }
    }
  };

  wakeRecognition.onend = () => {
    setTimeout(() => {
      try {
        wakeRecognition.start();
      } catch (e) {}
    }, 500);
  };

  window.addEventListener("load", () => {
    try {
      wakeRecognition.start();
    } catch (e) {}
  });
}
dashboardMic.addEventListener('click', () => {
  if (!recognition) return;

  if (listening) {
    recognition.stop();
  } else {
    recognition.start();
  }
});

saveJobBtn.addEventListener('click', saveCurrentJob);
closePanelBtn.addEventListener('click', closeJobPanel);

const pendingVoiceCommand = sessionStorage.getItem('voiceCommand');

if (pendingVoiceCommand) {
  sessionStorage.removeItem('voiceCommand');

  setTimeout(() => {
    handleVoiceCommand(pendingVoiceCommand);
  }, 250);
}

initSpeechRecognition();
renderJobs();

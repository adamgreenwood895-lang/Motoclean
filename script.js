const tapZone = document.getElementById('tapZone');
const output = document.getElementById('output');
const statusText = document.getElementById('status');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  output.textContent = 'Speech recognition is not supported in this browser.';
} else {
  const recognition = new SpeechRecognition();

  recognition.lang = 'en-GB';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    tapZone.classList.add('listening');
    statusText.textContent = 'Listening';
    output.textContent = 'Speak now...';
  };

  recognition.onend = () => {
    tapZone.classList.remove('listening');
    statusText.textContent = '';
  };

  recognition.onerror = () => {
    tapZone.classList.remove('listening');
    statusText.textContent = '';
    output.textContent = 'Sorry, I could not hear that. Please try again.';
  };

  recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.trim();
    const lower = command.toLowerCase();

    output.textContent = command;

    const isNewJob =
      lower.includes('new job') ||
      lower.includes('create job') ||
      lower.includes('book a job') ||
      lower.includes('new booking');

    const isUpdateJob = lower.includes('update existing job for');

    if (isNewJob || isUpdateJob) {
      sessionStorage.setItem('voiceCommand', command);
      window.location.href = 'dashboard.html';
      return;
    }

    output.textContent = 'Command recognised, but no matching action exists yet.';
  };

  tapZone.addEventListener('click', () => {
    recognition.start();
  });
}

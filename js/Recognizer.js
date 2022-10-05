import {COMMANDS, INTERRUPT_RECOGNITION_DELAY} from './constants.js';

export class Recognizer {
  constructor() {
    this.$recognizeButton = document.querySelector('[data-action="recognize"]');
    this.$confirmButton = document.querySelector('[data-action="confirm"]');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognizer = new SpeechRecognition();
    this.recognizer.continuous = false;
    this.recognizer.lang = 'en-US';
    this.recognizer.interimResults = false;
    this.recognizer.maxAlternatives = 10;
    this.recognizer.addEventListener('result', this.showRecognition.bind(this));
    this.speaker = window.speechSynthesis || window.webkitspeechSynthesis;
  }

  startRecognition() {
    this.$recognizeButton.textContent = 'Recording';
    this.$recognizeButton.classList.add('button_active');
    this.recognizer.start()
    this.interrupter = setTimeout(this.showRecognition.bind(this), INTERRUPT_RECOGNITION_DELAY, {results: null});
  }

  showRecognition({results}) {
    clearTimeout(this.interrupter);
    this.$recognizeButton.classList.remove('button_active');
    if (!results) {
      this.$recognizeButton.textContent = 'Try again!';
      this.$confirmButton.classList.add('button_inactive');
      return;
    }
    const [firstWords, secondWords] = Array.from(results[0]).reduce((result, alternative) => {
      const words = alternative.transcript.split(' ');
      if (words.length > 1) {
        result[0].push(words[0].toLowerCase());
        result[1].push(words[1].toLowerCase());
      }
      return result;
    }, Array.from(Array(2), () => []));
    this.firstCommand = firstWords.find(word => COMMANDS.includes(word));
    this.secondCommand = secondWords.find(word => COMMANDS.includes(word));
    if (this.firstCommand && this.secondCommand) {
      const first = this.firstCommand[0].toUpperCase() + this.firstCommand.slice(1);
      const second = this.secondCommand[0].toUpperCase() + this.secondCommand.slice(1);
      this.$recognizeButton.textContent = `${first} ${second}`;
      this.$confirmButton.classList.remove('button_inactive');
    }
    else {
      this.$recognizeButton.textContent = 'Try again!';
      this.$confirmButton.classList.add('button_inactive');
    }
  }

  getRecognize() {
    return [COMMANDS.indexOf(this.firstCommand), COMMANDS.indexOf(this.secondCommand)];
  }

  finishRecognize() {
    this.$recognizeButton.textContent = 'Listen';
    this.firstCommand = '';
    this.secondCommand = '';
    this.$confirmButton.classList.add('button_inactive');
  }

  voiceStatus(status) {
    const message = new SpeechSynthesisUtterance();
    message.lang = 'en-US';
    if (typeof status == 'string') message.text = status;
    else {
      const [y, x] = status;
      message.text = `${COMMANDS[y]} ${COMMANDS[x]}`;
    }
    this.speaker.speak(message);
  }
}

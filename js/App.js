import {Table} from './Table.js';
import {Recognizer} from './Recognizer.js';
import {MESSAGE_DELAY, GAME_ENDINDS} from './constants.js';

export class App {
  constructor() {
    this.$app = document.querySelector('.app');
    this.$hint = document.querySelector('.hint');
    this.$sideSelect = document.querySelector('.side-select');
    this.$message = document.querySelector('.message');
    this.$messageTitle = document.querySelector('.message__title');
    this.mode = 'voice';
    this.handlers = {
      reset() {
        this.table.createTable();
        this.$message.classList.add('message_hidden');
        this.$sideSelect.classList.remove('side-select_hidden');
      },
      hint() {
        this.$hint.classList.toggle('hint_hidden');
      },
      recognize() {
        if (this.mode != 'voice') return;
        this.recognizer.startRecognition();
      },
      confirm() {
        if (this.recognizer.firstCommand && this.recognizer.secondCommand) {
          const [y, x] = this.recognizer.getRecognize();
          this.table.makePlayerMove(x, y, this.summarizeMove.bind(this));
          this.recognizer.finishRecognize();
        }
      },
      makeplayermove({dataset: {x, y}}) {
        if (this.mode != 'click' || this.table.isBlocked) return;
        this.table.makePlayerMove(x, y, this.summarizeMove.bind(this));
      },
      switch(target) {
        this.recognizer.$recognizeButton.classList.toggle('button_inactive');
        const spans = target.closest('.button').querySelectorAll('span');
        spans[0].classList.toggle('button__highlight');
        spans[1].classList.toggle('button__highlight');
        if (this.mode == 'voice') {
          this.mode = 'click';
        } else {
          this.mode = 'voice';
        }
      },
      start({dataset: {color}}) {
        this.$sideSelect.classList.add('side-select_hidden');
        this.table.startGame(color, this.summarizeMove.bind(this));
      },
      hide(target) {
        const panel = target.closest('[data-panel]');
        panel.classList.add(`${panel.dataset.panel}_hidden`);
      }
    };
    this.table = new Table();
    this.recognizer = new Recognizer();
  }

  init() {
    this.$app.addEventListener('mousedown', (event) => event.preventDefault());
    this.$app.addEventListener('click', ({target}) => {
      const button = target.closest('[data-action]');
      if (!button) return;
      this.handlers[button.dataset.action].call(this, target);
    });
  }

  showMessage(status) {
    this.$sideSelect.classList.add('side-select_hidden');
    this.$messageTitle.textContent = status;
    this.$message.classList.remove('message_hidden');
  }

  summarizeMove(status) {
    if (Object.values(GAME_ENDINDS).includes(status)) {
      setTimeout((status) => {
        this.showMessage(status);
        this.recognizer.voiceStatus(status);
      }, MESSAGE_DELAY, status);
    } else this.recognizer.voiceStatus(status);
  }
}

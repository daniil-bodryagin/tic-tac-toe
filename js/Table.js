import {COMPUTER_MOVE_DELAY, LETTERS, WEIGHTS, GAME_ENDINDS} from './constants.js';

export class Table {
  constructor() {
    this.$table = document.querySelector('.table');
    this.size = 5;
    this.isBlocked = true;
  }

  createTable() {
    this.$table.innerHTML = '';
    this.$cells = Array.from(new Array(this.size), (r, rowIndex) => {
      const $row = document.createElement('div');
      $row.classList.add('table__row');
      const row = Array.from(new Array(this.size), (c, cellIndex) => {
        const $cell = document.createElement('div');
        $cell.classList.add('table__cell');
        $cell.textContent = `${LETTERS[rowIndex]}${LETTERS[cellIndex]}`;
        $cell.setAttribute('data-color', '');
        $cell.setAttribute('data-action', 'makeplayermove');
        $cell.setAttribute('data-x', `${cellIndex}`);
        $cell.setAttribute('data-y', `${rowIndex}`);
        $row.append($cell);
        return $cell;
      });
      this.$table.append($row);
      return row;
    })
  }

  createLines() {
    this.lines = [];
    this.$cells.forEach((row, rowIndex) => {
      this.lines.push(this.getHorizontal(rowIndex, 0));
      this.lines.push(this.getHorizontal(rowIndex, 1));
    });
    this.$cells.forEach((cell, colIndex) => {
      this.lines.push(this.getVertical(0, colIndex));
      this.lines.push(this.getVertical(1, colIndex));
    })
    for (let rowIndex = 0; rowIndex < 2; rowIndex++) {
      for (let colIndex = 0; colIndex < 2; colIndex++) {
        this.lines.push(this.getDiagonal(rowIndex, colIndex));
      }
    }
    for (let rowIndex = this.$cells.length - 1; rowIndex > this.$cells.length - 3; rowIndex--){
      for (let colIndex = 0; colIndex < 2; colIndex++) {
        this.lines.push(this.getBackDiagonal(rowIndex, colIndex));
      }
    }
  }

  getHorizontal(y, x) {
    const horizontal = [];
    for (let i = x; i < x + this.size - 1; i++) horizontal.push({
      $element: this.$cells[y][i],
      x: i,
      y: y
    });
    return horizontal;
  }

  getVertical(y, x) {
    const vertical = [];
    for (let i = y; i < y + this.size - 1; i++) vertical.push({
      $element: this.$cells[i][x],
      x: x,
      y: i
    });
    return vertical;
  }

  getDiagonal(y, x) {
    const diagonal = [];
    for (let i = x, j = y; i < x + this.size - 1; i++, j++) diagonal.push({
      $element: this.$cells[j][i],
      x: i,
      y: j
    });
    return diagonal;
  }

  getBackDiagonal(y, x) {
    const backDiagonal = [];
    for (let i = x, j = y; i < x + this.size - 1; i++, j--) backDiagonal.push({
      $element: this.$cells[j][i],
      x: i,
      y: j
    });
    return backDiagonal;
  }

  startGame(color, summarizeMove) {
    this.createLines();
    if (color == 'white') {
      [this.playerColor, this.computerColor] = ['white', 'black'];
      this.makeComputerMove(summarizeMove);
    } else {
      [this.playerColor, this.computerColor] = ['black', 'white'];  
      this.isBlocked = false;
    }
  }

  compareWithPattern(line, color, weights) {
    let weight = 0;
    const pattern = line.map(cell => {
      if (cell.$element.dataset.color) {
        return cell.$element.dataset.color == color ? 'y' : 'n';
      }
      return 'e';
    }).join('');
    switch (pattern) {
      case 'yyye':
      case 'eyyy':
      case 'yyey':
      case 'yeyy':
        weight = WEIGHTS.tripple;
        break;
      case 'yyee':
      case 'yeye':
      case 'yeey':
      case 'eyye':
      case 'eyey':
      case 'eeyy':
        weight = WEIGHTS.double;
        break;
      case 'yeee':
      case 'eyee':
      case 'eeye':
      case 'eeey':
        weight = WEIGHTS.single;
        break;
      case 'eeee':
        weight = WEIGHTS.empty;
        break;
      default:
        weight = 0;
        break;
    }
    line.forEach(({$element, x, y}) => weights[y][x] += $element.dataset.color ? WEIGHTS.colored : weight);
  }

  makeComputerMove(summarizeMove){
    setTimeout(() => {
      const playerWeights = this.$cells.map(row => row.map(cell => 0));
      const computerWeights = this.$cells.map(row => row.map(cell => 0));
      this.lines.forEach(line => {
        this.compareWithPattern(line, this.playerColor, playerWeights);
        this.compareWithPattern(line, this.computerColor, computerWeights);
      });
      const absoluteWeights = this.$cells.map(row => row.map(cell => 0));;
      for (let i = 0; i < playerWeights.length; i++) {
        for (let j = 0; j < playerWeights[0].length; j++) {
          let value;
          if (playerWeights[i][j] < 0 || computerWeights[i][j] < 0) value = WEIGHTS.colored;
          else value = Math.max(playerWeights[i][j], computerWeights[i][j] * WEIGHTS.computerPriority);
          absoluteWeights[i][j] = {
            value: value,
            y: i,
            x: j
          };
        }
      }
      const rating = absoluteWeights.flat();
      for (let i = rating.length - 1 ; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        [rating[i], rating[randomIndex]] = [rating[randomIndex], rating[i]];
      }
      rating.sort(({value: valueA}, {value: valueB}) => valueB - valueA);
      this.$cells[rating[0].y][rating[0].x].classList.add(`${this.computerColor}`);
      this.$cells[rating[0].y][rating[0].x].setAttribute('data-color', `${this.computerColor}`);
      const status = this.getGameStatus(this.computerColor);
      if (status == 'draw') summarizeMove(GAME_ENDINDS.draw);
      else if (status == 'stop') summarizeMove(GAME_ENDINDS.lose);
      else {
        this.isBlocked = false;
        summarizeMove([rating[0].y, rating[0].x]);
      }
    }, COMPUTER_MOVE_DELAY);
  }

  makePlayerMove(x, y, summarizeMove) {
    if (this.$cells[y][x].dataset.color) {
      summarizeMove('You can\'t!');
      return;
    }
    this.$cells[y][x].classList.add(`${this.playerColor}`);
    this.$cells[y][x].setAttribute('data-color', `${this.playerColor}`);
    this.isBlocked = true;
    const status = this.getGameStatus(this.playerColor);
    if (status == 'draw') summarizeMove(GAME_ENDINDS.draw);
    else if (status == 'stop') summarizeMove(GAME_ENDINDS.win);
    else this.makeComputerMove(summarizeMove);
  }

  getGameStatus(color) {
    let existsEmptyCell = false;
    for (let line of this.lines) {
      if (line.every(cell => cell.$element.dataset.color == color)) {
        return 'stop';
      }
      if (line.some(cell => cell.$element.dataset.color == '')) existsEmptyCell = true;
    }
    if (!existsEmptyCell) return 'draw';
  }
}

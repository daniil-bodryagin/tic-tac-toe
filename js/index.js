import {App} from './App.js';

const app = new App();
app.init();
app.handlers.reset.call(app);

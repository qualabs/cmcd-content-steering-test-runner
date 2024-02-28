import './style.css'
import dashLogo from './samples/lib/img/dashjs-logo.png'
import { setupButton } from './optionButton';

document.querySelector('#app').innerHTML = `
  <div>
    <a href="https://localhost:5173" target="_blank">
      <img src="${dashLogo}" class="logo" alt="DASH Logo" />
    </a>
    <h1>CMCD TESTING PLAYERS</h1>
    <div class="container">
      <div class="card">
        <button id="cmcd" type="button">CMCD</button>
      </div>
      <div class="card">
        <button id="content-steering" type="button">Content Steering</button>
      </div>
    </div>
  </div>
`
setupButton(document.querySelector('#cmcd'), '/samples/cmcd.html');
setupButton(document.querySelector('#content-steering'), '/samples/content-steering.html');
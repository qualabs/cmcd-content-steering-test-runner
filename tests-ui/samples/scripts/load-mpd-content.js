async function  _loadMPDContent() {
    var mpdOutput = document.getElementById('mpd-output');
    mpd = document.getElementById('manifest').value;
    let mpdContent;
    mpdOutput.innerHTML = '';
    try {
        const parser = new DOMParser();
        const url = mpd.includes('cases') ? `../samples/${mpd}` : mpd
        mpdContent = await fetch(url);
        mpdContent = await mpdContent.text();
        const preElement = document.createElement('pre');
        const codeElement = document.createElement('code');
        codeElement.textContent = mpdContent;
        preElement.appendChild(codeElement);
        mpdOutput.appendChild(preElement);
    } catch (error) {
        console.error('Error loading .mpd file', error);
        return null;
    }
    hljs.highlightAll();
}

function initialize() {
    document.getElementById('load-button').addEventListener('click', function () {
        _loadMPDContent();
    });
}

document.addEventListener('DOMContentLoaded', function () {
    initialize();
});
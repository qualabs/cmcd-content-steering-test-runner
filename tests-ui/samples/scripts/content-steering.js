var CMCD_DATA_GENERATED = dashjs.MetricsReporting.events.CMCD_DATA_GENERATED;
/* possible modes of attach cmcd data */
var CMCD_MODE_QUERY = 'query'; /* as query parameters */
var CMCD_MODE_HEADER = 'header'; /* as HTTP headers */
let player;
let mpd = "";
let currentSelectedServiceLocation = {}
let cdnSelectionImgDomElements = {};
let locationSelectionImgDomElements = {};

function init() {
    player = dashjs.MediaPlayer().create();
    document.getElementById('load-button').addEventListener('click', function () {
        _load();
    })
    player.initialize(document.querySelector("video"), null, true);

    player.on(dashjs.MediaPlayer.events.FRAGMENT_LOADING_STARTED, _onFragmentLoadingStarted, null);
    player.on(dashjs.MediaPlayer.events.MANIFEST_LOADING_STARTED, _onManifestLoadingStarted, null);
    player.on(dashjs.MediaPlayer.events.CONTENT_STEERING_REQUEST_COMPLETED, _onContentSteeringRequestCompleted, null);
    player.on(dashjs.MediaPlayer.events.BASE_URLS_UPDATED, _onBaseUrlsUpdated, null);
    player.on(dashjs.MediaPlayer.events.MANIFEST_LOADED, _onManifestLoaded, null);
    player.on(CMCD_DATA_GENERATED, handleCmcdDataGeneratedEvent);
}


function handleCmcdDataGeneratedEvent(event) {
    log('type: ' + event.mediaType);
    log('file: ' + event.url.split('/').pop())
    let mode = !!event.headers ? CMCD_MODE_HEADER : CMCD_MODE_QUERY;
    var data = mode === CMCD_MODE_HEADER ? getKeysForHeaderMode(event) : getKeysForQueryMode(event);
    var keys = Object.keys(data);
    keys = keys.sort();
    for (var key of keys) {
        log(key.padEnd(4) + ': ' + event.cmcdData[key]);
    }
    log('');
}

function getKeysForQueryMode(event) {
    console.log(event);
    var cmcdData = {};
    var cmcdString = event.cmcdString;

    extractKeyValuePairs(cmcdString, cmcdData);
    return cmcdData;
}

function getKeysForHeaderMode(event) {
    var cmcdData = {};
    var keys = Object.keys(event.headers);

    for (var key of keys) {
        extractKeyValuePairs(event.headers[key], cmcdData)
    }
    return cmcdData
}

function extractKeyValuePairs(cmcdString, cmcdData) {
    if (cmcdString === '') {
        return;
    }
    var keyValuePairs = cmcdString.split(',');

    keyValuePairs.forEach(function (keyValuePair) {
        var data = keyValuePair.split('=');
        var key = data[0];
        var value = data[1];

        cmcdData[key] = value;
    })

}

function log(msg) {
    msg = msg.length > 200 ? msg.substring(0, 200) + '...' : msg; /* to avoid repeated wrapping with large objects */
    var tracePanel = document.getElementById('trace');
    tracePanel.innerHTML += msg + '\n';
    tracePanel.scrollTop = tracePanel.scrollHeight;
    console.log(msg);
}

function _load() {
    const applyCMCDParameters = document.getElementById('applyCMCDParameters').checked;
    const cmcdJS = document.getElementById('cmcdJS').checked;
    player.updateSettings({
        streaming: {
            applyCMCDParameters,
            cmcd: {
                enabled: cmcdJS, /* enable reporting of cmcd parameters */
                sid: 'b248658d-1d1a-4039-91d0-8c08ba597da5', /* session id send with each request */
                cid: '21cf726cfe3d937b5f974f72bb5bd06a', /* content id send with each request */
                mode: cmcdJS ? CMCD_MODE_HEADER : CMCD_MODE_QUERY,
                includeInRequests: ['mpd', 'segment' , 'steering'],
                enabledKeys: ['br', 'd', 'ot', 'tb' , 'bl', 'dl', 'mtp', 'nor', 'nrr', 'su' , 'bs', 'rtp' , 'cid', 'pr', 'sf', 'sid', 'st', 'v']
            }
        }
    });
    mpd = document.getElementById('manifest').value;
    player.attachSource(mpd);
    player.updateSettings({})
}

function _onFragmentLoadingStarted(e) {
    try {
        if (e && e.mediaType && (e.mediaType === 'video' || e.mediaType === 'audio') && e.request) {
            if (e.request.serviceLocation) {
                const element = document.getElementById(`${e.mediaType}-service-location`);
                element.innerText = e.request.serviceLocation;
                if (!currentSelectedServiceLocation[e.mediaType] || currentSelectedServiceLocation[e.mediaType] !== e.request.serviceLocation) {
                    currentSelectedServiceLocation[e.mediaType] = e.request.serviceLocation;
                    _serviceLocationChanged(currentSelectedServiceLocation, cdnSelectionImgDomElements);
                }
            }
            if (e.request.url) {
                const element = document.getElementById(`${e.mediaType}-request-url`);
                element.innerText = e.request.url;
            }
        }
    } catch (e) {
        console.error(e);
    }
}

function _serviceLocationChanged(selectedServiceLocation, domElements) {
    const activeServiceLocations = Object.keys(selectedServiceLocation).reduce((acc, key) => {
        acc[selectedServiceLocation[key]] = true;
        return acc;
    }, {})

    Object.keys(domElements).forEach((key) => {
        const elem = domElements[key];

        if (activeServiceLocations[key]) {
            elem.setAttribute('src', 'img/server-active.svg')
        } else {
            elem.setAttribute('src', 'img/server.svg');
        }

    })
}

function _onBaseUrlsUpdated(e) {
    if (!e || !e.baseUrls || e.baseUrls.length === 0) {
        return;
    }
    const divContainer = document.getElementById('cdn-selection-container');
    /* Only create the once we dont have yet */
    e.baseUrls.forEach((baseUrl) => {
        if (baseUrl.serviceLocation) {
            const existingElement = document.getElementById(`cdn-selection-${baseUrl.serviceLocation}`);
            if (!existingElement) {
                const spanContainer = document.createElement('span');
                spanContainer.setAttribute('id', `cdn-selection-${baseUrl.serviceLocation}`);
                const figure = document.createElement('figure');
                figure.setAttribute('class', 'cdn-selection');
                const img = document.createElement('img');
                img.setAttribute('src', 'img/server.svg');
                img.setAttribute('class', 'figure-img img-fluid cdn-selection');
                const figCaption = document.createElement('figcaption');
                figCaption.setAttribute('class', 'figure-caption');
                const label = document.createTextNode(`${baseUrl.serviceLocation}`);
                figCaption.appendChild(label);
                figure.appendChild(img)
                figure.appendChild(figCaption);
                spanContainer.appendChild(figure);
                divContainer.appendChild(spanContainer);
                cdnSelectionImgDomElements[baseUrl.serviceLocation] = img;
            }
        }
    })
}

function _onManifestLoaded() {
    const locations = player.getAvailableLocations();
    if (!locations || locations.length === 0) {
        return;
    }
    const divContainer = document.getElementById('location-selection-container');
    /* Only create the once we dont have yet */
    locations.forEach((location) => {
        if (location.serviceLocation) {
            const existingElement = document.getElementById(`cdn-selection-${location.serviceLocation}`);
            if (!existingElement) {
                const spanContainer = document.createElement('span');
                spanContainer.setAttribute('id', `cdn-selection-${location.serviceLocation}`);
                const figure = document.createElement('figure');
                figure.setAttribute('class', 'cdn-selection');
                const img = document.createElement('img');
                img.setAttribute('src', 'img/server.svg');
                img.setAttribute('class', 'figure-img img-fluid cdn-selection');
                const figCaption = document.createElement('figcaption');
                figCaption.setAttribute('class', 'figure-caption');
                const label = document.createTextNode(`${location.serviceLocation}`);
                figCaption.appendChild(label);
                figure.appendChild(img)
                figure.appendChild(figCaption);
                spanContainer.appendChild(figure);
                divContainer.appendChild(spanContainer);
                locationSelectionImgDomElements[location.serviceLocation] = img;
            }
        }
    })
}

function _onManifestLoadingStarted(e) {
    try {
        if (e.request.serviceLocation) {

        }
        if (e.request.url) {
            const element = document.getElementById(`manifest-request-url`);
            element.innerText = e.request.url;
        }
        const slElement = document.getElementById(`manifest-service-location`);
        if (e.request.serviceLocation) {
            slElement.innerText = e.request.serviceLocation;
            _serviceLocationChanged({ manifest: e.request.serviceLocation }, locationSelectionImgDomElements)
        } else {
            slElement.innerText = '';
        }
    } catch (e) {
        console.error(e);
    }
}

function _onContentSteeringRequestCompleted(e) {
    try {
        if (e) {
            document.getElementById(`steering-request-timestamp`).innerText = new Date().toISOString();
            if (e.url) {
                document.getElementById(`steering-request-url`).innerText = decodeURIComponent(e.url);
            }
            if (e.currentSteeringResponseData) {
                document.getElementById(`steering-version`).innerText = e.currentSteeringResponseData.version;
                document.getElementById(`steering-ttl`).innerText = e.currentSteeringResponseData.ttl;
                document.getElementById(`steering-reload-uri`).innerText = e.currentSteeringResponseData.reloadUri;
                document.getElementById(`steering-pathway-priority`).innerText = e.currentSteeringResponseData.pathwayPriority.toString();
                document.getElementById(`steering-pathway-cloning`).innerText = JSON.stringify(e.currentSteeringResponseData.pathwayClones, null, '\t');
            }
        }
    } catch (e) {
        console.error(e);
    }
}

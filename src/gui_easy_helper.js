/* GUIEasy  Copyright (C) 2019-2020  Jimmy "Grovkillen" Westberg */
// HERE WE PUT ALL OUR "THIS&THAT" FUNCTIONS
const helpEasy = {
    'copyToClipboard': function (str) {
        const el = document.createElement('textarea');
        el.value = str;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        const selected =
            document.getSelection().rangeCount > 0
                ? document.getSelection().getRangeAt(0)
                : false;
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        if (selected) {
            document.getSelection().removeAllRanges();
            document.getSelection().addRange(selected);
        }
        let eventDetails = {
            "type": "clipboard",
            "str": str
        };
        guiEasy.popper.tryCallEvent(eventDetails);
    },
    'swapKey2Value': function (json) {
        let ret = {};
        for(let key in json){
            ret[json[key]] = key;
        }
        return ret;
    },
    'rgb2hex': function (rgb) {
        rgb = rgb.split(",");
        let hex = "#";
        for (let i=0; i < rgb.length; i++) {
            hex += ( "0" + parseInt(rgb[i]).toString(16) ).substr(-2,2);
        }
        return hex;
    },
    'hex2rgb': function (hex) {
        return hex.match(/[A-Za-z0-9]{2}/g).map(function(v) { return parseInt(v, 16) }).join(",");
    },
    'invertHex': function (hex) {
        const hexCode = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
        let invertedHex = '#';
        hex.replace('#','').split('').forEach(i => {
            const index = hexCode.indexOf(i);
            invertedHex += hexCode.reverse()[index];
        });
        return invertedHex;
    },
    'int32binaryBool': function (obj, int, names, base, emptyString = "_emptyBit", length = 32) {
        let string = (int >>> 0).toString(2);
        //pad with zeros to make sure you got the correct number of 1/0 (MAX 64 int supported by the function
        string = ("0000000000000000000000000000000000000000000000000000000000000000" + string).slice(-length);
        let array = string.split("");
        for (let i = (array.length - 1); i > -1; i--) {
            let path = emptyString + i;
            if (names[i] !== undefined) {
                path = names[i];
            }
            set(obj, base + path, parseInt(array[i]));
        }
    },
    'cleanupWord' : function (word, commas = false) {
        word = word.replace(/_/g, " ");
        if (commas === true) {
            word = word.replace(/,/g, "<br>");
        }
        return word;
    },
    'capitalWord': function (str) {
        let allCaps = ["bin","ok","gpio","led","ssid","spi","wpa","ap","ip","esp","dns","id","i2c","sda","scl","ntp","dst","gui","json","mqtt","p2p","rssi","bssid","dhcp","cpu","ram","sta","gw","l/r","http","udp"];
        let words = str.toLowerCase().split(" ");
        for (let i = 0; i < words.length; i++) {
            //if the string is found in the allCaps or is starting and ending with parentheses it will be all caps.
            if (helpEasy.findInArray(words[i], allCaps) === true || (words[i].charAt(0) === "(" && words[i].charAt(words[i].length-1) === ")")) {
                words[i] = words[i].toUpperCase();
            } else if (words[i].charAt(0) === "(") {
                words[i] = "(" + words[i].charAt(1).toUpperCase() + words[i].substring(2);
            } else {
                words[i] = words[i].charAt(0).toUpperCase() + words[i].substring(1);
            }
        }
        return words.join(" ");
    },
    'epochToHHMMSS': function(epoch = Date.now()) {
        let time = new Date(epoch);
        let timeHH = ("0" + time.getHours()).substr(-2,2);
        let timeMM = ("0" + time.getMinutes()).substr(-2,2);
        let timeSS = ("0" + time.getSeconds()).substr(-2,2);
        return timeHH + ":" + timeMM + ":" + timeSS;
    },
    'pingIP': async function (ipArray, isUpFunction, isDownFunction) {
        //TODO: try to catch these intentional errors so we don't see them in the console.
        for (let i =0; i < ipArray.length; i++) {
            let ip = ipArray[i].ip;
            let startPing = Date.now();
            let ws = await new WebSocket("ws://" + ip);
            ws.onerror = function() {
                ws.close();
                ws = null;
                isUpFunction(ipArray, i, (Date.now() - startPing));
            };
            setTimeout(function() {
                if(ws != null) {

                    ws.close();

                    ws = null;
                    isDownFunction(ipArray, i);
                }
            },2000);
        }
    },
    'handlePingResults': function (array, index, ping = null) {
        array[index].ping = {};
        //This is just a pointer, not a real ping. We divide the results in 3 to get a "close to real" value
        if (ping === null) {
            array[index].ping.result = -1;
        } else {
            array[index].ping.result = Math.round(ping / 3);
        }

        array[index].ping.timestamp = Date.now();
    },
    'bumpScheduler': function (array, index, endpoint) {
        let nextRun = Date.now() + 10;
        let x = array[index]["scheduler"];
        for (let i = 0; i < x.length; i++) {
            if (x[i][1] === endpoint) {
                x.splice(i, 1);
                x.push([nextRun, endpoint]);
                x.sort();
            }
        }
    },
    'schedulerBump': function (array, endpoint) {
        let index = 0;
        for (let i = 0; i < array.length; i++) {
            if (array[i][1] === endpoint) {
                index = i;
            }
        }
        array[index][0] = Date.now();
        array.sort();
    },
    'schedulerDelay': function (array, index, delay) {
        for (let i = 0; i < array[index]["scheduler"].length; i++) {
            array[index]["scheduler"][i][0] += delay;
        }
        array[index].stats.error = 0;
    },
    'getDataFromNode': function (array, index, endpoint, ttl_fallback) {
        array[index]["scheduler"].shift();
        let timeStart = Date.now();
        let path = "http://" + array[index].ip + "/" + endpoint + "?callback=" + timeStart;
        fetch(path)
            .then(res => res.json())
            .then((dataFromFile) => {
                    array[index]["live"][endpoint] = dataFromFile;
                    array[index]["live"][endpoint].timestamp = Date.now();
                    if (dataFromFile.TTL !== undefined) {
                        //array[index]["live"][endpoint].TTL = dataFromFile.TTL;
                    } else {
                        array[index]["live"][endpoint].TTL = ttl_fallback;
                    }
                    //TODO: fix the TTL level on the logjson endpoint
                    if (endpoint === "logjson" && dataFromFile.Log.TTL !== undefined) {
                        array[index]["live"][endpoint].TTL = dataFromFile.Log.TTL;
                    }
                    //TODO: The if above is not needed if we move the TTL for the log to its correct place.
                    array[index]["live"][endpoint].TTL_fallback = ttl_fallback;
                    let nextRun = Date.now() + array[index]["live"][endpoint].TTL;
                    array[index]["scheduler"].push([nextRun, endpoint]);
                    array[index]["scheduler"].sort();
                    array[index].stats["lastRun"] = Date.now();
                    array[index].stats[endpoint].run = Date.now() - timeStart;
                    array[index].stats[endpoint].timestamp = Date.now();
                    array[index].stats.error = 0;
                }
            )
            .catch(error => {
                console.error('Error fetching (' + endpoint + '): ', error);
                array[index].stats.error++;
                let nextRun = Date.now() + array[index].stats[endpoint].TTL_fallback;
                array[index]["scheduler"].push([nextRun, endpoint]);
                array[index]["scheduler"].sort();
                array[index].stats["lastRun"] = Date.now();
                array[index].stats[endpoint].run = Date.now() - timeStart;
                array[index].stats[endpoint].timestamp = Date.now();
                guiEasy.fetchCount.error++;
            });
        guiEasy.fetchCount.current++;
        if (guiEasy.fetchCount.current === guiEasy.fetchCount.max) {
            guiEasy.current.live = index;
        }
    },
    'fetchConfigDat': function (array, index, updateBrowserSettings = true) {
        let timeStart = Date.now();
        //part of ppisljar's code
        let datFile = ["config.dat", "notification.dat", "security.dat"];
        let path_config = "http://" + array[index].ip + "/" + datFile[0] + "?callback=" + timeStart;
        let path_notice = "http://" + array[index].ip + "/" + datFile[1] + "?callback=" + timeStart;
        let path_security = "http://" + array[index].ip + "/" + datFile[2] + "?callback=" + timeStart;
        //TODO: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
        fetch(path_config)
            .then(res => res.arrayBuffer())
            .then(async (res) => {
                let x = helpEasy.parseConfigDat;
                let z = guiEasy.configDat;
                const settings = x(res, z.configDatParseConfig);

                [...Array(guiEasy.maxTasks())].map((x, i) => {
                    x = helpEasy.parseConfigDat;
                    settings.tasks[i].settings = x(res, z.taskSettings, 1024*4 + 1024 * 2 * i);
                    settings.tasks[i].extra = x(res, z.taskSettings, 1024*5 + 1024 * 2 * i);
                });

                [...Array(guiEasy.maxController())].map((x, i) => {
                    x = helpEasy.parseConfigDat;
                    settings.controllers[i].settings = x(res, z.controllerSettings, 1024*27 + 1024 * 2 * i);
                    settings.controllers[i].extra = x(res, z.controllerSettings, 1024*28 + 1024 * 2 * i);
                });

                const notificationResponse = await fetch(path_notice).then(res => res.arrayBuffer());
                [...Array(guiEasy.maxNotification())].map((x, i) => {
                    x = helpEasy.parseConfigDat;
                    settings.notifications[i].settings = x(notificationResponse, z.notificationSettings, 1024 * i);
                });

                //Only one setup of security is allowed for now (array length = 1)...
                const securityResponse = await fetch(path_security).then(res => res.arrayBuffer());
                settings.security = [...Array(1)].map((x, i) => {
                    x = helpEasy.parseConfigDat;
                    return x(securityResponse, z.securitySettings, 1024 * i);
                });

                array[index].settings = Object.assign({},settings);
                array[index].settings.timestamp = timeStart;

                guiEasy.configDat.variousBits();
                guiEasy.configDat.dst("start");
                guiEasy.configDat.dst("end");

                if (updateBrowserSettings === true) {
                    array[index].settingsBrowser = Object.assign({},settings);
                    array[index].settingsBrowser.timestamp = timeStart;
                }

                guiEasy.current.config = index;
                array[index].stats["lastRun"] = Date.now();
                if (array[index].stats["configDat"] === undefined) {
                    array[index].stats["configDat"] = {};
                }
                array[index].stats["configDat"].run = Date.now() - timeStart;
                array[index].stats["configDat"].timestamp = timeStart;
            })
    },
    'parseConfigDat': function (data, config, start) {
        //part of ppisljar's code
        const p = new DataParser(data);
        if (start) p.offset = start;
        const result = {};
        config.map(value => {
            const prop = value.length ? value.length : value.signed;
            set(result, value.prop, p[value.type](prop, value.signed));
        });
        return result;
    },
    'getCurrentIndex': function (type = "") {
        let indexObject = document.querySelectorAll("[data-current-index]")[0];
        if (type === "online") {
            return indexObject.dataset.currentOnline === "true";
        }
        return parseInt(indexObject.dataset.currentIndex);
    },
    'setCurrentIndex': function (index) {
        let indexObject = document.querySelectorAll("[data-current-index]")[0];
        indexObject.dataset.currentIndex = index;
        indexObject.dataset.currentOnline = "true";
    },
    'setCurrentOnline': function (state) {
        let indexObject = document.querySelectorAll("[data-current-index]")[0];
        if (state === "online") {
            indexObject.dataset.currentOnline = "true";
        } else {
            indexObject.dataset.currentOnline = "false";
        }
    },
    'scheduleFetch': function (array, index, endpoint) {
        if (array[index].stats === undefined) {
            array[index].stats = {"error": 0};
        }
        if (endpoint === undefined) {
            //first run
            let endpoints = guiEasy.endpoints.get;
            guiEasy.fetchCount = {"max": 0, "current": 0, "error": 0};
            array[index]["live"] = {};
            array[index]["history"] = {};
            array[index]["scheduler"] = [];
            for (let i=0; i < endpoints.length; i++) {
                let endpoint = endpoints[i].endpoint;
                if (endpoints[i].ttl_fallback === undefined || endpoints[i].ttl_fallback > guiEasy.endpoints.defaultTTL()) {
                    //These endpoints can be fetched once the gui has loaded... to speed up build-up
                    array[index].stats[endpoint] = {
                        "TTL_fallback": guiEasy.endpoints.defaultTTL(),
                        "run": -1,
                        "timestamp": Date.now()
                    };
                    let nextRun = Date.now() + i * guiEasy.fetchSettings.intervalTimeKeeper + 2000;
                    array[index]["scheduler"].push([nextRun, endpoint]);
                    array[index]["scheduler"].sort();
                } else {
                    array[index].stats[endpoint] = {
                        "TTL_fallback": endpoints[i].ttl_fallback,
                        "run": -1,
                        "timestamp": Date.now()
                    };
                    array[index]["scheduler"].push([0, endpoint]);
                    array[index]["scheduler"].sort();
                    let delayExecution = guiEasy.fetchCount.max * guiEasy.fetchSettings.intervalTimeKeeper;
                    setTimeout(function (){
                        helpEasy.getDataFromNode(array, index , endpoint, endpoints[i].ttl_fallback);
                    }, delayExecution);
                    guiEasy.fetchCount.max++;
                }
            }
        } else {
            //relay runner
            let x = guiEasy.fetchSettings;
            let TTL_fallback = array[index].stats[endpoint].TTL_fallback;
            helpEasy.getDataFromNode(array, index , endpoint, TTL_fallback);
            // take a snapshot (plus timestamp it) of the endpointData array and store it
            let temp = Object.assign({}, array[index]["live"][endpoint]);
            temp.fetched = Date.now();
            if (array[index]["history"][endpoint] === undefined) {
                array[index]["history"][endpoint] = [];
            }
            array[index]["history"][endpoint].push(temp);
            if ( array[index]["history"][endpoint].length > ( x.maxToKeep * x.maxToKeepMs - 1 )) {
                array[index]["history"][endpoint].shift();
            }
        }
    },
    'getGuiInFields': function () {
        if (guiEasy.jsonPathsIN === undefined) {
            guiEasy.jsonPathsIN = [];
        }
        let z = guiEasy.jsonPathsIN;
        let x = document.querySelectorAll("[data-json-path]");
        for (let i = 0; i < x.length; i++) {
            let y = x[i].dataset.jsonPath;
            if (helpEasy.findInArray(y,z) === false) {
                z.push(y);
            }
        }
        if (guiEasy.jsonPathsSettings === undefined) {
            guiEasy.jsonPathsSettings = [];
        }
        z = guiEasy.jsonPathsSettings;
        x = document.querySelectorAll("[data-settings]");
        for (let i = 0; i < x.length; i++) {
            let y = x[i].dataset.settings;
            if (helpEasy.findInArray(y,z) === false) {
                z.push(y);
            }
        }
        return z;
    },
    'wifilist': function (wifiArray, index) {
        let html = `
                <div data-modal-table="wifi" class="container modal-table" id="wifilist">
                <table>
                <tr>
                    <th class="header">SSID</th>
                    <th class="header">BSSID</th>
                    <th class="header">Ch</th>
                    <th class="header">Signal</th>
                </tr>
         `;
        let sameSSID = "";
        let sameBSSID = [];
        let sameChannel = [];
        let sameRSSI = [];
        let sorted = wifiArray.sort(helpEasy.sortObjectArray("SSID"));
        for (let i = 0; i < sorted.length; i++) {
            sameSSID = sorted[i].SSID;
            sameBSSID.push(sorted[i].BSSID);
            sameChannel.push(sorted[i].Channel);
            sameRSSI.push(sorted[i].RSSI);
            if (i < (sorted.length - 1) && sorted[i].SSID === sorted[(i + 1)].SSID) {
                //
            } else {
                html += "<tr><td>" + sameSSID + "</td><td class='text-little'>";
                for (let i = 0; i < sameBSSID.length; i++) {
                    if (sameBSSID[i] === guiEasy.nodes[helpEasy.getCurrentIndex()].live.json.WiFi.BSSID) {
                        html += "<div class='text-main-bg'>" + sameBSSID[i] + "</div>";
                    } else {
                        html += sameBSSID[i];
                    }
                    if (i !== (sameBSSID.length - 1)) {
                        html += "<hr>";
                    } else {
                        html += "</td><td class='text-little'>";
                    }
                }
                for (let i = 0; i < sameChannel.length; i++) {
                    html += sameChannel[i];
                    if (i !== (sameChannel.length - 1)) {
                        html += "<hr>";
                    } else {
                        html += "</td><td class='text-little'>";
                    }
                }
                for (let i = 0; i < sameRSSI.length; i++) {
                    html += "<div class='got-tooltip hidden-tooltip'>";
                    html += helpEasy.rssiToSVG(sameRSSI[i]);
                    if (i !== (sameRSSI.length - 1)) {
                        html += "<div class='tooltip text-tiny'>" + sameRSSI[i] + " dBm</div></div><hr>";
                    } else {
                        html += "<div class='tooltip text-tiny'>" + sameRSSI[i] + " dBm</div></div></td></tr>";
                    }
                }
                sameSSID = "";
                sameBSSID = [];
                sameChannel = [];
                sameRSSI = [];
            }
        }
        html += `
                </table>
                <div class='text-tiny is-left'>` + wifiArray.length + ` separate APs found</div>
                <div class='text-tiny is-left'>Fetched: ` + helpEasy.epochToHHMMSS(wifiArray.timestamp) + `</div>
                <div class='text-tiny is-left'>Scheduled: ` + helpEasy.epochToHHMMSS(wifiArray.timestamp + wifiArray.TTL) + `</div>
                </div>
                `;
        set(guiEasy.nodes[index], "modal.table.wifi", html);
    },
    'filelist': function (filelistArray, index) {
        let noDeleteFile = ["notification.dat","config.dat","security.dat"];
        let deletingFile = guiEasy.nodes[helpEasy.getCurrentIndex()].deleteFile;
        guiEasy.nodes[helpEasy.getCurrentIndex()].deleteFile = null;
        let html = `
                <div data-modal-table="files" class="container modal-table" id="filelist">
                <table>
                <tr>
                    <th class="header">File Name</th>
                    <th class="header">Size</th>
                </tr>
         `;
        let sorted = filelistArray.sort(helpEasy.sortObjectArray("fileName"));
        for (let i = 0; i < sorted.length; i++) {
            let rowInactive = "";
            if (deletingFile === sorted[i].fileName) {
                rowInactive = "class='is-inactive'";
            }
            html += `
                    <tr ` + rowInactive + ` id="` + sorted[i].fileName + `">
                    <td><button
                        class="main-inverted"
                        onclick="helpEasy.downloadFile('http://` + guiEasy.nodes[helpEasy.getCurrentIndex()].ip + `/`
                         + encodeURI(sorted[i].fileName) + `','` + sorted[i].fileName + `');">`
                         + sorted[i].fileName +
                     `</button>`;
            if (noDeleteFile.indexOf(sorted[i].fileName) === -1) {
                  html += `    
                    <button
                        class="main-warning file-action"
                        data-click="delete-file"
                        data-filename="` + sorted[i].fileName + `"">
                        ` + guiEasy.curly.icon(["trash"]) + `
                    </button>
                   `;
            }
            html += `
                    </td>
                    <td>
                        ` + (Math.floor(sorted[i].size / 1024 *10) / 10) + `kB
                    </td>
                    </tr>
            `;
        }
        html += "</table></div>";
        set(guiEasy.nodes[index], "modal.table.files", html);
    },
    'timingstatsList': function (timingArray, index) {
        let unsorted = [];
        let endpoints = ["plugin", "controller", "misc"];
        for (let k = 0; k < endpoints.length; k++) {
            let x = timingArray[endpoints[k]];
            for (let i = 0; i < x.length; i++) {
                let func = x[i]["function"][0];
                let keys = Object.keys(func);
                for (let j = 0; j < keys.length; j++) {
                    unsorted.push(
                        {
                            "sortValue": parseFloat(func[keys[j]].avg),
                            "name": x[i].name,
                            "subKey": keys[j],
                            "subLevels": keys.length,
                            "type": endpoints[k].slice(0,1).toUpperCase(),
                            "id": x[i].id,
                            "avg": func[keys[j]].avg,
                            "count": func[keys[j]].count,
                            "call-per-sec": func[keys[j]]["call-per-sec"],
                            "min": func[keys[j]].min,
                            "max": func[keys[j]].max,
                            "unit": func[keys[j]].unit
                        }
                    );
                }
            }
        }
        let sorted = unsorted.sort(helpEasy.sortObjectArray("sortValue"));
        let html = `
                <div data-modal-table="timingstats_json" class="container modal-table" id="timingstats_json">
                <table class="is-left">
                <tr>
                    <th class="header">Type</th>
                    <th class="header is-left">Timer</th>
                    <th class="header">Process</th>
                </tr>
         `;
        for (let i = (sorted.length - 1); i > -1; i--) {
            let extraRow = "";
            if (sorted[i].subLevels > 1) {
                extraRow = "<hr>" + sorted[i].subKey;
            }
            html += `
                    <tr class="text-little">
                    <td>
                        ` + sorted[i].type + ("000" + sorted[i].id).slice(-3) + `
                    </td>
                    <td class="got-tooltip hidden-tooltip">
                        ` + sorted[i].sortValue + `
                        <div class="tooltip is-left">
                            avg: ` + sorted[i].avg + `<br>
                            min: ` + sorted[i].min + `<br>
                            max: ` + sorted[i].max + `<br>
                            count: ` + sorted[i].count + `<br>
                            per sec: ` + sorted[i]["call-per-sec"] + `
                        </div>
                    </td>
                    <td>
                        ` + sorted[i].name + extraRow + `
                    </td>
                    </tr>
            `;
        }
        html += `
                </table>
                <div class='text-tiny is-left'>Fetched: ` + helpEasy.epochToHHMMSS(timingArray.timestamp) + `</div>
                <div class='text-tiny is-left'>Scheduled: ` + helpEasy.epochToHHMMSS(timingArray.timestamp + timingArray.TTL) + `</div>
                </div>
                `;
        set(guiEasy.nodes[index], "modal.table.timingstats_json", html);
    },
    'twoLevelJsonToList': function (endpoint, index) {
        let x = guiEasy.nodes[index].live[endpoint];
        let html = "<div data-modal-table='" + endpoint + "' class='container modal-table' id='" + endpoint + "'>";
        let keysLevel1 = Object.keys(x);
        for (let i = 0; i < keysLevel1.length; i++) {
            let keysLevel2 = Object.keys(x[keysLevel1[i]]);
            if (keysLevel2.length < 1) {
                continue;
            }
            html += "<div class='is-left'>" + helpEasy.capitalWord(helpEasy.cleanupWord(keysLevel1[i])) + "</div>";
            html += "<table>";
            for (let j = 0; j < keysLevel2.length; j++) {
                let valueName = helpEasy.cleanupWord(keysLevel2[j]);
                let value = helpEasy.cleanupWord(x[keysLevel1[i]][keysLevel2[j]], true);
                if (value === "ThisIsTheDummyPlaceHolderForTheBinaryFilename64ByteLongFilenames") {
                    value = "...";
                }
                html += "<tr><td>" + helpEasy.capitalWord(valueName) + "</td><td>" + value + "</td></tr>";
            }
            html += "</table>";
        }
        html += `
                <div class='text-tiny is-left'>Fetched: ` + helpEasy.epochToHHMMSS(x.timestamp) + `</div>
                <div class='text-tiny is-left'>Scheduled: ` + helpEasy.epochToHHMMSS(x.timestamp + x.TTL) + `</div>
                </div>
                `;
        set(guiEasy.nodes[index], "modal.table." + endpoint , html);
        return html;
    },
    'guiUpdater': function () {
        let timeStart = Date.now();
        let index = helpEasy.getCurrentIndex();
        let x = guiEasy.nodes[index];
        if (guiEasy.jsonPathsIN === undefined) {
            guiEasy.jsonPathsIN = [];
        }
        let y = guiEasy.jsonPathsIN;
        for (let i = 0; i < y.length; i++) {
            let z = document.querySelectorAll("[data-json-path='" + y[i] + "']");
            for (let k = 0; k < z.length; k++) {
                let path = y[i].split("--");
                for (let u = 0; u < path.length; u++) {
                    if (z[k].innerHTML !== helpEasy.getjsonPathData(path, x)) {
                        z[k].innerHTML = helpEasy.getjsonPathData(path, x);
                    }
                }
            }
        }
        //update tab text
        //TODO: make it possible to have live data feed on tab
        let path = ("live--json--System--Unit Name").split("--");
        document.title = helpEasy.getjsonPathData(path, x);
        //update wifi icon(s)
        path = ("live--json--WiFi--RSSI").split("--");
        let bars = helpEasy.rssiToBars(helpEasy.getjsonPathData(path, x));
        let z = document.querySelectorAll("[name=unit-wifi-rssi-icon]");
        for (let i = 0; i < z.length; i++) {
            z[i].classList.remove("level-1","level-2","level-3","level-4","level-5");
            z[i].classList.add(bars);
        }
        //update system gauges
        z = document.querySelectorAll("[data-json-path-gauge]");
        for (let i = 0; i < z.length; i++) {
            helpEasy.gaugeLevel(z[i], x);
        }
        //update wifi modal path                                //TODO: consolidate these since they are essentially equal
        if (x.live.wifiscanner_json !== undefined) {
            helpEasy.wifilist(x.live.wifiscanner_json, index);
        } else {
            let pendingText = "<div data-modal-table='wifi' class='container modal-table'>" + guiEasy.fetchingWait + "</div>";
            set(guiEasy.nodes[index], "modal.table.wifi", pendingText);
        }
        //update files modal path
        if (x.live.filelist_json !== undefined) {
            helpEasy.filelist(x.live.filelist_json, index);
        } else {
            let pendingText = "<div data-modal-table='files' class='container modal-table'>" + guiEasy.fetchingWait + "</div>";
            set(guiEasy.nodes[index], "modal.table.files", pendingText);
        }
        //update sysinfo modal path
        if (x.live.sysinfo_json !== undefined) {
            helpEasy.twoLevelJsonToList("sysinfo_json", index);
        } else {
            let pendingText = "<div data-modal-table='sysinfo_json' class='container modal-table'>" + guiEasy.fetchingWait + "</div>";
            set(guiEasy.nodes[index], "modal.table.sysinfo_json", pendingText);
        }
        //update timingstats modal path
        if (x.live.timingstats_json !== undefined) {
            helpEasy.timingstatsList(x.live.timingstats_json, index);
        } else {
            let pendingText = "<div data-modal-table='timingstats_json' class='container modal-table'>" + guiEasy.fetchingWait + "</div>";
            set(guiEasy.nodes[index], "modal.table.timingstats_json", pendingText);
        }
        //update tables
        z = document.querySelectorAll("[data-modal-table]");
        for (let i = 0; i < z.length; i++) {
            let type = z[i].dataset.modalTable;
            let data = guiEasy.nodes[index].modal.table[type];
            let newInnerHTML = helpEasy.parseHTMLstring(data, "query", '[data-modal-table="' + type + '"]');
            if (z[i].innerHTML !== newInnerHTML) {
                z[i].innerHTML = newInnerHTML
            }
        }
        //task values update, and we need to clean up the non-live once if there's any
        let t = guiEasy.maxTasks();
        let v = guiEasy.maxValuesPerTask();
        x = guiEasy.nodes[index].live.json.Sensors;
        let valueMatrix = [...Array(t)].map(x=>Array(v).fill(""));
        let taskMatrix = [...Array(t)].fill("");
        for (let i = 0; i < x.length; i++) {
            let values = x[i].TaskValues;
            let controllers = x[i].DataAcquisition;
            let taskNumber = x[i].TaskNumber;
            let taskName = x[i].TaskName;
            let taskEnabled = x[i].TaskEnabled;
            let plugin = x[i].Type;
            let pluginNumber = "P" + ("000" + x[i].TaskDeviceNumber).slice(-3);
            taskMatrix[(taskNumber - 1)] = {
                "plugin": plugin,
                "port": "",
                "controller": "",
                "gpio": "",
                "enabled": taskEnabled,
                "name": taskName
            };
            for (let j = 0; j < values.length; j++) {
                let valueName = values[j].Name;
                let value = values[j].Value;
                let valueNumber = values[j].ValueNumber;
                let valueDecimals = values[j].NrDecimals;
                valueMatrix[(taskNumber - 1)][(valueNumber - 1)] = {
                    "name": valueName,
                    "value": value.toFixed(valueDecimals)
                }
            }
        }
        for (let i = 0; i < t; i++) {
            if (taskMatrix[i].name === undefined) {
                helpEasy.clearTaskValues(i);
                continue;
            }
            let pathT = "task-" + (i + 1) + "-";
            let keys = ["plugin", "port", "controller", "gpio"];
            for (let k = 0; k < keys.length; k++) {
                let keyPath = keys[k];
                if (taskMatrix[i][keyPath] !== "") {
                    if (document.getElementById(pathT + keyPath).innerText !== taskMatrix[i][keyPath]) {
                        document.getElementById(pathT + keyPath).innerText = taskMatrix[i][keyPath];
                    }
                    document.getElementById(pathT + keyPath + "-row").classList.remove("is-hidden");
                }
            }
            //the name is on the values column
            if (document.getElementById(pathT + "name").innerText !== taskMatrix[i].name) {
                document.getElementById(pathT + "name").innerText = taskMatrix[i].name;
            }
            for (let j = 0; j < v; j++) {
                if (valueMatrix[i][j] === "" || valueMatrix[i][j].name === "") {
                    helpEasy.clearTaskValues(i, j);
                    continue;
                }
                let pathV = pathT + "value-" + (j + 1) + "-";
                document.getElementById(pathV + "row").classList.remove("is-hidden");
                if (taskMatrix[i].enabled === "true") {
                    document.getElementById(pathV + "row").classList.remove("not-enabled");
                } else {
                    document.getElementById(pathV + "row").classList.add("not-enabled");
                }
                if (j > 0) {
                    document.getElementById(pathV + "hr").classList.remove("is-hidden");
                }
                if (document.getElementById(pathV + "name").innerText !== valueMatrix[i][j].name) {
                    document.getElementById(pathV + "name").innerText = valueMatrix[i][j].name;
                }
                if (document.getElementById(pathV + "value").innerText !== valueMatrix[i][j].value) {
                    document.getElementById(pathV + "value").innerText = valueMatrix[i][j].value;
                }
            }
        }
        //populate the stats
        guiEasy.current.gui = index;
        if (guiEasy.nodes[index].stats["gui"] === undefined) {
            guiEasy.nodes[index].stats["gui"] = {};
        }
        guiEasy.nodes[index].stats["gui"].run = Date.now() - timeStart;
        guiEasy.nodes[index].stats["gui"].timestamp = timeStart;
    },
    'clearTaskValues': function (taskNumber, valueNumber = null) {
        let v = guiEasy.maxValuesPerTask();
        let s;
        let x = [];
        let h;
        let y = [];
        //set the innerText/HTML to ""
        if (valueNumber !== null) {
            for (let i = 1; i <= v; i++) {
                s = document.querySelectorAll("[id='task-" + (taskNumber+1) + "-value-" + (valueNumber+i) + "-name']");
                if (s.length > 0) {
                    x.push([].slice.call(s));
                }
                s = document.querySelectorAll("[id='task-" + (taskNumber+1) + "-value-" + (valueNumber+i) + "-value']");
                if (s.length > 0) {
                    x.push([].slice.call(s));
                }
                h = document.getElementById("task-" + (taskNumber+1) + "-value-" + (valueNumber+i) + "-hr");
                if (h !== null) {
                    y.push(h);
                }
            }
            if (x.length > 0) {
                x.map(e => e.map(
                    z => z.innerHTML = ""
                ));
            }
            if (y.length > 0) {
                y.map(e => e.classList.add("is-hidden"));
            }
        } else {
            s = document.querySelectorAll("[data-clear-task='" + (taskNumber + 1) + "']");
            if (s.length > 0) {
                x = [].slice.call(s);
            }
            if (x.length > 0) {
                x.map(e => e.innerHTML = "");
            }
            h = document.querySelectorAll("[data-clear-hr='" + (taskNumber + 1) + "']");
            if (h.length > 0) {
                y = [].slice.call(h);
            }
            if (y.length > 0) {
                y.map(e => e.classList.add("is-hidden"));
            }
            h = document.querySelectorAll("[data-hide-row='" + (taskNumber + 1) + "']");
            if (h.length > 0) {
                y = [].slice.call(h);
            }
            if (y.length > 0) {
                y.map(e => e.classList.add("is-hidden"));
            }
        }
    },
    'downloadFile': function (url, fileName) {
        fetch(url).then(function(t) {
            return t.blob().then((b)=>{
                    let a = document.createElement("a");
                    a.href = URL.createObjectURL(b);
                    a.download = fileName;
                    a.click();
                }
            );
        });
    },
    'uploadBinaryAsFile': function (what, file, elementID) {
        let uploadSpeed;  //This is a bogus value just to get the upload percentage until fetch have this natively!
        let maxSize;
        let endpoint;
        let label = document.getElementById("label-" + elementID);
        let labelText = label.innerText;
        if (what === "generic") {
            uploadSpeed = 35;  //this is an average speed for generic files
            endpoint = "/upload";
            maxSize = guiEasy.nodes[helpEasy.getCurrentIndex()].live.sysinfo_json.storage.spiffs_free;
        }
        if (what === "firmware") {
            helpEasy.schedulerDelay(guiEasy.nodes, helpEasy.getCurrentIndex(), 60 * 1000);
            uploadSpeed = 25;  //since the firmware is also written and not only uploaded the speed is a bit lower compared to the generic upload...
            endpoint = "/update";
            maxSize = guiEasy.nodes[helpEasy.getCurrentIndex()].live.sysinfo_json.storage.sketch_free;
        }
        maxSize = maxSize * 1000;
        if (maxSize < file.size) {
            label.innerText = helpEasy.capitalWord("file size too big!");
            helpEasy.blinkElement(label.id, "warning");
            setTimeout(function () {
                helpEasy.blinkElement(label.id, "warning");
            }, 500);
            setTimeout(function () {
                label.innerText = labelText;
            }, 750);
        } else {
            label.innerText = file.name;
            let timeout = 100;
            let fullUpload = file.size / uploadSpeed / timeout;
            let i = 0;
            let timer = setInterval(function () {
                i++;
                let percentage = Math.floor(i / fullUpload * 100);
                if (percentage > 100) {
                    percentage = 100;
                }
                label.innerText = file.name + " (" + percentage + "%)";
            }, timeout);
            let formData = new FormData();
            formData.append("file", file);
            formData.append("name", what);
            formData.append("enctype", "multipart/form-data");
            let url = "http://" + guiEasy.nodes[helpEasy.getCurrentIndex()].ip + endpoint;
            fetch(url, {
                method : "POST",
                body: formData
            }).then(
                response => response.text()
            ).then(
                html => {
                    clearInterval(timer);
                    label.innerText = file.name + " (100%)";
                    helpEasy.addToLogDOM(html, 3);
                    setTimeout(function () {
                        helpEasy.blinkElement(label.id, "success");
                    }, 500);
                    if (what === "generic") {
                        setTimeout(function () {
                            helpEasy.schedulerBump(guiEasy.nodes[helpEasy.getCurrentIndex()].scheduler, "sysinfo_json");
                            helpEasy.schedulerBump(guiEasy.nodes[helpEasy.getCurrentIndex()].scheduler, "filelist_json");
                            label.innerText = labelText;
                            helpEasy.updateIndicator();
                        }, 900);
                    }
                    if (what === "firmware") {
                        helpEasy.schedulerBump(guiEasy.nodes[helpEasy.getCurrentIndex()].scheduler, "sysinfo_json");
                        let count = 30;
                        let countdown = setInterval(function () {
                            label.innerText = "Will reboot in " + count;
                            count--;
                            if (count < 1) {
                                clearInterval(countdown);
                                location.reload();
                            }
                        }, 1000);
                    }
                }
            );
        }
    },
    'updateIndicator': async function () {
        setTimeout(function () {
            let storage = guiEasy.nodes[helpEasy.getCurrentIndex()].live.sysinfo_json.storage;
            let availablePercentage = Math.floor(parseInt(storage.spiffs_free) / parseInt(storage.spiffs_size) * 100);
            let free = document.getElementById("modal-input-upload-storage-free");
            let occupied = document.getElementById("modal-input-upload-storage-occupied");
            free.style.width = availablePercentage + "%";
            free.innerText = parseInt(storage.spiffs_free) + "kB";
            occupied.style.width = (100 - availablePercentage) + "%";
            occupied.innerText = (parseInt(storage.spiffs_size) - parseInt(storage.spiffs_free)).toString() + "kB";
        }, 5000);
    },
    'parseHTMLstring': function (string, parse, query) {
        //Will only return first object's inner html
        let temp = document.createElement( 'html' );
        temp.innerHTML = string;
        let results = "";
        if (parse === "tag") {
            results = temp.getElementsByTagName(query)[0].innerHTML.toString();
        }
        if (parse === "name") {
            results = temp.getElementsByName(query)[0].innerHTML.toString();
        }
        if (parse === "class") {
            results = temp.getElementsByClassName(query)[0].innerHTML.toString();
        }
        if (parse === "id") {
            results = temp.getElementById(query).innerHTML.toString();
        }
        if (parse === "query") {
            results = temp.querySelectorAll(query)[0].innerHTML.toString();
        }
        temp.remove();
        return results;
    },
    'guiUpdaterSettings': function (type) {
        let x = guiEasy.nodes[helpEasy.getCurrentIndex()];
        let u = defaultSettings;
        let y = helpEasy.getGuiInFields();
        if (type === undefined) {
            type = "settings";
        } else {
            type = "settingsBrowser";
        }
        for (let i = 0; i < y.length; i++) {
            let z = document.querySelectorAll("[data-settings='" + y[i] + "']");
            for (let k = 0; k < z.length; k++) {
                let m = x;
                let path = (type + "--" + y[i]).split("--");
                if (y[i].split("--")[0] === "defaultSettings") {
                    path = y[i].split("--").slice(1);
                    m = u;
                }
                for (let u = 0; u < path.length; u++) {
                    let d = z[k].dataset;
                    //populate by type of setting
                    if (d.type === "string") {
                        z[k].value = helpEasy.getjsonPathData(path, m);
                        if (d.settingsIp === "true") {
                            z[k].value = helpEasy.getjsonPathData(path, m).join(".");
                        }
                        if (d.valueIfBlank === z[k].value) {
                            z[k].value = "";
                        }
                    }
                    if (d.type === "dropdown") {
                        if (d.list2value === "true") {
                            let optionList = [];
                            for (let i = 0; i < z[k].options.length; i++) {
                                optionList.push(parseInt(z[k].options[i].value));
                            }
                            z[k].options.selectedIndex = optionList.indexOf(helpEasy.getjsonPathData(path, m)) - parseInt(z[k].dataset.optionListOffset);
                        } else {
                            if (helpEasy.getjsonPathData(path, m) === 255) {
                                z[k].options.selectedIndex = 0;
                            } else {
                                z[k].options.selectedIndex = helpEasy.getjsonPathData(path, m) - parseInt(z[k].dataset.optionListOffset);
                            }
                        }
                    }
                    if (d.type === "password") {
                        z[k].value = helpEasy.getjsonPathData(path, m);
                        if (d.valueIfBlank === z[k].value) {
                            z[k].value = "";
                        }
                    }
                    if (d.type === "number") {
                        z[k].value = helpEasy.getjsonPathData(path, m);
                    }
                    if (d.type === "toggle") {
                        z[k].checked = d["change-" + helpEasy.getjsonPathData(path, m)] === "true";
                        let label = document.getElementById("label-" + d.id);
                        if (d.gotTooltip === "") {
                            label.innerText = helpEasy.capitalWord(d[z[k].checked + "Text"]);
                        } else {
                            label.innerHTML = "<div class=" + d.gotTooltip + ">" + helpEasy.capitalWord(d[z[k].checked + "Text"]) + d.tooltip + "</div>";
                        }
                    }
                }
            }
        }
    },
    'gaugeLevel': function (gauge, jsonData) {
        let parent = gauge.parentNode;
        let currentValue = helpEasy.getjsonPathData(gauge.dataset.jsonPathGauge.split("--"), jsonData);
        let max = parseInt(gauge.dataset.max);
        let min = parseInt(gauge.dataset.min);
        let minPosition = 574.5;
        let maxPosition = 0;
        let currentPosition;
        let warningLevel = 0.8;         //TODO: move these to settings!
        let infoLevel = 0.6;
        let successLevel = 0.05;
        let gaugeColor = "";
        let test;
        if (max > min) {
            //normal type
            test = (currentValue - min)/(max - min);
            if (test > infoLevel) {
                gaugeColor = "main-info";
            }
            if (test > warningLevel) {
                gaugeColor = "main-warning";
            }
            if (test < successLevel) {
                gaugeColor = "main-success";
            }
        } else {
            //reversed type
            test = (currentValue - max)/(min - max);
            if (test < (1 - infoLevel)) {
                gaugeColor = "main-info";
            }
            if (test < (1 - warningLevel)) {
                gaugeColor = "main-warning";
            }
            if (test > (1 - successLevel)) {
                gaugeColor = "main-success";
            }
        }
        currentPosition = (1-test)*minPosition;
        if (currentPosition > minPosition) {
            currentPosition = minPosition;
        }
        if (currentPosition < maxPosition) {
            currentPosition = maxPosition;
        }
        parent.classList.remove("main-info","main-warning");
        if (gaugeColor !== "") {
            parent.classList.add(gaugeColor);
        }
        gauge.style = "stroke-dashoffset:" + currentPosition + ";";
    },
    'rssiToBars': function (rssi) {
        if (rssi >= -55) {
            return "level-5";
        }
        if (rssi >= -66) {
            return "level-4";
        }
        if (rssi >= -77) {
            return "level-3";
        }
        if (rssi >= -88) {
            return "level-2";
        }
        return "level-1";
    },
    'rssiToSVG': function (rssi) {
        let level = helpEasy.rssiToBars(rssi);
        return guiEasy.curly.icon(["wifi", level]);
    },
    'getjsonPathData': function (path, json) {
        //TODO: this can probably be made more elegant?
        if (path.length === 1) {
            return json[path[0]];
        }
        if (path.length === 2) {
            return json[path[0]][path[1]];
        }
        if (path.length === 3) {
            return json[path[0]][path[1]][path[2]];
        }
        if (path.length === 4) {
            return json[path[0]][path[1]][path[2]][path[3]];
        }
        if (path.length === 5) {
            return json[path[0]][path[1]][path[2]][path[3]][path[4]];
        }
        if (path.length === 6) {
            return json[path[0]][path[1]][path[2]][path[3]][path[4]][path[5]];
        }
        if (path.length === 7) {
            return json[path[0]][path[1]][path[2]][path[3]][path[4]][path[5]][path[6]];
        }
        if (path.length === 8) {
            return json[path[0]][path[1]][path[2]][path[3]][path[4]][path[5]][path[6]][path[7]];
        }
    },
    'sortObjectArray': (propName) =>
        (a, b) => a[propName] === b[propName] ? 0 : a[propName] < b[propName] ? -1 : 1
    ,
    'addToLogDOM': function (str, level, type = "log") {
        if (str === "pageSize") {
            str = document.documentElement.innerHTML.toString().split("").length;
            let currentSize = guiEasy.guiStats.pageSize;
            if (currentSize === 0) {
                guiEasy.guiStats["startSize"] = str;
            }
            guiEasy.guiStats.pageSize += str;
            str = "total page size: " + Math.round(str/1024) + "kB";
        }
        if (guiEasy.logLevel >= level) {
            msg[type](str);
        }
    },
    'numberOfFound': function (str, pattern) {
        return ((str || '').match(pattern) || []).length;
    },
    'findInArray': function (needle, haystack) {
        let found = haystack.indexOf(needle);
        return found > -1;
    },
    'listOfProcesses': function (processID, processText, timestamp, type) {
        let logElement = document.getElementById("modal-loading-log");
        let progressElement = document.getElementById("modal-loading-progress");
        let spinnerElement = document.getElementById("fallback-loading-animation");
        spinnerElement.classList.add("is-hidden");
        logElement.innerHTML += "<div class='" + type + "' id='log-entry-" + processID + "' data-timestart='" + timestamp + "'>" + processText + "</div>";
        progressElement.max = guiEasy[type].length;
        if (guiEasy.guiStats[type] === undefined) {
            guiEasy.guiStats[type] = {};
        }
        guiEasy.guiStats[type][processID] = "running";
    },
    'processDone': function (processID, type) {
        let progressElement = document.getElementById("modal-loading-progress");
        let logRow = document.getElementById("log-entry-" + processID);
        let runtime = Date.now() - logRow.dataset.timestart;
        guiEasy.guiStats.bootTime += runtime;
        logRow.innerHTML += " (" + runtime + "ms)";
        logRow.classList.add("loading-is-done");
        if (type === "startup") {
            if (progressElement.max === progressElement.value) {
                //lets close the loading page
                let modalBackground = document.getElementById("modal-container");
                let loadingPage = document.getElementById("modal-loading-screen");
                modalBackground.classList.remove("is-black");
                modalBackground.classList.add("is-hiding");
                loadingPage.classList.add("is-hidden");
                setTimeout(function () {
                    modalBackground.classList.add("is-hidden");
                    modalBackground.classList.remove("is-hiding");
                }, (500));
                helpEasy.addToLogDOM("total boot time: " + guiEasy.guiStats.bootTime + "ms", 1);
            }
            progressElement.value++;
        }
        guiEasy.guiStats[type][processID] = "done";
    },
    'internet': function () {
        let internet = false;
        if (window.navigator.onLine === true) {
            internet = true;
        }
        return internet;
    },
    'welcomePhrase': function () {
        let now = new Date;
        let hour = now.getHours();
        if (hour > 17) {
            return "Good evening!"
        }
        if (hour > 11) {
            return "Good afternoon!"
        }
        if (hour > 5) {
            return "Good morning!"
        }
        return "Hi!"
    },
    'urlParams': function () {
        let params = {};
        window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            params[key.toLowerCase()] = value.toLowerCase();
        });
        return params;
    },
    'locationByIP': async function () {
        let timestamp = Date.now();
        let path = "https://ipapi.co/json" + "?at=" + timestamp + "&gui=" + guiEasy.geekNameFull();
        let response = await fetch(path);
        return await response.json();
    },
    'blinkElement': function (id, color) {
        let fontName = document.getElementById(id);
        fontName.classList.add("main-" + color);
        setTimeout(function (){
            fontName.classList.remove("main-" + color);
        }, 250)
    },
    'dashGroupContainerOpen': function (title = "") {
        if (title === "") {
            return "<div class='group-container'>";
        } else {
            return "<div class='group-container'>" + helpEasy.capitalWord(title) + "<hr>";
        }
    },
    'dashBoxContainerOpen': function () {
        return "<div class='box-container'>";
    },
    'dashContainerClose': function () {
        return "</div>";
    },
    'addToolsButton': function (args) {
        let html = "";
        let type = args.type;
        let color = "";
        if (args.color !== undefined) {
            color = " main-" + args.color;
        }
        if (type === "command") {
            html += `
                <div class='dash-box'>
                    <button class='dash-button` + color + `' data-click="` + args.buttonAction + `" data-args="`
                        + JSON.stringify(args).replace(/"/g, "'")
                        + `">{{ICON-` + args.icon.toUpperCase() + `}}</button>
                    <div class="dash-text text-little">` + helpEasy.capitalWord(args.text) + `</div>
                </div>
            `;
        }
        if (type === "info") {
            html += `
                <div class='dash-box'>
                    <button data-click="` + args.buttonAction + `">` + helpEasy.capitalWord(args.button) + `</button>
                    <div class="dash-text text-little">` + helpEasy.capitalWord(args.text) + `</div>
                </div>
            `;
        }
        if (type === "scanner") {
            html += `
                <div class='dash-box'>
                    <button class='main-inverted' data-click="` + args.buttonAction + `">` + helpEasy.capitalWord(args.button) + `</button>
                    <div class="dash-text text-little">` + helpEasy.capitalWord(args.text) + `</div>
                </div>
            `;
        }
        if (type === "system") {
            html += `
                <div class='dash-box'>
                    <button class='main-font' data-click="` + args.buttonAction + `">` + helpEasy.capitalWord(args.button) + `</button>
                    <div class="dash-text text-little">` + helpEasy.capitalWord(args.text) + `</div>
                </div>
            `;
        }
        return html;
    },
    'addInput': function (args) {
        let type = args.type;
        let disabled = "";
        if (args.disabled !== undefined && args.disabled === true) {
            disabled = "disabled";
        }
        let id = args.title.split(" ").join("-");
        let settingsIdPrefix = "generic-input-";
        let datasetBlob = "";
        if (args.toSettings === true) {
            settingsIdPrefix = "settings-input-";
            datasetBlob += 'data-settings="' + args.settingsId + '"';
        }
        if (args.settingsIP !== undefined) {
            datasetBlob += 'data-settings-ip="' + args.settingsIP + '"';
        }
        if (args.settingsRegEx !== undefined) {
            datasetBlob += 'data-settings-regex="' + args.settingsRegEx + '"';
        }
        if (args.valueIfBlank !== undefined) {
            datasetBlob += 'data-value-if-blank="' + args.valueIfBlank + '"';
        }
        if (args.allowedBlank !== undefined) {
            datasetBlob += 'data-allowed-blank="' + args.allowedBlank + '"';
        }
        if (args.optionListOffset !== undefined) {
            datasetBlob += 'data-option-list-offset="' + args.optionListOffset + '"';
        }
        if (args.list2value !== undefined) {
            datasetBlob += 'data-list2value="' + args.list2value + '"';
        }
        id = settingsIdPrefix + id;
        let tooltip = "";
        let gotTooltip = "";
        if (args.tooltip !== undefined) {
            tooltip = "<div class='tooltip'>" + args.tooltip + "</div>";
            gotTooltip = "got-tooltip";
        }
        let html = "<div class='row'>";
        if (type === "string") {
            html += "<span class='" + gotTooltip + "'>" + helpEasy.capitalWord(args.title) + tooltip + "</span>";
            html += `
                <input  spellcheck='false'
                        type='text'
                        id='` + id + `'
                        data-id='` + id + `'
                        data-type="string"
                        data-alt='` + args.alt + `'
                        data-settings="` + args.settingsId + `"
                        placeholder='` + args.placeholder + `'
                        value='` + args.default + `'
                        ` + datasetBlob + `
                        data-input-string="` + args.settingsMaxLength + `">
                `;
        }
        if (type === "password") {
            html += "<span class='" + gotTooltip + "'>" + helpEasy.capitalWord(args.title) + tooltip + "</span>";
            html += `
                <input  spellcheck='false'
                        type='password'
                        id='` + id + `'
                        data-id="` + id + `"
                        data-type="password"
                        data-alt='` + args.alt + `'
                        data-settings="` + args.settingsId + `"
                        placeholder='` + args.placeholder + `'
                        ` + datasetBlob + `
                        data-input-password="` + args.settingsMaxLength + `">
                `;
        }
        if (type === "dropdown") {
            html += "<span class='" + gotTooltip + "'>" + helpEasy.capitalWord(args.title) + tooltip + "</span>";
            html +=  `    
                    <select
                        id="` + id + `"
                        data-id="` + id + `"
                        data-type="dropdown"
                        data-alt="` + args.alt + `"
                        data-settings="` + args.settingsId + `"
                        data-default-index="` + args.default + `"
                        ` + disabled + `
                        ` + datasetBlob + `>
                `;
            let options = args.optionList;
            for (let i = 0; i < options.length; i++) {
                let value = options[i].value;
                let text = options[i].text;
                let disabled = "";
                if (options[i].disabled !== undefined && options[i].disabled === true) {
                    disabled = "disabled";
                }
                let note = "";
                if (options[i].note !== undefined) {
                    note = " " + options[i].note;
                }
                if (i === args.default) {
                    html += "<option value='" + value + "' selected='selected'>" + text + note + "</option>";
                } else {
                    html += "<option value='" + value + "' " + disabled + ">" + text + note + "</option>";
                }
            }
            html +=  `</select>
                    <label
                        class="select"
                        for="` + id + `"
                    ></label>
                `;
        }
        if (type === "toggle") {
            html += `
                <input type="checkbox"
                id="` + id + `"
                data-id="` + id + `"
                data-type="toggle"
                data-alt="` + args.alt + `"
                data-settings="` + args.settingsId + `"
                data-true-text="` + args.trueText + `"
                data-false-text="` + args.falseText + `"
                data-default-value="` + args.default + `"
                data-default-text="` + args[(args.default)+"Text"] + `"
                data-change="`+ settingsIdPrefix + `update"
                data-change-` + args.settingsTrue + `="true"
                data-change-` + args.settingsFalse + `="false"
                data-tooltip="`+ tooltip +`"
                data-got-tooltip="`+ gotTooltip +`"
                data-input-toggle="{'true':` + args.settingsTrue + `, 'false': `+ args.settingsFalse +`}"
                ` + datasetBlob + `>
                <label  class="checkbox"
                        id="label-` + id + `"
                        for="` + id + `"
                        tabindex="0">` +
                   `<div class="` + gotTooltip + `">` + helpEasy.capitalWord(args[(args.default+"Text")]) + tooltip + `</div>
                </label>
            `;
        }
        if (type === "number") {
            let placeholderText = "";
            if (args.placeholder !== "") {
                placeholderText = " [" + args.placeholder + "]";
            }
            html += `
                <input  type="number"
                id="` + id + `"
                min="` + args.min + `"
                max="` + args.max + `"
                step="` + args.step + `"
                data-alt="` + args.alt + `"
                placeholder="` + args.placeholder + `"
                data-default-value="` + args.default +  `"
                data-change="`+ settingsIdPrefix + `update"
                data-id="` + id + `"
                data-type="number"
                data-input-number="{'max': ` + args.max + `, 'min': ` + args.min + `}"
                value="` + args.default + `"
                ` + datasetBlob + `>
                <label class="number ` + gotTooltip + `"
                       for="` + id + `"
                       id="label-` + id + `">` +
                   helpEasy.capitalWord(args.title) + placeholderText + tooltip + `
                </label>
            `;
        }
        html += "</div>";
        return html;
    },
    'addLine': function () {
        return "<hr>";
    },
    'openArea': function (title) {
        let id = title.replace(" ", "-") + "-area";
        if (defaultSettings.userSettings.areasMinimized) {
            return `
            <div class="area hide-contents" id="` + id + `">
                <div class="area-title">` + helpEasy.capitalWord(title)
                + `<button id="button-min-` + id + `" data-click="area-min-` + id + `"` + ` class="is-hidden">{{ICON-MINIMIZE}}</button>`
                + `<button id="button-max-` + id + `" data-click="area-max-` + id + `">{{ICON-MAXIMIZE}}</button></div>
            `;
        } else {
            return `
            <div class="area" id="` + id + `">
                <div class="area-title">` + helpEasy.capitalWord(title)
                + `<button id="button-min-` + id + `" data-click="area-min-` + id + `">{{ICON-MINIMIZE}}</button>`
                + `<button id="button-max-` + id + `" data-click="area-max-` + id + `"` + ` class="is-hidden">{{ICON-MAXIMIZE}}</button></div>
            `;
        }
    },
    'closeArea': function () {
        return "</div>"
    },
    'openColumn': function (id) {
        if (id === undefined) {
            return "<div class='column'>";
        } else {
            if (id.split("-")[0] === "data") {
                return "<div class='column' " + id + "=''>";
            } else {
                return "<div class='column' id='" + id + "'>";
            }
        }
    },
    'closeColumn': function () {
        return "</div>"
    },
    'checkIfIP': function (ipaddress) {
        return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress);
    },
    'screenshot': function (args) {
        let html2canvasVersion = "v1.0.0-rc.5";
        if (helpEasy.internet()) {
            let id = "screenshot-script";
            /* THIS CHECK WAS A BAD IDEA... NO NEED TO REMOVE AN ALREADY LOADED LIB...
            let check = document.getElementById(id);
            if (check !== null) {
                check.remove();
            }
            */
            //flash the screen
            let eventDetails = {
                "type": "wave",
                "text": guiEasy.curly.icon(["screenshot"]),
                "color": "inverted"
            };
            let background = guiEasy.current.backgroundColor;
            if (background === undefined) {
                background = "#3492e2";
            }
            let inverted = guiEasy.current.invertedColor;
            if (inverted === undefined) {
                inverted = "#2F4252";
            }
            let fileName = helpEasy.capitalWord((guiEasy.current.tab.id).split("-")[0]);
            let element = guiEasy.current.modal;
            if (element === undefined) {
                element = guiEasy.current.tab;
            } else {
                background = inverted;
                fileName = fileName + "-" + document.getElementById("modal-title-text").innerText.replace(/ /g,"_");
            }
            fileName = guiEasy.nodes[helpEasy.getCurrentIndex()].live.json.System["Unit Name"] + "-" + fileName;
            guiEasy.popper.tryCallEvent(eventDetails);
            let script = document.createElement('script');
            script.id = id;
            script.onload = function () {
                html2canvas(element, {
                    backgroundColor: background
                }).then(function(canvas) {helpEasy.binaryDataToFile(canvas, "image/png", fileName + ".png")});
            };
            script.src = "https://github.com/niklasvh/html2canvas/releases/download/" + html2canvasVersion + "/html2canvas.min.js";
            document.head.appendChild(script);
            //TODO: there's left over elements or something when running the sceen shots multiple times on different objects. Tabs will stop being rendered after a modal has been shot...
        } else {
            //flash the screen, since no internet we cannot use the external lib..
            let eventDetails = {
                "type": "wave",
                "text": "No internet!",
                "color": "warning"
            };
            guiEasy.popper.tryCallEvent(eventDetails);
        }
    },
    'binaryDataToFile': function (data, type, fileName) {
        let id = "temp-binary-blob-element";
        let check = document.getElementById(id);
        if (check !== null) {
            check.remove();
        }
        let a = document.createElement('a');
        a.id = id;
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = data.toDataURL(type);
        a.download = fileName;
        a.click();
    },
    //These colors are just for backup, they should be set by the theme
    'favicon': function (color) {
        let canvas = document.createElement('canvas');
        let iconSide = 113;
        let iconRadius = 15;
        canvas.width = iconSide;
        canvas.height = iconSide;
        let ctx = canvas.getContext('2d');
        ctx.lineWidth = 8;
        //The background badge (with rounded corners)
        ctx.fillStyle = color.inverted;
        ctx.beginPath();
        ctx.moveTo(0,iconRadius);
        ctx.lineTo(0,iconSide-iconRadius);
        ctx.arc(iconRadius,iconSide-iconRadius, iconRadius, Math.PI, 0.5 * Math.PI, true);
        ctx.lineTo(iconRadius,iconSide);
        ctx.lineTo(iconSide-iconRadius,iconSide);
        ctx.arc(iconSide-iconRadius,iconSide-iconRadius, iconRadius, Math.PI, 1.5 * Math.PI, true);
        ctx.lineTo(iconSide,iconSide-iconRadius);
        ctx.lineTo(iconSide,iconRadius);
        ctx.arc(iconSide-iconRadius,iconRadius, iconRadius, 0, 1.5 * Math.PI, true);
        ctx.lineTo(iconSide-iconRadius,0);
        ctx.lineTo(iconRadius,0);
        ctx.arc(iconRadius,iconRadius, iconRadius, 0, 0.5 * Math.PI, true);
        ctx.lineTo(0,iconRadius);
        ctx.closePath();
        ctx.fill();
        //The dot
        ctx.fillStyle = color.font;
        ctx.beginPath();
        ctx.arc(90, 90, 10, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        //The warning line
        ctx.lineCap = "round";
        ctx.strokeStyle = color.warning;
        ctx.beginPath();
        ctx.moveTo(42,99);
        ctx.lineTo(99,42);
        ctx.closePath();
        ctx.stroke();
        //The info line
        ctx.strokeStyle = color.info;
        ctx.beginPath();
        ctx.moveTo(14,99);
        ctx.lineTo(99,14);
        ctx.closePath();
        ctx.stroke();
        //The sunny line
        ctx.strokeStyle = color.sunny;
        ctx.beginPath();
        ctx.moveTo(14,70);
        ctx.lineTo(70,14);
        ctx.closePath();
        ctx.stroke();
        //The success line
        ctx.strokeStyle = color.success;
        ctx.beginPath();
        ctx.moveTo(14,42);
        ctx.lineTo(42,14);
        ctx.closePath();
        ctx.stroke();
        let favicon = document.getElementById("favicon");
        if (favicon !== null) {
            favicon.remove();
        }
        favicon = document.createElement('link');
        favicon.id = "favicon";
        favicon.type = 'image/x-icon';
        favicon.rel = 'shortcut icon';
        favicon.href = canvas.toDataURL("image/x-icon");
        document.head.appendChild(favicon);
    }
};
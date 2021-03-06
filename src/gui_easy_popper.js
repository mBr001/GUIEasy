/* GUIEasy  Copyright (C) 2019-2020  Jimmy "Grovkillen" Westberg */
//HERE WE ADD THINGS THAT WILL HAPPEN
guiEasy.popper = function (processID, processType) {
    //to make sure we don't spam the event listener...
    setInterval(guiEasy.popper.tryCallEvent.counter, 5);
    //add event listeners...
    guiEasy.popper.events();
    guiEasy.popper.rules();
    guiEasy.popper.favicon();
    helpEasy.addToLogDOM("pageSize", 1);
    helpEasy.processDone(processID, processType);
};

guiEasy.popper.events = function() {
    //generic events that will be captured
    document.addEventListener(guiEasy.geekName(), guiEasy.popper.guiEvent, false);
    document.addEventListener('keydown', guiEasy.popper.keyboard, false);
    document.addEventListener('input', guiEasy.popper.input, false);
    document.addEventListener('keyup', guiEasy.popper.keyboard, false);
    document.addEventListener('click', guiEasy.popper.click, true);
    document.addEventListener('change', guiEasy.popper.change, true);
    document.addEventListener('focusout', guiEasy.popper.focus, true);
};

//BELOW IS FUNCTION TO INTERCEPT AND TRANSLATE THE EVENT INTO A ESP EASY EVENT//
guiEasy.popper.focus = function (event) {
    //focus is currently only used to close the action menu ...
    if (event.target.dataset["focus"] === undefined) {
        return;
    }
    let args = event.target.dataset["focus"].split("-");
    if (args !== undefined) {
        let eventDetails = {
            "type": args[0],
            "args": args,
            "x": event.x,
            "y": event.y
        };
        setTimeout(function () {
            guiEasy.popper.tryCallEvent(eventDetails)
        }, 250);
    }
};

guiEasy.popper.input = function (event) {
    let x = event.target.dataset;
    let eventDetails = {
        "type": "update",
        "newValue": event.target.value,
        "newState": event.target.checked,
        "placeholder": event.target.placeholder,
        "args": x
    };
    if (eventDetails.type !== undefined) {
        guiEasy.popper.tryCallEvent(eventDetails);
    }
};

guiEasy.popper.change = function (event) {
    let x = event.target.dataset;
    let eventDetails = {
        "type": "update",
        "newValue": event.target.value,
        "newState": event.target.checked,
        "placeholder": event.target.placeholder,
        "index": event.target.selectedIndex,
        "args": x
    };
    if (eventDetails.type !== undefined) {
        guiEasy.popper.tryCallEvent(eventDetails);
    }
};

guiEasy.popper.keyboard = function (event) {
    let eventDetails = {
           "type": "shortcut",
           "object": event.key,
           "state": event.type,
           "key": event.code,
           "ctrl": event.ctrlKey,
           "alt": event.altKey,
           "event": event
        };
    if (eventDetails.type !== undefined) {
        guiEasy.popper.tryCallEvent(eventDetails);
    }
};

guiEasy.popper.click = function (event) {
    if (event.target.dataset["click"] === undefined) {
        return;
    }
    let args = event.target.dataset["click"].split("-");
    let x = event.target.dataset;
    if (args !== undefined) {
        let eventDetails = {
            "type": args[0],
            "args": args,
            "dataset": x,
            "x": event.x,
            "y": event.y
        };
        guiEasy.popper.tryCallEvent(eventDetails);
    }
};
//ABOVE IS FUNCTION TO INTERCEPT AND TRANSLATE THE EVENT INTO A ESP EASY EVENT//
//BELOW IS THE FUNCTION TO TRIGGER ESP EASY EVENT + FIND WHAT WAS FOCUSED//
guiEasy.popper.guiEvent = function (event) {
    helpEasy.addToLogDOM(JSON.stringify(event.detail), 2);
    let x = event.detail;
    guiEasy.popper[x.type](x);
};

guiEasy.popper.tryCallEvent = function (eventDetails) {
    let x = guiEasy.guiStats.eventCalls;
    if (x < 10) {
        guiEasy.guiStats.eventCalls++;
        helpEasy.addToLogDOM("Calling custom event: " + JSON.stringify(eventDetails), 2);
        document.dispatchEvent(new CustomEvent(guiEasy.geekName(), {'detail': eventDetails}));
    }
};

guiEasy.popper.tryCallEvent.counter = function() {
    if (guiEasy.guiStats.eventCalls > 0) {
        guiEasy.guiStats.eventCalls--;
    }
};
//ABOVE IS THE FUNCTION TO TRIGGER ESP EASY EVENT + FIND WHAT WAS FOCUSED//
//BELOW IS THE "TO EXEC" FUNCTIONS//
guiEasy.popper.clipboard = function (clipboard) {
    let id = clipboard.args[1];
    let element = document.getElementById(id);
    let syntax = defaultSettings.userSettings.clipboardSyntax;
    helpEasy.copyToClipboard(guiEasy.popper.clipboard[syntax](element.innerHTML));
    let eventDetails = {
        "type": "wave",
        "text": "info copied",
        "color": "success"
    };
    guiEasy.popper.tryCallEvent(eventDetails);
};

guiEasy.popper.clipboard.Default = function (rawHTML) {
    let text = "";
    helpEasy.addToLogDOM("Converting (generic): " + rawHTML, 1);
    let data = guiEasy.popper.clipboard.regexTable(rawHTML);

    helpEasy.addToLogDOM("RESULTS (generic): " + text, 1);

    return text;
};

guiEasy.popper.clipboard.GitHub = function (rawHTML) {
    let text = "";
    helpEasy.addToLogDOM("Converting (GitHub): " + rawHTML, 1);
    let data = guiEasy.popper.clipboard.regexTable(rawHTML);

    helpEasy.addToLogDOM("RESULTS (GitHub): " + text, 1);

    return text;
};

guiEasy.popper.clipboard.phpBB = function (rawHTML) {
    let text = "";
    helpEasy.addToLogDOM("Converting (phpBB): " + rawHTML, 1);
    let data = guiEasy.popper.clipboard.regexTable(rawHTML);

    helpEasy.addToLogDOM("RESULTS (phpBB): " + text, 1);

    return text;
};

guiEasy.popper.clipboard.regexTable = function (rawHTML) {

};

guiEasy.popper.gui = function (event) {
    let currentUserSettings = defaultSettings.userSettings;
    let browserUserSettings = {
        "preventDefaults": {}
    };
    let inputs = document.querySelectorAll("[data-settings^='defaultSettings--userSettings']");
    for (let i = 0; i < inputs.length; i++) {
        let settingsPath = inputs[i].dataset.settings.split("--");
        let value = "";
        if (inputs[i].dataset.type === "toggle") {
            value = JSON.parse(inputs[i].dataset.inputToggle.replace(/'/g, '"'));
            value = value[inputs[i].checked];
        }
        if (inputs[i].dataset.type === "dropdown") {
            value = inputs[i].selectedOptions[0].text;
        }
        if (settingsPath[2] === "preventDefaults") {
            browserUserSettings.preventDefaults[settingsPath[3]] = value;
        } else {
            browserUserSettings[settingsPath[2]] = value;
        }
    }
    currentUserSettings = browserUserSettings;
    if (document.getElementById("label-temp") !== null) {
        document.getElementById("label-temp").remove();
    }
    let l = document.createElement("label");
    l.id = "label-temp";
    l.style.display = "none";
    document.body.appendChild(l);
    let file = new File(
        [JSON.stringify(currentUserSettings,null,2)],
        "gui.txt",
        {
            type: "text/plain"
        }
    );
    helpEasy.uploadBinaryAsFile("generic", file, "temp");
    let eventDetails = {
        "type": "wave",
        "text": "gui settings saved",
        "color": "inverted"
    };
    guiEasy.popper.tryCallEvent(eventDetails);
    eventDetails = {
        "type": "modal",
        "args": ["", "close"]
    };
    guiEasy.popper.tryCallEvent(eventDetails);
};

guiEasy.popper.command = function (x) {
    let waveStuff = JSON.parse(x.dataset.args.replace(/'/g, '"'));
    let url = "http://" + guiEasy.nodes[helpEasy.getCurrentIndex()].ip + "/?cmd=";
    let cmd = x.args[1];
    let waveText = waveStuff.waveText;
    let waveColor = waveStuff.color;
    if (cmd === "reboot") {
        helpEasy.schedulerDelay(guiEasy.nodes, helpEasy.getCurrentIndex(), 15 * 1000);
    } else {
        helpEasy.schedulerDelay(guiEasy.nodes, helpEasy.getCurrentIndex(), 30 * 1000);
    }
    fetch(url + cmd).then( results => {
            helpEasy.addToLogDOM(("response: " + results), 2);
            let eventDetails = {
                "type": "wave",
                "text": waveText,
                "color": waveColor
            };
            guiEasy.popper.tryCallEvent(eventDetails);
        }
    );

};

guiEasy.popper.topNotifier = function (id, string, color, countdown) {
    let x = guiEasy.nodes[helpEasy.getCurrentIndex()].notifierID;
    if (x === undefined) {
        guiEasy.nodes[helpEasy.getCurrentIndex()].notifierID = id;
    }
    if (x !== id) {
        guiEasy.nodes[helpEasy.getCurrentIndex()].notifierID = id;
        let notifier = document.getElementById("top-notifier");
        if (notifier.innerHTML !== "") {
            //if it already got something open, replace that one.
            notifier.click();
        }
        notifier.innerHTML = string;
        notifier.classList.add("main-" + color);
        if (id === "internetDown") {
            //No click away
            notifier.classList.add("no-click");
        }
        notifier.addEventListener("click", function () {
            notifier.classList.add("is-hidden");
            notifier.innerHTML = "";
            guiEasy.nodes[helpEasy.getCurrentIndex()].notifierID = "";
            notifier.classList.remove("no-click");
            notifier.classList.remove("main-" + color);
        });
        if (countdown > 0) {
            guiEasy.nodes[helpEasy.getCurrentIndex()].notifierID = id;
            notifier.innerHTML = "<div id='countdown-bar'></div>" + notifier.innerHTML;
            let bar = document.getElementById("countdown-bar");
            let z = 1;
            bar.setAttribute("style", "width: 0.1%");
            let y = setInterval(function () {
                z++;
                bar.setAttribute("style", "width:" + Math.round( z / countdown * 100 ) + "%");
                if (z === countdown) {
                    clearInterval(y);
                }
            }, 1000);
            setTimeout(function () {
                notifier.click();
            }, countdown * 1001)
        }
        notifier.classList.remove("is-hidden")
    }
};

guiEasy.popper.tab = function (tabToOpen) {
    let tab = tabToOpen.args[1];
    if (tab === undefined) {
        tab = "main";
    }
    let tabNumber = parseInt(tab);
    if (tabNumber > -1) {
        tab = guiEasy["tabNumber"][tabNumber];
    }
    tabNumber = guiEasy["tabNumber"].indexOf(tab);
    guiEasy.current.tabNumber = tabNumber;
    guiEasy.current.tab = document.getElementById(tab + "-container");
    //first hide the containers, plus un-hide the wanted container
    let x = document.getElementsByClassName("container");
    for (let i = 0; i < x.length; i++) {
        let y = x[i].id.split("-")[0];
        x[i].classList.add("is-hidden");
        if (y === tab) {
            x[i].classList.remove("is-hidden");
            window.scrollTo(0, 0);
        }
    }
    //now remove the highlight, plus add to the wanted tab
    x = document.getElementsByClassName("nav");
    for (let i = 0; i < x.length; i++) {
        let y = x[i].dataset;
        if (y.highlight === "true") {
            x[i].classList.remove("nav-selected");
        }
        if (y.tab === tab) {
            x[i].classList.add("nav-selected");
        }
    }
    helpEasy.addToLogDOM("tab open: " + tab, 1);
};

guiEasy.popper.menu = function (menuToOpen) {
    let x = menuToOpen.args[1];
    let y = menuToOpen.args[2];
    let posY = menuToOpen.y;
    if (x === "action") {
        let menu = document.getElementById("menu-button-list");
        let menuHeight = parseFloat(window.getComputedStyle(menu).height.slice(0, -2));
        let menuButton = document.getElementById("menu-button");
        if (y === "close") {
            menu.classList.add("closed");
            menuButton.classList.add("is-inactive");
            setTimeout(function () {
                menu.classList.remove("horizontal");
            }, 750)
        }
        if (y === "toggle") {
            menu.classList.toggle("closed");
            menuButton.classList.toggle("is-inactive");
        }
        if (posY < (menuHeight + 50)) {
            menu.classList.add("horizontal");
        }
    }
    helpEasy.addToLogDOM("menu: " + x, 1);
};

guiEasy.popper.modal = function (modalToOpen) {
    let x = modalToOpen.args[1];
    let y = modalToOpen.args[2];
    let index = helpEasy.getCurrentIndex();
    let logic = {"nah": "add", "yep": "remove"};
    // nah = add "is-hidden"... yep = remove "is-hidden"
    let z = {
        "modal": "nah",
        "input": {
            "string": "nah",
            "textarea": "nah",
            "upload": "nah"
        },
        "button": {
            "ok": "nah",
            "cancel": "nah",
            "close": "nah",
            "rescan": "nah",
            "copy": "nah",
            "location": "nah",
            "custom": "nah"
        },
        //Defaults, can be override in the ifs further down.
        "action": {
            "ok": null,
            "cancel": "modal-close",
            "close": "modal-close",
            "rescan": null,
            "copy": "modal-clipboard",
            "upload": null,
            "location": "update-location",
            "custom": null
        },
        "countdown": 0,
        "info": null,
        "table": null,
        "setup": null,
        "title": null,
        "upload": {
            "max": null,
            "free": null,
            "title": null,
            "types": null
        },
        "custom": null
    };
    //What part of the modal should be screenshot:ed?
    if (guiEasy.current.modal === undefined) {
        guiEasy.current.modal = document.getElementById("modal-view");
    }
    if (x === "close") {
        if (guiEasy.current.modal !== undefined) {
            guiEasy.current.modal.remove();
        }
        document.getElementById("modal").innerHTML = document.getElementById("modal").dataset.defaultView;
        document.body.classList.remove("modal");
    } else {
        document.body.classList.add("modal");
    }
    if (x === "theme" && y === "import") {
        z.modal = "yep";
        z.input.textarea = "yep";
        z.button.close = "yep";
        z.button.ok = "yep";
        z.action.ok = "theme-import-modal_input_textarea";
        z.title = "please enter theme settings";
    }
    if (x === "theme" && y === "copy") {
        z.modal = "yep";
        z.title = "added to clipboard!";
        z.info = "<div class='is-center logo-animation'>" + guiEasy.curly.logo(["big"]) + "</div>";
        z.countdown = 3;
    }
    if (x === "wifi" && y === "scanner") {
        z.modal = "yep";
        z.button.close = "yep";
        z.button.copy = "yep";
        z.action.copy = "clipboard-wifi";
        z.title = "found wifi networks";
        z.table = guiEasy.nodes[index].modal.table.wifi;
    }
    if (x === "i2c" && y === "scanner") {
        z.modal = "yep";
        z.button.close = "yep";
        z.title = "found i2c hardware";
        //z.table = guiEasy.nodes[index].modal.table.i2c;;
    }
    if (x === "files" && y === "table") {
        let storage = guiEasy.nodes[helpEasy.getCurrentIndex()].live.sysinfo_json.storage;
        z.modal = "yep";
        z.button.close = "yep";
        z.title = "files on local storage";
        z.table = guiEasy.nodes[index].modal.table.files;
        z.input.upload = "yep";
        z.action.upload = "generic";
        z.upload.max = parseInt(storage.spiffs_size);
        z.upload.free = parseInt(storage.spiffs_free);
        z.upload.types = ".*";
        z.upload.title = "upload file to unit";
    }
    if (x === "firmware" && y === "reset") {
        z.modal = "yep";
        z.button.close = "yep";
        z.title = "reset firmware";
        z.setup = guiEasy.popper.modal.factoryReset();
        z.button.custom = "yep";
        z.action.custom = "firmware-reset-factory";
        z.custom = {
                "text":"factory reset",
                "color": "warning"
                };
    }
    if (x === "firmware" && y === "update") {
        let storage = guiEasy.nodes[helpEasy.getCurrentIndex()].live.sysinfo_json.storage;
        z.modal = "yep";
        z.button.close = "yep";
        z.title = "update firmware";
        z.input.upload = "yep";
        z.action.upload = "firmware";
        z.upload.max = parseInt(storage.sketch_free) + parseInt(storage.sketch_size);
        z.upload.free = parseInt(storage.sketch_free);
        z.upload.types = ".bin";
        z.upload.title = "upload bin file to unit";
    }
    if (x === "settings" && y === "gui") {
        z.modal = "yep";
        z.button.close = "yep";
        z.title = "gui settings";
        z.setup = guiEasy.popper.modal.settings(y);
        z.button.custom = "yep";
        z.action.custom = "gui-settings-save";
        z.custom = {
            "text":"save gui settings to file",
            "color": "success"
        };
    }
    if (x === "settings" && y === "mqtt") {
        z.modal = "yep";
        z.button.close = "yep";
        z.title = "mqtt settings";
        z.setup = guiEasy.popper.modal.settings(y);
        z.button.ok = "yep";
        z.action.ok = "settings-updated";
    }
    if (x === "settings" && y === "rules") {
        z.modal = "yep";
        z.button.close = "yep";
        z.title = "rules settings";
        z.setup = guiEasy.popper.modal.settings(y);
        z.button.ok = "yep";
        z.action.ok = "settings-updated";
    }
    if (x === "settings" && y === "p2p") {
        z.modal = "yep";
        z.button.close = "yep";
        z.title = "p2p settings";
        z.setup = guiEasy.popper.modal.settings(y);
        z.button.ok = "yep";
        z.action.ok = "settings-updated";
    }
    if (x === "settings" && y === "advanced") {
        z.modal = "yep";
        z.button.close = "yep";
        z.title = "advanced settings";
        z.setup = guiEasy.popper.modal.settings(y);
        z.button.ok = "yep";
        z.action.ok = "settings-updated";
    }
    if (x === "settings" && y === "time") {
        z.modal = "yep";
        z.button.close = "yep";
        z.title = "time settings";
        z.setup = guiEasy.popper.modal.settings(y);
        z.button.ok = "yep";
        z.action.ok = "settings-updated";
    }
    if (x === "settings" && y === "log") {
        z.modal = "yep";
        z.button.close = "yep";
        z.title = "serial & log settings";
        z.setup = guiEasy.popper.modal.settings(y);
        z.button.ok = "yep";
        z.action.ok = "settings-updated";
    }
    if (x === "settings" && y === "location") {
        z.modal = "yep";
        z.button.close = "yep";
        z.title = "geolocation settings";
        z.setup = guiEasy.popper.modal.settings(y);
        z.button.ok = "yep";
        z.action.ok = "settings-updated";
        z.button.location = "yep";
    }
    if (x === "info" && y === "system") {
        z.modal = "yep";
        z.button.close = "yep";
        z.title = "system info";
        z.button.copy = "yep";
        z.action.copy = "clipboard-sysinfo_json";
        z.table = guiEasy.nodes[index].modal.table.sysinfo_json;
    }
    if (x === "info" && y === "sysvars") {
        z.modal = "yep";
        z.button.close = "yep";
        z.title = "system variables";
        z.button.copy = "yep";
        z.action.copy = "clipboard-sysvars";
        //z.table = guiEasy.nodes[index].modal.table.sysinfo_json;
    }
    if (x === "info" && y === "timing") {
        z.modal = "yep";
        z.button.close = "yep";
        z.title = "timing statistics";
        z.button.copy = "yep";
        z.action.copy = "clipboard-timingstats_json";
        z.table = guiEasy.nodes[index].modal.table.timingstats_json;
    }
    if (x === "task" && y === "edit") {
        z.modal = "yep";
        z.button.close = "yep";
        z.title = "editing task " + modalToOpen.args[0];
        z.button.ok = "yep";
        z.action.ok = "settings-updated";
        z.button.custom = "yep";
        z.action.custom = "task-delete";
        z.custom = {
            "text":"delete",
            "color": "warning"
        };
    }
    //Below we unhide "yep"s
    document.getElementById("modal-container").classList[logic[z.modal]]("is-hidden");
    if (z.action.ok !== null) {
        document.getElementById("modal-button-ok").dataset.click = z.action.ok;
    }
    if (z.action.cancel !== null) {
        document.getElementById("modal-button-cancel").dataset.click = z.action.cancel;
    }
    if (z.action.close !== null) {
        document.getElementById("modal-title-button-close").dataset.click = z.action.close;
    }
    if (z.action.copy !== null) {
        document.getElementById("modal-title-button-copy").dataset.click = z.action.copy;
    }
    if (z.action.location !== null) {
        document.getElementById("modal-title-button-location").dataset.click = z.action.location;
    }
    document.getElementById("modal-button-ok").classList[logic[z.button.ok]]("is-hidden");
    document.getElementById("modal-title-button-close").classList[logic[z.button.close]]("is-hidden");
    document.getElementById("modal-title-button-copy").classList[logic[z.button.copy]]("is-hidden");
    document.getElementById("modal-title-button-location").classList[logic[z.button.location]]("is-hidden");
    document.getElementById("modal-button-cancel").classList[logic[z.button.cancel]]("is-hidden");
    document.getElementById("modal-input-string").classList[logic[z.input.string]]("is-hidden");
    document.getElementById("modal-input-textarea").classList[logic[z.input.textarea]]("is-hidden");
    document.getElementById("label-modal-input-upload-file").classList[logic[z.input.upload]]("is-hidden");
    if (z.input.upload === "yep") {
        if (z.upload.max !== null && z.upload.free !== null) {
            let availablePercentage = Math.floor(z.upload.free / z.upload.max * 100);
            let free = document.getElementById("modal-input-upload-storage-free");
            let occupied = document.getElementById("modal-input-upload-storage-occupied");
            free.style.width = availablePercentage + "%";
            free.innerText = z.upload.free + "kB";
            occupied.style.width = (100 - availablePercentage) + "%";
            occupied.innerText = (z.upload.max - z.upload.free).toString() + "kB";
        }
        let inputFile = document.getElementById("modal-input-upload-file");
        inputFile.dataset.typeOfUpload = z.action.upload;
        inputFile.setAttribute("accept", z.upload.types);
        inputFile.addEventListener("change", function (event) {
            let what = event.target.dataset.typeOfUpload;
            let file = event.target.files[0];
            let id = event.target.id;
            helpEasy.uploadBinaryAsFile(what, file, id)
        }, false);
        // drag&drop events
        let labelInputFile = document.getElementById("label-modal-input-upload-file");
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            labelInputFile.addEventListener(eventName, function (e) {
                e.preventDefault();
                e.stopPropagation();
            }, false)
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            labelInputFile.addEventListener(eventName, function () {
                labelInputFile.innerText = helpEasy.capitalWord("drop file here...");
                labelInputFile.classList.add('drag-drop-highlight');
            }, false)
        });
        ['dragleave', 'drop'].forEach(eventName => {
            labelInputFile.addEventListener(eventName, function (event) {
                labelInputFile.classList.remove('drag-drop-highlight');
                labelInputFile.innerText = helpEasy.capitalWord("upload file to unit");
                if (eventName === "drop") {
                    let what = inputFile.dataset.typeOfUpload;
                    let file = event.dataTransfer.files[0];
                    let id = "modal-input-upload-file";
                    if (file.name.slice(-3).toLowerCase() !== "bin" && what === "firmware") {
                        helpEasy.blinkElement("label-modal-input-upload-file", "warning");
                        labelInputFile.innerText = helpEasy.capitalWord("not a bin file!");
                        setTimeout(function () {
                            helpEasy.blinkElement("label-modal-input-upload-file", "warning");
                        },750);
                        setTimeout(function () {
                            labelInputFile.innerText = helpEasy.capitalWord("upload file to unit");
                        },1000);
                    } else {
                        helpEasy.uploadBinaryAsFile(what, file, id);
                    }
                }
            }, false)
        });
    }
    if (z.custom !== null) {
        document.getElementById("modal-button-custom").classList[logic[z.button.custom]]("is-hidden");
        document.getElementById("modal-button-custom").dataset.click = z.action.custom;
        document.getElementById("modal-button-custom").innerText = helpEasy.capitalWord(z.custom.text);
        document.getElementById("modal-button-custom").classList.add("main-" + z.custom.color);
    }
    if (z.upload.title !== null) {
        document.getElementById("label-modal-input-upload-file").innerText = helpEasy.capitalWord(z.upload.title);
    }
    if (z.title !== null) {
        document.getElementById("modal-title-text").innerText = helpEasy.capitalWord(z.title);
    }
    if (z.info !== null) {
        document.getElementById("modal-info").innerHTML = z.info;
    }
    if (z.table !== null) {
        document.getElementById("modal-table").innerHTML = z.table;
        document.getElementById("modal-table").classList.remove("is-hidden");
        guiEasy.current.modal = document.querySelectorAll("[data-modal-table]")[0];
    }
    if (z.setup !== null) {
        document.getElementById("modal-setup").innerHTML = z.setup;
        document.getElementById("modal-setup").classList.remove("is-hidden");
        guiEasy.current.modal = document.querySelectorAll("[data-modal-settings-table]")[0];
    }
    helpEasy.guiUpdaterSettings("fromBrowser");
    //Countdown...
    if (z.countdown > 0) {
        let countdownElement = document.getElementById("modal-title-button-close");
        let messageElement = document.getElementById("modal-click-area");
        //make click on message close it (not just the button in the top right corner)
        messageElement.addEventListener("click", function () {
            clearInterval(timer);
            countdownElement.click();
        });
        countdownElement.innerText = z.countdown;
        countdownElement.classList.add("countdown");
        countdownElement.classList.remove("is-hidden");
        let timer = setInterval( function() {
            let currentValue = parseInt(countdownElement.innerText);
            if (currentValue > 1) {
                countdownElement.innerText = (currentValue - 1).toString();
            } else {
                clearInterval(timer);
                countdownElement.click();
            }
        }, 1000);
    }
};

guiEasy.popper.modal.settings = function (type) {
    let html = "";
    html += helpEasy.openColumn("data-modal-settings-table");
    if (type === "gui") {
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toGuiSettings": true,
                "alt": "settings-change",
                "title": "escape key",
                "settingsId": "defaultSettings--userSettings--preventDefaults--escape",
                "settingsTrue": 0,
                "settingsFalse": 1,
                "falseText": "esc = close modals",
                "trueText": "esc = not used",
                "default":true
            }
        );
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toGuiSettings": true,
                "alt": "settings-change",
                "title": "ctrl space key",
                "settingsId": "defaultSettings--userSettings--preventDefaults--ctrl+space",
                "settingsTrue": 0,
                "settingsFalse": 1,
                "falseText": "ctrl + space = open swarm",
                "trueText": "ctrl + space = not used",
                "default":true
            }
        );
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toGuiSettings": true,
                "alt": "settings-change",
                "title": "ctrl enter key",
                "settingsId": "defaultSettings--userSettings--preventDefaults--ctrl+enter",
                "settingsTrue": 0,
                "settingsFalse": 1,
                "falseText": "ctrl + enter = take screenshot",
                "trueText": "ctrl + enter = not used",
                "default":true
            }
        );
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toGuiSettings": true,
                "alt": "settings-change",
                "title": "ctrl keys key",
                "settingsId": "defaultSettings--userSettings--preventDefaults--ctrl+keys",
                "settingsTrue": 0,
                "settingsFalse": 1,
                "falseText": "ctrl + s = save settings",
                "trueText": "ctrl + s = not used",
                "default":true
            }
        );
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toGuiSettings": true,
                "alt": "settings-change",
                "title": "ctrl keyz key",
                "settingsId": "defaultSettings--userSettings--preventDefaults--ctrl+keyz",
                "settingsTrue": 0,
                "settingsFalse": 1,
                "falseText": "ctrl + z = dismiss changes",
                "trueText": "ctrl + z = not used",
                "default":true
            }
        );
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toGuiSettings": true,
                "alt": "settings-change",
                "title": "alt digit key",
                "settingsId": "defaultSettings--userSettings--preventDefaults--alt+digit",
                "settingsTrue": 0,
                "settingsFalse": 1,
                "falseText": "alt + digit = jump to tab",
                "trueText": "alt + digit = not used",
                "default":true
            }
        );
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toGuiSettings": true,
                "alt": "settings-change",
                "title": "alt arrow key",
                "settingsId": "defaultSettings--userSettings--preventDefaults--alt+arrows",
                "settingsTrue": 0,
                "settingsFalse": 1,
                "falseText": "alt + l/r arrow = jump to tab",
                "trueText": "alt + l/r arrow = not used",
                "default": true
            }
        );
        html += "<hr>";
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toGuiSettings": true,
                "alt": "settings-change",
                "title": "wait for theme",
                "settingsId": "defaultSettings--userSettings--waitForTheme",
                "settingsTrue": 1,
                "settingsFalse": 0,
                "falseText": "fast boot (no wait for theme)",
                "trueText": "wait for theme & gui settings",
                "default": false
            }
        );
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toGuiSettings": true,
                "alt": "settings-change",
                "title": "minimize areas",
                "settingsId": "defaultSettings--userSettings--areasMinimized",
                "settingsTrue": 0,
                "settingsFalse": 1,
                "falseText": "areas collapsed by default",
                "trueText": "areas expanded by default",
                "default":false
            }
        );
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toGuiSettings": true,
                "alt": "settings-change",
                "title": "show help links",
                "settingsId": "defaultSettings--userSettings--helpLinks",
                "settingsTrue": 0,
                "settingsFalse": 1,
                "falseText": "help links = show",
                "trueText": "help links &ne; show",
                "default":true
            }
        );
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toGuiSettings": true,
                "alt": "settings-change",
                "title": "warn if internet lost",
                "settingsId": "defaultSettings--userSettings--internetLostShow",
                "settingsTrue": 0,
                "settingsFalse": 1,
                "falseText": "notify on internet lost",
                "trueText": "internet lost, don't care",
                "default":true
            }
        );
        html += "<hr>";
        html += helpEasy.addInput(
            {
                "type": "dropdown",
                "toGuiSettings": true,
                "alt": "settings-change",
                "title": "syntax of copy to clipboard",
                "settingsId": "defaultSettings--userSettings--clipboardSyntax",
                "placeholder": "",
                "default": 0,
                "list2value": true,
                "optionListOffset": -1,
                "optionList": [
                    {"text": "Default", "value": 0, "disabled":false, "note":""},
                    {"text": "GitHub", "value": 1, "disabled":false, "note":""},
                    {"text": "phpBB", "value": 2, "disabled":false, "note":""}
                ]
            }
        );
    }
    if (type === "p2p") {
        html += helpEasy.addInput(
            {
                "type": "number",
                "toSettings": true,
                "alt": "settings-change",
                "title": "udp port",
                "settingsId": "config--espnetwork--port",
                "placeholder": "",
                "tooltip": "8266 is the default<br>esp easy udp port.",
                "default": 8266,
                "max": 65535,
                "min": 0,
                "step": 1
            }
        );
    }
    if (type === "log") {
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toGuiSettings": true,
                "alt": "settings-change",
                "title": "enable serial",
                "settingsId": "config--serial--enabled",
                "settingsTrue": 1,
                "settingsFalse": 0,
                "trueText": "serial output enabled",
                "falseText": "serial not used",
                "default":false
            }
        );
        html += helpEasy.addInput(
            {
                "type": "dropdown",
                "toGuiSettings": true,
                "alt": "settings-change",
                "title": "serial baud rate",
                "settingsId": "config--serial--baudrate",
                "list2value": true,
                "optionListOffset": 0,
                "default": 3,
                "optionList": [
                    {"text": "9600", "value": 9600, "disabled":false, "note":""},
                    {"text": "19200", "value": 19200, "disabled":false, "note":""},
                    {"text": "57600", "value": 57600, "disabled":false, "note":""},
                    {"text": "115200", "value": 115200, "disabled":false, "note":""},
                    {"text": "128000", "value": 128000, "disabled":true, "note":""},
                    {"text": "256000", "value": 256000, "disabled":true, "note":""}
                ]
            }
        );
    }
    if (type === "location") {
        html += helpEasy.addInput(
            {
                "type": "number",
                "toSettings": true,
                "alt": "settings-change",
                "title": "Longitude [°]",
                "settingsId": "config--location--long",
                "placeholder": "",
                "default": 0,
                "max": 180,
                "min": -180,
                "step": 0.00000000000001
            }
        );
        html += helpEasy.addInput(
            {
                "type": "number",
                "toSettings": true,
                "alt": "settings-change",
                "title": "Latitude [°]",
                "settingsId": "config--location--lat",
                "placeholder": "",
                "default": 0,
                "max": 90,
                "min": -90,
                "step": 0.00000000000001
            }
        );
    }
    if (type === "time") {
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toGuiSettings": true,
                "alt": "settings-change",
                "title": "use ntp server",
                "settingsId": "config--ntp--enabled",
                "settingsTrue": 1,
                "settingsFalse": 0,
                "falseText": "ntp disabled",
                "trueText": "use ntp server",
                "default":false
            }
        );
        html += helpEasy.addInput(
            {
                "type": "string",
                "toSettings": true,
                "alt": "settings-change",
                "title": "ntp server",
                "settingsId": "config--ntp--host",
                "placeholder": "blank = default ntp server",
                "default": ""
            }
        );
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toGuiSettings": true,
                "alt": "settings-change",
                "title": "daylight saving",
                "settingsId": "config--dst--enabled",
                "settingsTrue": 1,
                "settingsFalse": 0,
                "trueText": "daylight saving is enabled",
                "falseText": "no daylight saving",
                "default":false
            }
        );
        html += "<hr>";
        html += "<div class='main-bg-inverted'>" + helpEasy.capitalWord("dst starting") + "</div>";
        html += helpEasy.addInput(
            {
                "type": "dropdown",
                "title": "week",
                "alt": "settings-change",
                "settingsId": "config--1",
                "placeholder": "",
                "default": 0,
                "optionList": guiEasy.timelist.week
            }
        );
        html += helpEasy.addInput(
            {
                "type": "dropdown",
                "title": "day",
                "alt": "settings-change",
                "settingsId": "config--2",
                "placeholder": "",
                "default": 0,
                "optionList": guiEasy.timelist.day
            }
        );
        html += helpEasy.addInput(
            {
                "type": "dropdown",
                "title": "month",
                "alt": "settings-change",
                "settingsId": "config--3",
                "placeholder": "",
                "default": 0,
                "optionList": guiEasy.timelist.month
            }
        );
        html += helpEasy.addInput(
            {
                "type": "number",
                "toSettings": true,
                "alt": "settings-change",
                "title": "hour",
                "settingsId": "config--4",
                "placeholder": "",
                "tooltip": "The hour that <br> will be jumped ahead.",
                "default": 2,
                "max": 23,
                "min": 0,
                "step": 1
            }
        );
        html += "<hr><div class='main-bg-inverted'>" + helpEasy.capitalWord("dst ending") + "</div>";
        html += helpEasy.addInput(
            {
                "type": "dropdown",
                "title": "week",
                "alt": "settings-change",
                "settingsId": "config--5",
                "placeholder": "",
                "default": 0,
                "optionList": guiEasy.timelist.week
            }
        );
        html += helpEasy.addInput(
            {
                "type": "dropdown",
                "title": "day",
                "alt": "settings-change",
                "settingsId": "config--6",
                "placeholder": "",
                "default": 0,
                "optionList": guiEasy.timelist.day
            }
        );
        html += helpEasy.addInput(
            {
                "type": "dropdown",
                "title": "month",
                "alt": "settings-change",
                "settingsId": "config--7",
                "placeholder": "",
                "default": 0,
                "optionList": guiEasy.timelist.month
            }
        );
        html += helpEasy.addInput(
            {
                "type": "number",
                "toSettings": true,
                "alt": "settings-change",
                "title": "hour",
                "settingsId": "config--8",
                "placeholder": "",
                "tooltip": "The hour that <br> will be jumped behind.",
                "default": 2,
                "max": 23,
                "min": 0,
                "step": 1
            }
        );
    }
    if (type === "rules") {
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toSettings": true,
                "alt": "settings-change",
                "title": "use rules",
                "settingsId": "config--rules--enabled",
                "settingsTrue": 0,
                "settingsFalse": 1,
                "trueText": "rules are not used",
                "falseText": "rules are activated",
                "default": true
            }
        );
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toSettings": true,
                "alt": "settings-change",
                "title": "tolerant last parameter",
                "settingsId": "config--rules--tolerantArgs",
                "settingsTrue": 1,
                "settingsFalse": 0,
                "trueText": "last parameter can be left out",
                "falseText": "tolerance is set to strict",
                "default": true
            }
        );
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toSettings": true,
                "alt": "settings-change",
                "title": "use old rules engine",
                "settingsId": "config--rules--useNewEngine",
                "settingsTrue": 1,
                "settingsFalse": 0,
                "falseText": "old engine",
                "trueText": "experimental engine",
                "default": true
            }
        );
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toSettings": true,
                "alt": "settings-change",
                "title": "send to http wait for acknowledge",
                "settingsId": "config--rules--sendToHTTPack",
                "settingsTrue": 1,
                "settingsFalse": 0,
                "trueText": "send to http = wait for ok",
                "falseText": "send to http = send & forget",
                "default": true
            }
        );
    }
    if (type === "mqtt") {
        html += helpEasy.addInput(
            {
                "type": "number",
                "toSettings": true,
                "alt": "settings-change",
                "title": "message interval [ms]",
                "settingsId": "config--mqtt--interval",
                "placeholder": "",
                "tooltip": "This is the minimum time <br> in-between messages.",
                "default": 100,
                "max": 999999,
                "min": 0,
                "step": 1
            }
        );
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toSettings": true,
                "alt": "settings-change",
                "title": "mqtt retain",
                "settingsId": "config--mqtt--retain_flag",
                "settingsTrue": 1,
                "settingsFalse": 0,
                "trueText": "mqtt retain used",
                "falseText": "mqtt retain not used",
                "default": false
            }
        );
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toSettings": true,
                "alt": "settings-change",
                "title": "use user name",
                "settingsId": "config--mqtt--useunitname",
                "settingsTrue": 1,
                "settingsFalse": 0,
                "trueText": "use unit name as client id",
                "falseText": "use generic client id",
                "default": false
            }
        );
        html += helpEasy.addInput(
            {
                "type": "toggle",
                "toSettings": true,
                "alt": "settings-change",
                "title": "use client id",
                "settingsId": "config--mqtt--changeclientidrecon",
                "settingsTrue": 1,
                "settingsFalse": 0,
                "trueText": "change client id each connect",
                "falseText": "persistent client id",
                "default": false
            }
        );
    }
    html += helpEasy.openColumn();
    return html;
};

guiEasy.popper.modal.factoryReset = function () {
    let html = "<div class='column'>";
    html += helpEasy.addInput(
        {
            "type": "toggle",
            "title": "keep unit name",
            "settingsTrue": 0,
            "settingsFalse": 1,
            "trueText": "will keep unit name / no",
            "falseText": "will not keep unit name / no",
            "default":false
            }
        );
    html += helpEasy.addInput(
        {
            "type": "toggle",
            "title": "keep wifi config",
            "settingsTrue": 0,
            "settingsFalse": 1,
            "trueText": "will keep wifi config",
            "falseText": "will not keep wifi config",
            "default":false
        }
    );
    html += helpEasy.addInput(
        {
            "type": "toggle",
            "title": "keep network config",
            "settingsTrue": 0,
            "settingsFalse": 1,
            "trueText": "will keep network config",
            "falseText": "will not keep network config",
            "default":false
        }
    );
    html += helpEasy.addInput(
        {
            "type": "toggle",
            "title": "keep ntp dst config",
            "settingsTrue": 0,
            "settingsFalse": 1,
            "trueText": "will keep ntp / dst config",
            "falseText": "will not keep ntp / dst config",
            "default":false
        }
    );
    html += helpEasy.addInput(
        {
            "type": "toggle",
            "title": "keep log config",
            "settingsTrue": 0,
            "settingsFalse": 1,
            "trueText": "will keep log config",
            "falseText": "will not keep log config",
            "default":false
        }
    );
    html += "<hr>";
    html += helpEasy.addInput(
        {
            "type": "dropdown",
            "title": "pre-defined config to use",
            "placeholder": "",
            "default": 0,
            "optionList": guiEasy.gpiolist()            //TODO: populate with pre-configs
        }
    );
    return html + "</div>";
};

guiEasy.popper.drawer = function (drawerToOpen) {
    let drawerName = drawerToOpen.args[1];
    let drawerObject = document.getElementById("drawer-" + drawerName);
    let x = drawerObject.dataset;
    drawerObject.classList.toggle(x.close);
    drawerObject.classList.toggle(x.open);
    helpEasy.addToLogDOM("drawer: " + drawerName, 1);
};

guiEasy.popper.theme = function (whatToDo) {
    let what = whatToDo.args[1];
    if (what === "default") {
        let input = document.querySelectorAll('*[id^="theme-"]');
        for (let i = 0; i < input.length; i++) {
            if (input[i].dataset.alt === "css-familycustom") {
                continue;
            }
            let blob = {};
            blob.args = input[i].dataset;
            blob.placeholder = input[i].placeholder;
            blob.newValue = input[i].dataset.defaultValue;
            blob.newState = input[i].dataset.defaultValue;
            blob.index = input[i].dataset.defaultIndex;
            guiEasy.popper.css(blob);
        }
    }
    if (what === "copy" || what === "save") {
        let input = document.getElementById("custom-theme-settings");
        let themeOutput = JSON.stringify(input.dataset);
        themeOutput = themeOutput.match(/".*?\|.*?"/g);
        if (themeOutput === null) {
            themeOutput = ["NO CHANGES WAS MADE TO THE THEME"];
        }
        let themeVars = [];
        for (let i = 0; i < themeOutput.length; i++) {
            let line = themeOutput[i].split('":"')[1];
            themeVars[i] = line.slice(0, line.length-1);
        }
        themeVars.sort();
        let clipboard = "";
        for (let i = 0; i < themeVars.length; i++) {
            clipboard += themeVars[i];
            if (i !== (themeVars.length - 1)) {
                clipboard += "\n";
            }
        }
        if (what === "copy") {
            helpEasy.copyToClipboard(clipboard);
        } else {
            if (document.getElementById("label-temp") !== null) {
                document.getElementById("label-temp").remove();
            }
            let l = document.createElement("label");
            l.id = "label-temp";
            l.style.display = "none";
            document.body.appendChild(l);
            let file = new File(
                [clipboard],
                "theme.txt",
                {
                    type: "text/plain"
                }
            );
            helpEasy.uploadBinaryAsFile("generic", file, "temp");
            let eventDetails = {
                "type": "wave",
                "text": "theme saved",
                "color": "inverted"
            };
            guiEasy.popper.tryCallEvent(eventDetails);
        }
        whatToDo.args[1] = "theme";
        whatToDo.args[2] = what;
        guiEasy.popper.modal(whatToDo);
    }
    if (what === "import") {
        let importData;
        if (whatToDo.localFile) {
            importData = whatToDo.args[2];
        } else {
            importData = whatToDo.args[2].replace(/_/g,"-");
            importData = document.getElementById(importData).value;
        }
        document.getElementById("modal-container").classList.add("is-hidden");
        let themeVariables = importData.split("\n");
        let cssSettings = defaultSettings.css;
        for (let k =0; k < themeVariables.length; k++) {
            let h = themeVariables[k];
            let cssVar = h.split("|")[0];
            let cssValue = h.split("|")[1];
            let type = cssVar.split("-");
            type = type[(type.length - 1)];
            let newState = "";
            let placeholder = "";
            if (type === "toggle") {
                newState = cssSettings.toggle[cssVar][cssValue];
            }
            if (type === "size") {
                placeholder = cssSettings.size[cssVar].placeholder;
                cssValue = parseInt(cssValue);
            }
            let eventDetails = {
                "type": "update",
                "newValue": cssValue,
                "newState": newState,
                "placeholder": placeholder,
                "args": {
                    "alt": "css-" + type,
                    "change": cssVar
                }
            };
            //to not spam the event caller we add a delay (10ms per each call).
            setTimeout(function () {
                guiEasy.popper.tryCallEvent(eventDetails);
            }, (k*10));
        }
        guiEasy.guiStats.themeIsApplied = true;
    }
};

guiEasy.popper.delete = function (whatToDo) {
    let type = whatToDo.args[1];
    if (type === "file") {
        let z = document.getElementById(whatToDo.dataset.filename);
        z.classList.add("is-inactive");
        guiEasy.nodes[helpEasy.getCurrentIndex()].deleteFile = whatToDo.dataset.filename;
        let url = "http://" + guiEasy.nodes[helpEasy.getCurrentIndex()].ip + "/filelist?delete=" + whatToDo.dataset.filename;
        fetch(url).then( results => {
            helpEasy.addToLogDOM(("response: " + results), 2);
            helpEasy.schedulerBump(guiEasy.nodes[helpEasy.getCurrentIndex()].scheduler, "filelist_json");
            helpEasy.schedulerBump(guiEasy.nodes[helpEasy.getCurrentIndex()].scheduler, "sysinfo_json");
            helpEasy.updateIndicator();
            }
        );
    }
};

guiEasy.popper.ghost = function (whatToDo) {
    console.log(whatToDo);
};

guiEasy.popper.screenshot = function () {
    helpEasy.screenshot();
};

guiEasy.popper.area = function (whatToDo) {
    let newState = whatToDo.args[1];
    let id = whatToDo.args.slice(2).join("-");
    let area = document.getElementById(id);
    let buttonMin = document.getElementById("button-min-" + id);
    let buttonMax = document.getElementById("button-max-" + id);
    if (newState === "min") {
        area.classList.add("hide-contents");
        buttonMax.classList.remove("is-hidden");
        buttonMin.classList.add("is-hidden");
    } else {
        area.classList.remove("hide-contents");
        buttonMax.classList.add("is-hidden");
        buttonMin.classList.remove("is-hidden");
    }
};

guiEasy.popper.update = async function (whatToDo) {
    if (whatToDo.args[1] === "location") {
        if (helpEasy.internet() === true) {
            if (defaultSettings.location === undefined) {
                defaultSettings.location = await helpEasy.locationByIP();
            }
            document.getElementById("settings-input-Longitude-[°]").value = defaultSettings.location.longitude;
            document.getElementById("settings-input-Latitude-[°]").value = defaultSettings.location.latitude;
        } else {
            //flash the screen, since no internet we cannot use the external data..
            let eventDetails = {
                "type": "wave",
                "text": "No internet!",
                "color": "warning"
            };
            guiEasy.popper.tryCallEvent(eventDetails);
        }
    }
    //these can be skipped if the alt isn't populate
    if (whatToDo.args.alt === undefined) {
        return;
    }
    if (whatToDo.args.alt === "settings-change") {
        guiEasy.popper.settingsDiff(whatToDo);
    }
    let type = whatToDo.args.alt.split("-")[0];
    if (type === "css") {
        guiEasy.popper.css(whatToDo);
    }
    if (type === "editor") {
        //TODO: send to syntax highlighter...
        console.log(whatToDo);
    }
};

guiEasy.popper.task = function (whatToDo) {
    if (whatToDo.args[1] === "edit") {
        let taskNumber = parseInt(whatToDo.args[2]);
        let dataset = document.getElementById("setup-templates").dataset;
        let presetPluginNumber = guiEasy.nodes[helpEasy.getCurrentIndex()].settings.tasks[(taskNumber-1)].device;
        if (presetPluginNumber === 0) {
            //no plugin is setup
        }
        if (presetPluginNumber) {
            //a plugin is set up but not part of firmware = cannot run
        }
        guiEasy.popper.modal({"args":[taskNumber,"task","edit"]});
        console.log(presetPluginNumber);
    }
    console.log(whatToDo);
};

guiEasy.popper.settingsDiff = function (whatToDo) {
    let type = whatToDo.args.type;
    let settingsPath = whatToDo.args.settings.split("--");
    let index = helpEasy.getCurrentIndex();
    let x = guiEasy.nodes[index].settings;
    let y = guiEasy.nodes[index].settingsBrowser;
    if (type === "string") {
        if (whatToDo.args.settingsIp !== undefined) {
            let ip = whatToDo.newValue;
            //maximum length of ip number is 15
            ip = ip.slice(0, 15);
            document.getElementById(whatToDo.args.id).value = ip;
            if (helpEasy.checkIfIP(ip)) {
                helpEasy.blinkElement(whatToDo.args.id, "success");
            } else {
                helpEasy.blinkElement(whatToDo.args.id, "warning");
            }
        }
    }
    if (type === "toggle") {
        let toggle = document.getElementById(whatToDo.args.id);
        let label = document.getElementById("label-" + whatToDo.args.id);
        if (label.children.length > 0) {
            //we got tooltip
            let tooltip = label.innerHTML.match(/<div class="tooltip">([\s\S]*?)<\/div>/)[1];
            label.innerHTML = `
                    <div class="got-tooltip">
                ` + helpEasy.capitalWord(toggle.dataset[toggle.checked + "Text"]) +
                `   <div class='tooltip'>` + tooltip + `</div>
                    </div>
            `;
        } else {
            label.innerHTML = helpEasy.capitalWord(toggle.dataset[toggle.checked + "Text"]);
        }
    }
};

guiEasy.popper.settings = function (whatToDo) {
    if (whatToDo.args[2] === undefined) {
        whatToDo.args[2] = "inverted";
    }
    let eventDetails = {
        "type": "wave",
        "text": whatToDo.args[1],
        "color": whatToDo.args[2]
    };
    guiEasy.popper.tryCallEvent(eventDetails);
};

guiEasy.popper.wave = function (args) {
    let waveElement = document.getElementById("wave");
    let textElement = document.getElementById("wave-text");
    waveElement.classList.add("main-" + args.color);
    textElement.innerHTML = helpEasy.capitalWord(args.text);
    waveElement.classList.remove("is-inactive");
    setTimeout( function () {
        waveElement.classList.add("is-inactive");
        waveElement.classList.remove("main-" + args.color);
    }, 800);
};

guiEasy.popper.shortcut = function (keyboard) {
    let keyCombo = "";
    let pd = defaultSettings.userSettings.preventDefaults;
    if (keyboard.alt === true) {
        keyCombo += "alt "
    }
    if (keyboard.ctrl === true) {
        keyCombo += "ctrl ";
    }
    keyCombo += keyboard.key;
    keyCombo = keyCombo.trim().replace(/ /g, "+").toLowerCase();
    // "key" and the letter...
    if (keyCombo === "ctrl+keys" && keyboard.state === "keydown") {
        //Save settings...
        if (pd[keyCombo] === 1) {
            keyboard.event.preventDefault();
            let details = {};
            details.args = ("settings-save-success").split("-");
            guiEasy.popper.settings(details);
        }
    }
    if (keyCombo === "ctrl+keyz" && keyboard.state === "keydown") {
        //Cancel settings...
        if (pd[keyCombo] === 1) {
            keyboard.event.preventDefault();
            let details = {};
            details.args = ("settings-cancel-sunny").split("-");
            guiEasy.popper.settings(details);
            helpEasy.guiUpdaterSettings();
        }
    }
    if (keyCombo === "alt+altleft" && keyboard.state === "keydown") {
        //Show alt keys
        if (pd["alt+digit"] === 1) {
            keyboard.event.preventDefault();
            let alts = document.querySelectorAll(".alt-popup");
            for (let i = 0; i < alts.length; i++) {
                alts[i].classList.remove("is-hidden");
            }
        }
    }
    if (keyCombo === "ctrl+enter" && keyboard.state === "keydown") {
        //Screenshot
        if (pd[keyCombo] === 1) {
            keyboard.event.preventDefault();
            helpEasy.screenshot();
        }
    }
    if (keyCombo === "altleft" && keyboard.state === "keyup") {
        //Hide alt keys
        let alts = document.querySelectorAll(".alt-popup");
        for (let i = 0; i < alts.length; i++) {
            alts[i].classList.add("is-hidden");
        }
    }
    if (keyCombo === "escape" && keyboard.state === "keydown") {
        //close open modal
        if (pd[keyCombo] === 1) {
            keyboard.event.preventDefault();
            guiEasy.popper.modal({"args": ["modal", "close"]});
        }
    }
    if (keyCombo === "ctrl+space" && keyboard.state === "keydown") {
        //Show swarm
        if (pd[keyCombo] === 1) {
            keyboard.event.preventDefault();

        }
    }
    //ALT + DIGIT 0...9
    let number = keyCombo.replace( /^\D+/g, "");
    if (keyCombo === ("alt+digit" + number) && keyboard.state === "keydown") {
        //Goto tab..
        if (pd["alt+digit"] === 1) {
            keyboard.event.preventDefault();
            guiEasy.popper.tab({"args": ["tab", number]});
        }
        //guiEasy.popper.tab({"args":["tab", guiEasy.tabNumber[number]]}); <---- keep as reference now that numerical value is accepted
    }
    //APT + ARROW left/right, skip tabs
    if (
        (keyCombo === "alt+arrowleft"  && keyboard.state === "keydown") ||
        (keyCombo === "alt+arrowright" && keyboard.state === "keydown")
    ) {
        if (pd["alt+arrows"] === 1) {
            keyboard.event.preventDefault();
            let tabNumber = guiEasy.current.tabNumber;
            if (keyCombo === "alt+arrowleft") {tabNumber = tabNumber - 1} else {tabNumber = tabNumber + 1}
            while (guiEasy.tabNumber[tabNumber] === undefined) {
                if (keyCombo === "alt+arrowleft") {tabNumber = tabNumber - 1} else {tabNumber = tabNumber + 1}
                if (tabNumber < 0) {tabNumber = 9}
                if (tabNumber > 9) {tabNumber = 0}
            }
            guiEasy.popper.tab({"args":["tab", tabNumber]});
        }
    }
    helpEasy.addToLogDOM("key combo: " + keyCombo + " (" + keyboard.state + ")", 2);
};

guiEasy.popper.favicon = function () {
    let colors = {
        "inverted": "#2F4252",
        "sunny": "#FFD100",
        "info": "#FF8F12",
        "warning": "#EF483D",
        "success": "#00AE41",
        "font": "#FFFFFF"
    };
    let themeSetting = document.getElementById("custom-theme-settings").dataset;
    if (Object.keys(themeSetting).length > 0) {
        for (let i = 0; i < Object.keys(themeSetting).length; i++) {
            let x = Object.keys(themeSetting)[i].toString();
            let color = x.split(/(?=[A-Z])/).map(s => s.toLowerCase());
            colors[color[1]] = helpEasy.rgb2hex(themeSetting[x].split("|")[1]);
        }
    }
  helpEasy.favicon(colors);
};

guiEasy.popper.css = function (blob) {
    let z = document.documentElement.style;
    let fallbackFonts = "'Segoe UI', Calibri, Arial";
    let themeSetting = document.getElementById("custom-theme-settings");
    let type = blob.args.alt.split("-")[1];
    let cssVar = blob.args.change;
    let newValue = blob.newValue;
    let inputElement = document.getElementById("theme-" + cssVar);
    if (type === "color") {
        if (newValue.match("#")) {
            newValue = helpEasy.hex2rgb(newValue);
        }
        inputElement.value = helpEasy.rgb2hex(newValue);
        if (cssVar === "main-bg-color") {
            //The overall color used by some browsers to color their navbar and thumbnails etc.
            document.getElementsByName("theme-color")[0].content = helpEasy.rgb2hex(newValue);
            guiEasy.current.backgroundColor = helpEasy.rgb2hex(newValue);
        }
        if (cssVar === "main-inverted-color") {
            guiEasy.current.invetedColor = helpEasy.rgb2hex(newValue);
        }
    }
    if (type === "toggle") {
        let newState = blob.newState;
        let newStateToValue = helpEasy.swapKey2Value(defaultSettings.css.toggle[cssVar]);
        newValue = newStateToValue[newState];
        let alreadySet = document.getElementById("theme-" + cssVar).dataset;
        if (alreadySet[(newState + "Text")] === undefined) {
            document.getElementById("label-" + cssVar).innerText = blob.args[(newState + "Text")];
        } else {
            document.getElementById("label-" + cssVar).innerText = alreadySet[(newState + "Text")];
        }
        document.getElementById("theme-" + cssVar).checked = newState;
    }
    if (type === "size") {
        inputElement.value = newValue;
        newValue += blob.placeholder;
    }
    if (type === "family") {
        let customFontRow = document.getElementById("row-custom-font-family");
        let customFontInput = document.getElementById("theme-custom-font-family");
        let index = 0;
        let loop = defaultSettings.css.family["default-font-family"];
        for (let k = 0; k < loop.length; k++) {
            if (loop[k].value === newValue) {
                index = k;
            }
        }
        if (index > 0) {
            inputElement.selectedIndex = index;
            customFontInput.value = "";
            customFontRow.classList.add("is-hidden");
        } else {
            //CUSTOM FONT WANTED
            inputElement.selectedIndex = 0;
            customFontRow.classList.remove("is-hidden");
            customFontRow.scrollIntoView(true);
            //See if a custom font name is given
            let test = newValue.split("|");
            if (test.length > 1) {
                newValue = fallbackFonts;
            } else {
                //Parse the font name
                let customFontName = newValue.replace(", " + fallbackFonts, "");
                customFontName = customFontName.replace(/'/g, "");
                document.getElementById("theme-custom-font-family").value = customFontName;
                let customFont = guiEasy.popper.css.customFont();
                newValue = "'" + customFont + "', " + fallbackFonts;
            }
        }
    }
    if (type === "familycustom") {
        let customFont = guiEasy.popper.css.customFont();
        newValue = "'" + customFont + "', " + fallbackFonts;
    }
    if (type === "url") {
        inputElement.value = newValue;
        guiEasy.popper.css.customBackground(blob);
    }
    //We store the values in a DOM element to easier fetch them later (export of theme etc.)
    themeSetting.setAttribute("data-" + cssVar, cssVar + "|" + newValue);
    //update the HTML element
    z.setProperty("--" + cssVar, newValue);
    guiEasy.popper.favicon();
};

guiEasy.popper.css.testUrl = function(url, linkId, elementId) {
    let link = document.getElementById(linkId);
    if (link !== null) {
        link.remove();
    }
    link = document.createElement("link");
    link.id = linkId;
    link.type = "text/css";
    link.rel = "stylesheet";
    link.setAttribute("data-error", "warning");
    link.setAttribute("data-load", "success");
    link.addEventListener("error", function () {
        helpEasy.blinkElement(elementId,"warning");
    });
    link.addEventListener("load", function () {
        helpEasy.blinkElement(elementId,"success");
    });
    document.head.appendChild(link);
    link.href = url;
};

guiEasy.popper.css.customFont = function () {
    let linkId = "custom-google-font-link";
    let elementId = "theme-custom-font-family";
    let googleUrl = "https://fonts.googleapis.com/css?family=";
    let fontName = document.getElementById(elementId);
    let url = googleUrl + fontName.value.split(' ').join('+');
    guiEasy.popper.css.testUrl(url, linkId, elementId);
    return fontName.value;
};

guiEasy.popper.css.customBackground = function (blob) {
    let url = blob.newValue;
    let body = document.body;
    let selector1 = "body.got-wallpaper::after";
    let selector2 = "div.got-wallpaper::after";
    //let selector = "body.got-wallpaper nav, body.got-wallpaper::after";
    if (url === "") {
        body.classList.remove("got-wallpaper");
    }
    let linkId = "custom-background-link";
    let elementId = "theme-custom-wallpaper-url";
    guiEasy.popper.css.testUrl(url, linkId, elementId);
    let stylesheet = document.styleSheets[0];
    for (let i = 0; i < stylesheet.cssRules.length; i++) {
        let x = stylesheet.cssRules[i];
        if (x.selectorText === selector1 || x.selectorText === selector2) {
            x.style.background = "url(" + url + ")";
            x.style.backgroundRepeat = "no-repeat";
            x.style.backgroundPosition = "center center";
            x.style.backgroundSize = "cover";
            x.style.backgroundAttachment = "fixed";
            x.style.backgroundAttachment = "fixed";
        }
    }
    if (url !== "") {
        body.classList.add("got-wallpaper");
    }
};
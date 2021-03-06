/* GUIEasy  Copyright (C) 2019-2020  Jimmy "Grovkillen" Westberg */
//HERE WE ADD THINGS THAT THE CLIENT WANTS TO DO
guiEasy.pitcher = function (processID, processType) {
    let maxTimeout = 20 * 1000;
    let urlParams = helpEasy.urlParams();
    helpEasy.getGuiInFields();
    helpEasy.setCurrentIndex(-1);
    if (window.location.hostname === "localhost") {
        guiEasy.nodes.push({"ip":"192.168.73.164", "type":"queen"});  //THIS ONE IS USED TO RUN THE GUI FROM LOCALHOST
    } else {
        guiEasy.nodes.push({"ip": window.location.hostname, "type":"queen"});
    }
    helpEasy.pingIP(guiEasy.nodes, helpEasy.handlePingResults, helpEasy.handlePingResults).then(r => r);
    helpEasy.scheduleFetch(guiEasy.nodes, 0);
    //first make sure the "live" json is populated with data
    let timeoutX = guiEasy.fetchSettings.intervalTimeKeeper;
    let maxLoopsX = Math.floor(maxTimeout / timeoutX);
    let LCX = 0;
    let x = setInterval(function () {
        LCX++;
        if (LCX > maxLoopsX) {
            helpEasy.addToLogDOM("'live' not working!", 0, "warning");
            helpEasy.processDone(processID, processType);
            return;
        }
        if (guiEasy.current.live !== undefined) {
            clearInterval(x);
            guiEasy.pitcher.loadTheme();
            guiEasy.pitcher.loadGUIsettings();
            helpEasy.setCurrentIndex(0);
            guiEasy.current.live = helpEasy.getCurrentIndex();
            //update graphics
            helpEasy.guiUpdater();
            helpEasy.addToLogDOM("pageSize", 1);
        }
    }, timeoutX);
    //now make sure that the data is injected into page before continue
    let timeoutY = 50;
    let maxLoopsY = Math.floor(maxTimeout / timeoutY);
    let LCY = 0;
    let y = setInterval(function () {
        LCY++;
        if (LCY > maxLoopsY) {
            helpEasy.addToLogDOM("'gui' not working!", 0, "warning");
            helpEasy.processDone(processID, processType);
            return;
        }
        if (guiEasy.current.gui !== undefined) {
            clearInterval(y);
            //get data from queen... index for queen is zero
            helpEasy.fetchConfigDat(guiEasy.nodes, helpEasy.getCurrentIndex());
            helpEasy.addToLogDOM("pageSize", 1);
        }
    }, timeoutY);

    //now make sure that we have the config of the first unit (queen)
    let timeoutZ = 50;
    let maxLoopsZ = Math.floor(maxTimeout / timeoutZ);
    let LCZ = 0;
    let z = setInterval(function () {
        LCZ++;
        if (LCZ > maxLoopsZ) {
            helpEasy.addToLogDOM("'config' not working!", 0, "warning");
            helpEasy.processDone(processID, processType);
            return;
        }
        if (guiEasy.current.config !== undefined) {
            clearInterval(z);
            helpEasy.guiUpdaterSettings();
            let x = guiEasy.nodes[helpEasy.getCurrentIndex()].settings.config.general;
            if (x.unitnr !== 0 && x.unitname !== "ESP_Easy") {
                document.getElementById("welcome-text").classList.add("is-hidden");
            }
            helpEasy.addToLogDOM("pageSize", 1);
        }
    }, timeoutZ);

    //when all are populated...
    let timeoutU = 1;
    let LCU = 0;
    let maxLoopsU = Math.floor(maxTimeout / timeoutU);
    let u = setInterval(function () {
        LCU++;
        if (LCU > maxLoopsU) {
            helpEasy.addToLogDOM("'live'/'gui'/'config' not working!", 0, "warning");
            helpEasy.processDone(processID, processType);
            return;
        }
        if (
            guiEasy.current.live !== undefined &&
            guiEasy.current.gui !== undefined &&
            guiEasy.current.config !== undefined
        ) {
            clearInterval(u);
            //take care of url parameters...
            guiEasy.popper.tab({"args":["tab",urlParams.tab]});
            console.log(urlParams);
            helpEasy.addToLogDOM("pageSize", 1);
            helpEasy.processDone(processID, processType);
            console.log(guiEasy.nodes[helpEasy.getCurrentIndex()]);

        }
    }, timeoutU);
    //and we're live and kicking!
};

guiEasy.pitcher.loadGUIsettings = function () {
    let typeOfStartup = "silentStartup";
    if (defaultSettings.userSettings.waitForTheme === 1) {
        typeOfStartup = "startup";
    }
    helpEasy.listOfProcesses(
        "gui",
        "Waiting for gui settings to be applied",
        Date.now(),
        typeOfStartup
    );
    let x = setInterval(function () {
        let y = guiEasy.nodes[helpEasy.getCurrentIndex()].live;
        if (y.filelist_json !== undefined) {
            clearInterval(x);
            let files = y.filelist_json.map(a => a.fileName);
            if (files.indexOf("gui.txt") > -1) {
                helpEasy.addToLogDOM("Applying GUI settings", 1);
                let timeStart = Date.now();
                let path = "http://" + guiEasy.nodes[helpEasy.getCurrentIndex()].ip + "/gui.txt?callback=" + timeStart;
                fetch(path)
                    .then(response => response.json())
                    .then(json => {
                        defaultSettings.userSettings = json;
                        helpEasy.processDone("gui", typeOfStartup);
                    })
            } else {
                helpEasy.processDone("gui", typeOfStartup);
            }
        }
    }, 25)

};

guiEasy.pitcher.loadTheme = function () {
    let typeOfStartup = "silentStartup";
    if (defaultSettings.userSettings.waitForTheme === 1) {
        typeOfStartup = "startup";
    }
    helpEasy.listOfProcesses(
        "theme",
        "Waiting for theme to be applied",
        Date.now(),
        typeOfStartup
    );
    let x = setInterval(function () {
        let y = guiEasy.nodes[helpEasy.getCurrentIndex()].live;
        if (y.filelist_json !== undefined) {
            clearInterval(x);
            let files = y.filelist_json.map(a => a.fileName);
            if (files.indexOf("theme.txt") > -1) {
                helpEasy.addToLogDOM("Applying theme", 1);
                let timeStart = Date.now();
                let path = "http://" + guiEasy.nodes[helpEasy.getCurrentIndex()].ip + "/theme.txt?callback=" + timeStart;
                fetch(path)
                    .then(response => response.text())
                    .then(text => {
                        guiEasy.popper.theme({
                            "localFile": true,
                            "args":["theme","import",text]
                        });
                        helpEasy.processDone("theme", typeOfStartup);
                    })
            } else {
                helpEasy.processDone("theme", typeOfStartup);
            }
        }
    }, 25)
};
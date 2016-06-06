function MTX_Finder(AccountName) {
    var _this = this;
    _this.accountName = AccountName;
    _this.leagueName = "Standard";
    _this.effects = [];
    _this.numTabs = 0;
    _this.characters = [];
    _this.charEffects = [];
    _this.leagues = ["Standard", "Hardcore", "Prophecy", "Hardcore Prophecy"];
    _this.charBool = false;
    _this.skinBool = false;
    _this.modal = $("#mtx_finder_container");
    _this.content = $("#mtx_finder_content");
    
    _this.createDisplay = function() {
         _this.removeDisplay();
        $(document.body).append("<div style=\"z-index: 10000; color: #a38d6d; border-color: #a38d6d; width: 50%; height: 50%; position: absolute; left: 25%; top: 25%; overflow-y: auto; line-height: 25px;\" class='newsListItem' id='mtx_finder_container'></div>");
        _this.modal = $("#mtx_finder_container"); //new container was created, so we need to reassign the variable
        _this.modal.append("<h2 class='title'><a href='https://www.pathofexile.com/forum/view-thread/989787'>MTX Finder<a><h2>");
        _this.modal.append("<a class='date' target='_blank' href='https://www.paypal.me/EmmittJ'>Donate<a>");
        _this.modal.append("<div class='content' id='mtx_finder_content'>\
                    <strong>Select a league: </strong>\
                    <div class=\"_leagues\"></div><br>\
                    <strong>Options: </strong><br>\
                    <input type='checkbox' id=\"charOnly\"/>Show MTX on Characters only<br>\
                    <input type='checkbox' id='skinRemove' />Hide skin transfers<br>\
                    <a class='allChars' href='#'>Search each Character in every League</a><div><br>");
        _this.content = $("#mtx_finder_content"); //same as above, new content
        _this.modal.append("<button onclick='mtx_finder.removeDisplay()'>Close</button>");
        _this.leagues.forEach(function (league, i) {
            $("._leagues").append("<a class=\"_mtx\" href=\"#\">" + league + "</a>" + (i === _this.leagues.length - 1 ? "" : ", "));
        });
        
        $("a._mtx").unbind("click", _this.leagueBinding);
        $("a._mtx").bind("click", _this.leagueBinding);
        $("a.allChars").unbind("click", _this.charBinding);
        $("a.allChars").bind("click", _this.charBinding);
    };
    _this.removeDisplay = function(){
        if (_this.modal.length != 0)
            _this.modal.remove();
    };
    _this.start = function() {
        $.ajax({
            url: "https://www.pathofexile.com/character-window/get-stash-items?league=" + _this.leagueName + "&accountName=" + _this.accountName,
            success: function (data) {
                if (data.error == undefined) { //checking to see if we got data or not
                    console.log("Started on: " + _this.leagueName);
                    _this.numTabs = data.numTabs;
                    //alert(charBool + " " + skinBool);
                    if (_this.charBool) { //only pull characters
                        _this.pullChars();
                    } else { //tabs plus characters
                        _this.pullItems();
                    }
                } else { //too many requests so we can't even pull stashes
                    _this.content.html("An error has occurred. Please try waiting a couple minutes and running your search again. Thanks!<br>");
                    _this.content.append("<button onclick='mtx_finder.restart()'>Main Menu</button>");
                    var currentdate = new Date();
                    var datetime = currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();
                    console.log(datetime);
                    console.log(data.error.message);
                }
            }
        });
    };
    
    _this.restart = function() {
        _this.effects = [];
        _this.numTabs = 0;
        _this.characters = [];
        _this.charEffects = [];
        _this.charBool = false;
        _this.skinBool = false;
        _this.createDisplay();
    };
    
    _this.pullItems = function() {
        console.log("You have " + _this.numTabs.toString() + " tabs.");
        _this.content.prepend("<hr>You have " + _this.numTabs.toString() + " tabs.<br>");
        _this.pullItemTab(0);
    };
    
    _this.pullItemTab = function(i) {
        if (i < _this.numTabs) {
            var tabUrl = "https://www.pathofexile.com/character-window/get-stash-items?league=" + _this.leagueName + "&tabs=1&tabIndex=" + i.toString() + "&accountName=" + _this.accountName;
            $.ajax({
                url: tabUrl,
                success: function (data1) {
                    //console.log("Querying: " + tabUrl);
                    if (data1.error == undefined) { //make sure we got data
                        console.log("-- success: " + i);
                        _this.content.prepend("Successful pull on tab: " + data1.tabs[i].n + " (" + i + ")<br>"); //let the user see what's happening
                        for (itemsKey in data1.items) { //loop through all items
                            var item = data1.items[itemsKey];
                            if (item.socketedItems.length > 0) //search if item contains anything in sockets
                            {
                                for (gems in item.socketedItems) { //search the gems in sockets
                                    if (item.socketedItems[gems].cosmeticMods != undefined) { // make sure cosmetics are on those gems
                                        if (item.socketedItems[gems].cosmeticMods.length > 0) {
                                            _this.effects.push({ //array of effects
                                                cosmeticMods: item.socketedItems[gems].cosmeticMods,
                                                typeLine: item.socketedItems[gems].typeLine,
                                                name: data1.tabs[i].n,
                                                x: item.x + 1,
                                                y: item.y + 1
                                            });
                                        }
                                    }
                                }
                            }
                            if (item.cosmeticMods != undefined) { //same as above
                                if (_this.skinBool && item.cosmeticMods.toString().search('Skin') > 0 && item.cosmeticMods.length == 1) {
                                    //leaving out skins if true
                                } else {
                                    if (item.cosmeticMods) { //same as above
                                        _this.effects.push({
                                            cosmeticMods: item.cosmeticMods,
                                            typeLine: item.typeLine,
                                            name: data1.tabs[i].n,
                                            x: item.x + 1,
                                            y: item.y + 1
                                        });
                                    }
                                }
                            }
                        }
                        _this.pullItemTab(i + 1); //start the next tab
                    } else {
                        console.log("Error in pulling tab: " + i.toString());
                        _this.content.prepend("Server has denied tab request please wait. On tab: " + i.toString() + "<br>Please do not refresh page.<br>");
                        //start the function later because we hit the get limit
                        setTimeout(function () {
                            _this.pullItemTab(i);
                        }, 60000);
                    }
                }

            });
        } else {
            console.log("Finished with tabs");
            _this.pullChars(); //...yep
        }
    };
    
    _this.pullChars = function() {
        $.ajax({
            url: "https://www.pathofexile.com/character-window/get-characters",
            success: function (data2) {
                console.log("Getting all characers");
                var numChars = 0;
                for (var i = 0; i < data2.length; i++) {
                    if (data2[i].league == _this.leagueName) {
                        _this.characters.push(data2[i].name);
                        numChars++;
                    }
                }
                console.log("You have " + numChars + " character(s) in " + _this.leagueName);
                _this.content.prepend("<hr>You have " + numChars + " character(s) in " + _this.leagueName + "<br>");
                _this.pullEachChar(0);
            }
        });
    };
    
    _this.pullAllChars = function() { //helper for pullEachChar (all)
        $.ajax({
            url: "https://www.pathofexile.com/character-window/get-characters",
            success: function (data2) {
                console.log("Getting all characers");
                var numChars = 0;
                for (var i = 0; i < data2.length; i++) {
                    _this.characters.push(data2[i].name);
                    numChars++;
                }
                console.log("You have " + numChars + " character(s)");
                _this.content.prepend("<hr>You have " + numChars + " character(s)<br>");
                _this.pullEachChar(0);
            }
        });
    };
    
    _this.pullEachChar = function(i) { //uses same logic pretty much as tabs
        if (i < _this.characters.length) { //characters.length
            var char = _this.characters[i];
            $.ajax({
                url: "https://www.pathofexile.com/character-window/get-items?character=" + char + "&accountName=" + _this.accountName,
                charName: char,
                success: function (data) {
                    if (data.error == undefined) {
                        console.log("--success: " + char);
                        _this.content.prepend("Successful pull on character: " + char + "<br>");
                        for (itemsKey in data.items) {
                            var item = data.items[itemsKey];
                            if (item.socketedItems.length > 0) {
                                for (gems in item.socketedItems) {
                                    if (item.socketedItems[gems].cosmeticMods != undefined) {
                                        if (item.socketedItems[gems].cosmeticMods.length > 0) {
                                            _this.charEffects.push({
                                                charName: this.charName,
                                                cosmeticMods: item.socketedItems[gems].cosmeticMods,
                                                typeLine: item.socketedItems[gems].typeLine,
                                                league: data.character.league
                                            });
                                        }
                                    }
                                }
                            }
                            if (item.cosmeticMods != undefined) {
                                if (_this.skinBool && item.cosmeticMods.toString().search('Skin') > 0 && item.cosmeticMods.length == 1) {
                                } else {
                                    if (item.cosmeticMods) {
                                        _this.charEffects.push({
                                            charName: this.charName,
                                            cosmeticMods: item.cosmeticMods,
                                            typeLine: item.typeLine,
                                            league: data.character.league
                                        });
                                    }
                                }
                            }
                        }
                        console.log(char + ": done");
                        _this.pullEachChar(i + 1);
                    } else {
                        console.log("Error in pulling character: " + char);
                        _this.content.prepend("Server has denied character request please wait. On character: " + char + "<br>Please do not refresh page.<br>");
                        setTimeout(function () {
                            _this.pullEachChar(i);
                        }, 60000);
                    }
                }
            });

        } else {
            console.log("Characters finished");
            _this.showEffects();
        }
    };
    
    _this.log = function(msg, nobr) {
        _this.content.append(msg + (nobr ? "" : "<br>"));
    };
    
    _this.showEffects = function() { // final stage!
        _this.content.html("");
        if (_this.charEffects.length == 0 && _this.effects.length == 0) {
            _this.log("No MTX's have been found", true);
        }
        
        for (var charEffect in _this.charEffects) {
            var e = _this.charEffects[charEffect];
            for (var i = 0; i < e.cosmeticMods.length; i++) {
                e.cosmeticMods[i] = e.cosmeticMods[i].replace("Has ", "");
            }
            e.typeLine = e.typeLine.replace("<<set:MS>><<set:M>><<set:S>>", "");
            _this.log("- \"" + e.cosmeticMods.join(", ") + "\" on \"" + e.typeLine + "\" on char \"" + e.charName + "\" in league \"" + e.league + "\"");
        }

        _this.log("<hr>", true);
        for (var effect in _this.effects) {
            var e = _this.effects[effect];
            for (var i = 0; i < e.cosmeticMods.length; i++) {
                e.cosmeticMods[i] = e.cosmeticMods[i].replace("Has ", "");
            }
            _this.log("- \"" + e.cosmeticMods.join(", ") + "\" on \"" + e.typeLine + "\" in tab '" + e.name + "' at " + e.x + ", " + e.y);
        }
        _this.log("<button onclick='mtx_finder.restart()'>Main Menu</button>");
    };
    
    _this.leagueBinding = function(e) {
        e.preventDefault();
        //since clearing the modal gets rid of the check boxes I needed to make them variables
        if ($('#charOnly').is(':checked')) {
            _this.charBool = true;
        }
        if ($('#skinRemove').is(':checked')) {
            _this.skinBool = true;
        }
        _this.leagueName = $(this).html();
        console.log(_this.leagueName);
        $("._leagues").remove();
        _this.content.html("Please wait...this could take a few minutes<br>");
        _this.start();
    };
    
    _this.charBinding = function(e) {
        e.preventDefault();
        if ($('#skinRemove').is(':checked')) {
            _this.skinBool = true;
        }
        _this.leagueName = $(this).html();
        console.log(_this.leagueName);
        $("._leagues").remove();
        _this.content.html("Please wait...this could take a few minutes<br>");
        _this.pullAllChars();
    };
}

//initialization stuff  
var accountString = $('.profile-link:first').find("a:first").html();
if (accountString === undefined)
    alert("Please login to continue using MTX Finder");
var accountName = "";
if (accountString.indexOf(">") >= 0)
    accountName = accountString.substring(accountString.indexOf(">") + 1);
else
    accountName = accountString;
var mtx_finder = new MTX_Finder(accountName);
mtx_finder.createDisplay();
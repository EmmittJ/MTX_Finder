function log(msg, nobr) {
    $("#modal").append(msg + (nobr ? "" : "<br>"));
}
function MTX_Finder(AccountName) {
    this.accountName = AccountName;
    this.leagueName = "Standard";
    this.effects = [];
    this.numTabs = 0;
    this.characters = [];
    this.charEffects = [];
    this.leagues = ["Standard", "Hardcore", "Prophecy", "Hardcore Prophecy"];
    this.charBool = false;
    this.skinBool = false;
    this.checkLoading = function() {
        console.log("here");
    };
};

$( document ).ready(function() {
    var accountString = $('.profile-link:first').find("a:first").html();
    if (accountString === undefined)
        alert("Please login to continue using MTX Finder");
    var accountName = "";
    if (accountString.indexOf(">") >= 0)
        accountName = accountString.substring(accountString.indexOf(">") + 1);
    else
        accountName = accountString;
    var mtx_finder = new MTX_Finder(accountName);
    mtx_finder.checkLoading();
    //display league selection
    $(document.body).append("<div style=\"z-index: 10000; background: black; color: white; border: 2px solid white; padding: 10px; width: 50%; height: 50%; position: absolute; left: 25%; top: 25%; overflow-y: auto; line-height: 25px;\" id=\"modal\">Please select your league.<br><div class=\"_leagues\"></div><input type='checkbox' id=\"charOnly\"/>Characters Only<input type='checkbox' id='skinRemove' />Don't show skin xfers<br><a class='allChars' href='#'>Search characters in every league</a><br></div>");
    $modal = $("#modal");
    log("<button onclick=\"$modal.remove();\">Close</button>");
    leagues.forEach(function (league, i) {
        $("._leagues").append("<a class=\"_mtx\" href=\"#\">" + league + "</a>" + (i === leagues.length - 1 ? "<br>" : ", "));
    });
});

//starts the whole process 
function start() {
    $.ajax({
        url: "https://www.pathofexile.com/character-window/get-stash-items?league=" + leagueName + "&accountName=" + accountName,
        success: function (data) {
            if (data.error == undefined) { //checking to see if we got data or not
                console.log("Started on: " + leagueName);
                numTabs = data.numTabs;
                //alert(charBool + " " + skinBool);
                if (charBool) { //only pull characters
                    pullChars();
                } else { //tabs plus characters
                    pullItems();
                }
            } else { //too many requests so we can't even pull stashes
                $modal.html("An error has occured, you may be trying to run this script too many times.<br>Please refresh browser and try again in a couple minutes.<br>");
                $modal.append("<button onclick='location.reload(true);'>Reload page</button>");
                var currentdate = new Date();
                var datetime = currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();
                console.log(data.error.message);
                console.log(datetime);
            }
        }
    });
}
//Main Menu button logic
function restart() {
    effects = [];
    numTabs = 0;
    characters = [];
    charEffects = [];
    charBool = false;
    skinBool = false;
    $modal.html("Please select your league.<br><div class=\"_leagues\"></div><input type='checkbox' id=\"charOnly\"/>Characters Only<input type='checkbox' id='skinRemove' />Don't show skin xfers<br><a class='allChars' href='#'>Search characters in every league</a><br>");
    leagues.forEach(function (league, i) {
        $("._leagues").append("<a class=\"_mtx\" href=\"#\">" + league + "</a>" + (i === leagues.length - 1 ? "<br>" : ", "));
    });
    log("<button onclick=\"$modal.remove();\">Close</button>");
}
//helper function for pullItemTab
function pullItems() {
    console.log("You have " + numTabs.toString() + " tabs.");
    $modal.prepend("<hr>You have " + numTabs.toString() + " tabs.<br>");
    pullItemTab(0);
}
//recursive tab pulling, was the easiest way to do it
function pullItemTab(i) {
    if (i < numTabs) {
        var tabUrl = "https://www.pathofexile.com/character-window/get-stash-items?league=" + leagueName + "&tabs=1&tabIndex=" + i.toString() + "&accountName=" + accountName;
        $.ajax({
            url: tabUrl,
            success: function (data1) {
                //console.log("Querying: " + tabUrl);
                if (data1.error == undefined) { //make sure we got data
                    console.log("-- success: " + i);
                    $modal.prepend("Successful pull on tab: " + data1.tabs[i].n + " (" + i + ")<br>"); //let the user see what's happening
                    for (itemsKey in data1.items) { //loop through all items
                        var item = data1.items[itemsKey];
                        if (item.socketedItems.length > 0) //search if item contains anything in sockets
                        {
                            for (gems in item.socketedItems) { //search the gems in sockets
                                if (item.socketedItems[gems].cosmeticMods != undefined) { // make sure cosmetics are on those gems
                                    if (item.socketedItems[gems].cosmeticMods.length > 0) {
                                        effects.push({ //array of effects
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
                            if (skinBool && item.cosmeticMods.toString().search('Skin') > 0 && item.cosmeticMods.length == 1) {
                                //leaving out skins if true
                            } else {
                                if (item.cosmeticMods) { //same as above
                                    effects.push({
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
                    pullItemTab(i + 1); //start the next tab
                } else {
                    console.log("Error in pulling tab: " + i.toString());
                    $modal.prepend("Server has denied tab request please wait. On tab: " + i.toString() + "<br>Please do not refresh page.<br>");
                    //start the function later because we hit the get limit
                    setTimeout(function () {
                        pullItemTab(i);
                    }, 60000);
                }
            }

        });
    } else {
        console.log("Finished with tabs");
        pullChars(); //...yep
    }
}

function pullChars() { //helper for pullEachChar (league based)
    $.ajax({ //-
        url: "https://www.pathofexile.com/character-window/get-characters",
        success: function (data2) {
            console.log("Getting all characers");

            var numChars = 0;
            for (var i = 0; i < data2.length; i++) {
                if (data2[i].league == leagueName) {
                    characters.push(data2[i].name);
                    numChars++;
                }
            }
            console.log("You have " + numChars + " character(s) in " + leagueName);
            $modal.prepend("<hr>You have " + numChars + " character(s) in " + leagueName + "<br>");
            pullEachChar(0);
        }
    }); //-
}

function pullAllChars() { //helper for pullEachChar (all)
    $.ajax({ //-
        url: "https://www.pathofexile.com/character-window/get-characters",
        success: function (data2) {
            console.log("Getting all characers");

            var numChars = 0;
            for (var i = 0; i < data2.length; i++) {
                characters.push(data2[i].name);
                numChars++;
            }
            console.log("You have " + numChars + " character(s)");
            $modal.prepend("<hr>You have " + numChars + " character(s)<br>");
            pullEachChar(0);
        }
    }); //-
}

function pullEachChar(i) { //uses same logic pretty much as tabs
    if (i < characters.length) { //characters.length
        var char = characters[i];
        $.ajax({
            url: "https://www.pathofexile.com/character-window/get-items?character=" + char + "&accountName=" + accountName,
            charName: char,
            success: function (data) {
                if (data.error == undefined) {
                    console.log("--success: " + char);
                    $modal.prepend("Successful pull on character: " + char + "<br>");
                    for (itemsKey in data.items) {
                        var item = data.items[itemsKey];
                        if (item.socketedItems.length > 0) {
                            for (gems in item.socketedItems) {
                                if (item.socketedItems[gems].cosmeticMods != undefined) {
                                    if (item.socketedItems[gems].cosmeticMods.length > 0) {
                                        charEffects.push({
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
                            if (skinBool && item.cosmeticMods.toString().search('Skin') > 0 && item.cosmeticMods.length == 1) {
                            } else {
                                if (item.cosmeticMods) {
                                    charEffects.push({
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
                    pullEachChar(i + 1);
                } else {
                    console.log("Error in pulling character: " + char);
                    $modal.prepend("Server has denied character request please wait. On character: " + char + "<br>Please do not refresh page.<br>");
                    setTimeout(function () {
                        pullEachChar(i);
                    }, 60000);
                }
            }
        });

    } else {
        console.log("Characters finished");
        showEffects();
    }
}

function showEffects() { // final stage!
    $modal.html("");
    if (charEffects.length == 0 && effects == 0) {
        log("No MTX's have been found", true);
    }
    //formating shit and outputting
    for (var charEffect in charEffects) {
        var e = charEffects[charEffect];
        for (var i = 0; i < e.cosmeticMods.length; i++) {
            e.cosmeticMods[i] = e.cosmeticMods[i].replace("Has ", "");
        }
        e.typeLine = e.typeLine.replace("<<set:MS>><<set:M>><<set:S>>", "");
        log("- \"" + e.cosmeticMods.join(", ") + "\" on \"" + e.typeLine + "\" on char \"" + e.charName + "\" in league \"" + e.league + "\"");
    }

    log("<hr>", true);
    for (var effect in effects) {
        var e = effects[effect];
        for (var i = 0; i < e.cosmeticMods.length; i++) {
            e.cosmeticMods[i] = e.cosmeticMods[i].replace("Has ", "");
        }
        log("- \"" + e.cosmeticMods.join(", ") + "\" on \"" + e.typeLine + "\" in tab '" + e.name + "' at " + e.x + ", " + e.y);
    }
    log("<button onclick='restart()'>Main Menu</button> <button onclick=\"$modal.remove();\">Close</button>");
}
//this is the onclick for the leagues link
$(document).on("click", "a._mtx", function (e) {
    e.preventDefault();
    console.log(charBool + " " + skinBool);
    //since clearing the modal gets rid of the check boxes I needed to make them variables
    if ($('#charOnly').is(':checked')) {
        charBool = true;
    }
    if ($('#skinRemove').is(':checked')) {
        skinBool = true;
    }
    leagueName = $(this).html();
    console.log(leagueName);
    $("._leagues").remove();
    $modal.html("Please wait...this could take a few minutes<br>");
    start();
});
//This is the onclick for the Get all characters link
$(document).on("click", "a.allChars", function (e) {
    e.preventDefault();
    if ($('#skinRemove').is(':checked')) {
        skinBool = true;
    }
    leagueName = $(this).html();
    console.log(leagueName);
    $("._leagues").remove();
    $modal.html("Please wait...this could take a few minutes<br>");
    pullAllChars();
});
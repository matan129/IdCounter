//counts the # of ID involved
exports.countUniqueNames = function (billFirstName,billLastName,shipFirstName,shipLastName,billNameOnCard) {
    //make everything lower case everything (so string comparison will be less complex)
    billFirstName = billFirstName.toLowerCase();
    billLastName = billLastName.toLowerCase();
    shipFirstName = shipFirstName.toLowerCase();
    shipLastName = shipLastName.toLowerCase();
    billNameOnCard = billNameOnCard.toLowerCase();

    //setup billing ID
    var billingID = {
        "first": "",
        "mid": "",
        "last": billLastName,
        "nameOnCard" : billNameOnCard
    };

    //setup shipping ID
    var shippingID = {
        "first": "",
        "mid": "",
        "last": shipLastName
    };

    //setup names (get the scv file and split it)
    var nameLines = getNameLines();

    //Separate the (raw) first names, which may contain middle names
    var billingNames = separateFirstName(billFirstName, nameLines);
    billingID.first = billingNames.firstName;
    billingID.mid = billingNames.middleName;

    var shippingNames = separateFirstName(shipFirstName, nameLines);
    shippingID.first = shippingNames.firstName;
    shippingID.mid = shippingNames.middleName;

    //check id the two IDs are identical.
    if(verifyIdentities(shippingID,billingID, nameLines))
        return 1;
    return 2;
};

function verifyIdentities(sID, bID, names) {
    //check first name (allow aliases / non strict)
    if(!checkIdenticalNames(sID.first,bID.first, names, false, false)) {
        return false;
    }

    //check middle name. middle names act like first names, so allow aliases
    if(!checkIdenticalNames(sID.mid, bID.mid, names, true, false)) {
        return false;
    }

    //check last names. Factor ONLY for typos (strict), and don't bother with aliases,
    // because last names do not have them.
    return checkIdenticalNames(sID.last, bID.last, names, false, true);
}


//checks if two names mean the same according to our CSV list.
function checkIdenticalNames(name1, name2, names, isMiddle, isStrict) {
    //naive check, to spare some CPU
    if(name1 === name2)
        return true;

    //if not in strict mode, check for aliases
    if(!isStrict) {
        //get all the aliases of this name
        var aliases = getAllAliases(name1, names);

        //if the name is an alias of the other, return true
        if (aliases.indexOf(name2) > -1)
            return true;

        //special check for middle names
        if (isMiddle) {
            //allow only one middle name to be non-existent, so we use XOR workaround.
            //basically we allow scenarios like "Deborah S. Egli" and "Debora Egli" to be OK
            if (!(name1.length === 0) ^ !(name2.length === 0))
                return true;

            //check if one name is a short name for the another (i.e. "J." for Genuine in Michael J. Fox. Wait, what?
            if (!checkMiddleShorting(name1, name2) ^ !checkMiddleShorting(name2, name1)) {
                return true;
            }
        }
    }

    //factor in for typos (allow up to one mistake - one character)
    if(Math.abs(name1.length - name2.length) <= 1) {
        var mistakes = 0;
        for(var i = 0; i < Math.max(name1.length, name2.length); i++)
            if(name1[i] !== name2[i])
                mistakes++;

        if(mistakes <= 1)
            return true;
    }

    return false;
}

//checks if one name is the start of the other
function checkMiddleShorting(name1, name2) {
    if(name1.length <= 2)  //allow dot in the end ("J.")
        if(name2.indexOf(name1[0]) === 0) //take only the first character and check if the other name starts with it.
            return true;
}


//get all aliases of a name
function getAllAliases(name, nameLines) {
    var allNicknames = [];

    //go over the lines we got from the csv
    for(var i = 0; i < nameLines.length; i++) {
        if (nameLines[i].indexOf(name) > -1) {
            //append them to the allNicknames variable if they match
            var nicks = nameLines[i].split(',');
            for(var k = 0; k < nicks.length; k++) {
                allNicknames[allNicknames.length] = nicks[k];
            }
        }
    }

    return allNicknames;
}


//Splits a first+Middle name strings to separate strings.
function separateFirstName(firstNameRaw, names) {
    var fn; //first name
    var ln; //last name

    var words = firstNameRaw.split(' ');

    //only first name.
    if(words.length === 1) {
        fn = words[0];
        ln = "";
    }

    //middle name exists
    else {
        //check that the first name is an actual first name.
        //because our csv contains only first names we can leverage it for this test
        if (getAllAliases(words[0],names) !== "") {
            fn = words[0];
            ln = words[1];
        }
        else { //reverse order
            fn = words[1];
            ln = words[0];
        }
    }

    return {
        'firstName' : fn,
        'middleName' : ln
    }
}

//get names from the csv
function getNameLines() {
    var fs = require('fs');

    //read and split to lines
    var csv =  fs.readFileSync('names.csv');
    return csv.toString().split('\n');
}
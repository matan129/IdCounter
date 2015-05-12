//counts the # of ID involved
function countUniqueNames(billFirstName,billLastName,shipFirstName,shipLastName,billNameOnCard) {
    //make everything lower case everything (so string comparison will be less complex)
    billFirstName = billFirstName.toLowerCase();
    billLastName = billLastName.toLowerCase();
    shipFirstName = shipFirstName.toLowerCase();
    shipLastName = shipLastName.toLowerCase();
    billNameOnCard = billNameOnCard.toLowerCase();

    //setup billing ID
    var billingID = {
        'FirstRaw': billFirstName,
        'First': "",
        'Mid': "",
        'Last': billLastName,
        'NameOnCard' : billNameOnCard
    };

    //setup shipping ID
    var shippingID = {
        'FirstRaw': shipFirstName,
        'First': "",
        'Mid': "",
        'Last': shipLastName
    };

    //setup names
    var nameLines = getNameLines();

    //Separate the (raw) first names, which may contain middle names
    var billingNames = separateFirstName(billingID.FirstRaw, nameLines);
    billingID.First = billingNames.FirstName;
    billingID.Mid = billingNames.MiddleName;

    var shippingNames = separateFirstName(shippingID.FirstRaw, nameLines);
    shippingID.First = shippingNames.FirstName;
    shippingID.Mid = shippingNames.MiddleName;

    //check id the two IDs are identical.
    if(verifyIdentities(shippingID,billingID, nameLines))
        return 1;
    return 2;
}

function verifyIdentities(sID, bID, names) {
    //check first name (allow aliases / non strict)
    if(!checkIdenticalNames(sID.First,bID.First, names, false, false)) {
        return false;
    }

    //check middle name. middle names act like first names, so allow aliases
    if(!checkIdenticalNames(sID.Mid, bID.Mid, names, true, false)) {
        return false;
    }

    //check last names. factor only for typos (strict), and don't bother with aliases
    if(!checkIdenticalNames(sID.Last, bID.Last, names, false, true)) {
        return false;
    }

    return true;
}


//checks if two names mean the same according to our CSV list.
function checkIdenticalNames(name1, name2, names, isMiddle, isStrict) {
    if(name1 === name2)
        return true;

    if(!isStrict) {
        var aliases = getAllAliases(name1, names);

        if (aliases.indexOf(name2) > -1)
            return true;

        //special check for middle names
        if (isMiddle) {
            //allow only one middle name to be nonexistent
            if (!(name1.length === 0) ^ !(name2.length === 0))
                return true;

            //check if one name is short for another (i.e. "J." for Genuine in Michael J. Fox. Wait, what?
            if (!checkMiddleShorting(name1, name2) ^ !checkMiddleShorting(name2, name1)) {
                return true;
            }
        }
    }

    //factor in for typos (allow up to one mistake)
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

function checkMiddleShorting(name1, name2) {
    if(name1.length <= 2)  //allow dot ("J.")
        if(name2.indexOf(name1[0]) === 0) //take only the first character and check if the other name starts with it.
            return true;
}


//get all aliases of a name
function getAllAliases(name, nameLines) {
    var allNicknames = "";
    for(var i = 0; i < nameLines.length; i++) {
        if (nameLines[i].indexOf(name) > -1)
            allNicknames = allNicknames + nameLines[i];
    }

    return allNicknames;
}


//Splits a First+Middle name strings to separate strings.
function separateFirstName(firstNameRaw, names) {
    var FN; //first name
    var MN; //last name

    var words = firstNameRaw.split(' ');

    //only first name.
    if(words.length === 1) {
        FN = words[0];
        MN = "";
    }

    //middle name exists
    else {
        //check that the first name is an actual first name.
        //because our csv contains only first names we can leverage it for this test
        if (getAllAliases(words[0],names) !== "") {
            FN = words[0];
            MN = words[1];
        }
        else { //reverse order
            FN = words[1];
            MN = words[0];
        }
    }

    return {
        'FirstName' : FN,
        'MiddleName' : MN
    }
}

//get stuff from the csv
function getNameLines() {
    //TODO convert this somehow to relative path
    var file = "file:///C:/Users/Matan/IdeaProjects/IDCounter/names.csv";
    var allText;
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);

    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
            if(rawFile.status === 200 || rawFile.status == 0)
                allText = rawFile.responseText;

    };
    rawFile.send(null);

    return allText.split('\n');
}

//just a wrapper function for the actual counter function.
function displayUniqueNames() {

    //count IDs
    var ids = countUniqueNames(
        document.forms["checkoutForm"]["bFirstName"].value,
        document.forms["checkoutForm"]["bLastName"].value,
        document.forms["checkoutForm"]["sFirstName"].value,
        document.forms["checkoutForm"]["sLastName"].value,
        document.forms["checkoutForm"]["bNameOnCard"].value
    );

    //alert the user!
    window.alert(ids + " identities found.");
    return false;
}

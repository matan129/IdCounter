//counts the # of ID involved
function countUniqueNames(billFirstName,billLastName,shipFirstName,shipLastName,billNameOnCard) {
    //setup billing ID
    var billingID = {
        'FirstRaw': billFirstName,
        'First': "",
        'Mid': "",
        'Last': billLastName,
        'NameOnCard' : billNameOnCard
    }

    //setup shipping ID
    var shippingID = {
        'FirstRaw': shipFirstName,
        'First': "",
        'Mid': "",
        'Last': shipLastName
    }

    //setup names
    var nameLines = getNameLines();

    //Separate the first names, which may contain middle names
    var billingNames = separateFirstName(billingID.FirstRaw);
    billingID.First = billingNames.FirstName;
    billingID.Mid = billingNames.MiddleName;

    var shippingNames = separateFirstName(shippingID.FirstRaw);
    shippingID.First = shippingNames.FirstName;
    shippingID.Mid = shippingNames.MiddleName;

    //TODO normalize NameOnCard to First, Middle, Last names format for easier splitting and comparison

    //TODO actually compare the two identities

    //TODO Factor in typos

    return 1;
}

//checks if two names mean the same according to our CSV list.
function checkIdenticalNames(name1, name2, names)
{
    //TODO.
    return true;
}

function searchInNames(name, nameDb)

//Splits a First+Middle name strings to separate strings.
function separateFirstName(firstNameRaw, names)
{
    var FN; //first name
    var MN; //last name

    var words = firstNameRaw.split(' ');

    //only first name.
    if(words.length === 1) {
        FN = words[0];
    }
    //middle name exists
    else  {
        FN = words[0];
        MN = words[1];

        //check that the first name is an actual first name.
        //because our csv contains only first names we can leverage it for this test

    }


    //TODO.

    return {
        'FirstName' : FN,
        'MiddleName' : MN
    }
}

//get stuff from the csv
function getNameLines() {
    var allText;

    //TODO convert this somehow to relative path
    var file = "file:///C:/Users/Matan/Documents/Repositories/IdCounter/names.csv"

    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);

    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
            if(rawFile.status === 200 || rawFile.status == 0)
                allText = rawFile.responseText;

    }

    rawFile.send(null);
    return allText.split('\n');
}

//just a wrapper function for the actual counter function.
function displayUniqueNames() {
    //count IDs
    var ids = countUniqueNames(
        document.forms["checkoutForm"]["bFirstName"],
        document.forms["checkoutForm"]["bLastName"],
        document.forms["checkoutForm"]["sFirstName"],
        document.forms["checkoutForm"]["sLastName"],
        document.forms["checkoutForm"]["bNameOnCard"]
    );

    //alert the user!
    window.alert(ids + " identities found.");
    return false;
}

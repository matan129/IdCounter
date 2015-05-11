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
function compareNicksNames(name1, name2)
{
    //TODO.
    return true;
}

//Splits a First+Middle name strings to separate strings.
function separateFirstName(firstNameRaw)
{
    var FN; //first name
    var MN; //last name

    //TODO.

    return {
        'FirstName' : FN,
        'MiddleName' : MN
    }
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

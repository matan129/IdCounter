//counts the # of ID involved
exports.countUniqueNames = function (billFirstName,billLastName,shipFirstName,shipLastName,billNameOnCard) {
    //make everything lower case everything (so string comparison will be less complex)
    for(var i = 0; i < arguments.length; i++) {
        arguments[i] = arguments[i].toLowerCase();
    }

    //parse the identities from the raw data
    var shippingID = IdCounter.parseIdentity(shipFirstName, shipLastName);
    var billingID = IdCounter.parseIdentity(billFirstName, billLastName);
    var nocID = IdCounter.parseIdentity(billNameOnCard);

    //count the parse identities
    return IdCounter.verifyIdentities(shippingID,billingID, nocID);
};

var IdCounter = {
    verifyIdentities: function (sID, bID, nocID) {
        //check first name (allow aliases / non strict)
        var fnResult = IdCounter.countDistinctNames([sID.first, bID.first, nocID.first], false, false);

        //check middle name. middle names act like first names, so allow aliases
        var midResult = IdCounter.countDistinctNames([sID.middle, bID.middle, nocID.middle], true, false);

        //check last names. Factor ONLY for typos (strict), and don't bother with aliases, because last names do not have them.
        var lastResult = IdCounter.countDistinctNames([sID.last, bID.last, nocID.last], false, true);

        return Math.max(fnResult,Math.max(midResult,lastResult));
    },

    countDistinctNames: function (names, isMiddle, isStrict) {
        var count = 0;
        for(var i = 0; i < names.length; i++) {
            count += IdCounter.areIdenticalNames(names[i],names[(i+1)%names.length],isMiddle,isStrict);
        }
        return Math.max(count,1);
    },

    //checks if two names mean the same according to our CSV list.
    areIdenticalNames: function (name1, name2, isMiddle, isStrict) {
        //naive check, to spare some CPU
        if (name1 === name2)
            return 0;

        //if not in strict mode, check for aliases
        if (!isStrict) {
            //get all the aliases of this name
            var aliases = IdCounter.getAllAliases(name1);

            //if the name is an alias of the other, return true
            if (aliases.indexOf(name2) > -1)
                return 0;

            //special check for middle names
            if (isMiddle) {
                //allow only one middle name to be non-existent, so we use XOR workaround.
                //basically we allow scenarios like "Deborah S. Egli" and "Debora Egli" to be OK
                if (!(name1.length === 0) ^ !(name2.length === 0))
                    return 0;

                //check if one name is a short name for the another (i.e. "J." for Genuine in Michael J. Fox. Wait, what?
                if (!checkMiddleShorting(name1, name2) ^ !checkMiddleShorting(name2, name1)) {
                    return 0;
                }
            }
        }

        //factor in for typos (allow up to one mistake - one character or one character swap)
        if (Math.abs(name1.length - name2.length) <= 1) {
            var mistakes = 0;
            var n1u = "";
            var n2u = "";

            for (var i = 0; i < Math.max(name1.length, name2.length); i++)
                if (name1[i] !== name2[i]) {
                    mistakes++;

                    n1u += name1[i];
                    n2u += name2[i];
                }
            if (mistakes <= 1 || checkLetterSwap(n1u,n2u,2)) {
                return 0;
            }
        }

        return 1;

        //INNER FUNCTIONS
        function checkMiddleShorting(name1, name2) {
            if (name1.length <= 2)  //allow dot in the end ("J.")
                if (name2.indexOf(name1[0]) === 0) //take only the first character and check if the other name starts with it.
                    return true;
        }

        function checkLetterSwap(s1,s2,tolerance) {
            if(s1.length > tolerance || s2.length > tolerance || s1.length !== s2.length)
                return false;

            for(var index = 0; index < s1.length; index++) {
                if(s1[index] !== s2[s2.length - index])
                    return false;
            }

            return true;
        }
    },

    //parses an identity from raw data
    parseIdentity: function (firstName, lastName) {
        var identity = {
            first: "",
            middle: "",
            last: lastName || ""
        };

        //remove punctuation and split the first name to its components
        var fnWords = firstName.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(' ');

        if(arguments.length === 2) {
            if (fnWords.length === 1) {
                //only first name present (no middle)
                identity.first = fnWords[0];
                identity.middle = "";
            } else if (fnWords.length === 2) { //first name + middle
                //middle name exists
                //check that the first name is an actual first name.
                //because our csv contains only first names we can leverage it for this test
                if (IdCounter.getAllAliases(fnWords[0]).length > 0) {
                    identity.first = fnWords[0];
                    identity.middle = fnWords[1];
                }
                else { //reverse order
                    identity.first = fnWords[1];
                    identity.middle = fnWords[0];
                }
            }
        } else { //this means we got the Name On Card case to parse.
            /*
            Possible Scenarios: (punctuation won't be available in actual cases - just for ease of read)
             - Deborah S Morgan
             - Morgan, Deborah S
             - Deborah Sophie Morgan
             - Morgan, Deborah Sophie
             - Deborah Morgan
             - Morgan Deborah
             */
            var split = (function() {
                var found = [];
                var lastName;
                for(var i = 0; i < fnWords.length; i++) {
                    var name = fnWords[i];
                    if(IdCounter.getAllAliases(name).length > 0) {
                        //meaning it's either first or middle name
                        found.push(name);
                    } else {
                        lastName = name;
                    }
                }

                return {
                    firstAndMiddle: found,
                    last: lastName
                };
            }());

            var fNames = split.firstAndMiddle;

            //as you can see in the possible scenarios comment above, the first name will always be before the middle.
            identity.first = fNames[0];

            //check if there a middle name
            if(fNames.length > 1) {
                //make sure you get all middle names (if there are more than one)
                for(var i = 1; i < fNames.length; i++) {
                    identity.middle += fNames[i];
                }
            }

            //set last name
            identity.last = split.last;
        }

        return identity;
    },

    //get all aliases of a name
    getAllAliases: function (name) {
        var allNicknames = [];

        //go over the lines we got from the csv
        for (var i = 0; i < IdCounter.names.length; i++) {
            if (IdCounter.names[i].indexOf(name) > -1) {
                //append them to the allNicknames variable if they match
                var nicks = IdCounter.names[i].split(',');
                for (var k = 0; k < nicks.length; k++) {
                    allNicknames.push(nicks[k]);
                }
            }
        }

        return allNicknames;
    },

    //get names from the csv
    names: (function () {
        var fs = require('fs');

        //read and split to lines
        var csv = fs.readFileSync('names.csv');
        return csv.toString().split('\n');
    } ())
};
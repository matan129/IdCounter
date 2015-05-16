//counts the # of ID involved
exports.countUniqueNames = function (billFirstName, billLastName, shipFirstName, shipLastName, billNameOnCard) {
    //make everything lower case everything (so string comparison will be less complex)
    for (var i = 0; i < arguments.length; i++) {
        arguments[i] = arguments[i].toLowerCase();
    }

    //parse the identities from the raw data
    var shippingID = IdCounter.parseIdentity(shipFirstName, shipLastName);
    var billingID = IdCounter.parseIdentity(billFirstName, billLastName);
    var nocID = IdCounter.parseIdentity(billNameOnCard);

    //count the parse identities
    return IdCounter.countIdentities([shippingID, billingID, nocID]);
};

var IdCounter = {
    countIdentities: function (IDs) {
        //we count distinct IDs here. This function is not limited to any number of identities.
        var distinctIndexes = [];

        for (var index = 0; index < IDs.length; index++) {
            distinctIndexes[index] = -1;
        }

        for (var i = 0; i < IDs.length; i++) {
            /*
             skip over already tested identities.
             We want to minimize the use of the relatively heavy areDifferentIDs function,
             due to the long name lookup.
             */
            if (distinctIndexes[i] > -1)
                continue;

            distinctIndexes[i] = i;
            for (var j = i + 1; j < IDs.length; j++) {
                if (!IdCounter.areDifferentIDs(IDs[i], IDs[j])) {
                    distinctIndexes[j] = i;
                }
            }
        }

        //find the maximum identity # in the array.
        var max = -1;

        for (i = 0; i < distinctIndexes.length; i++) {
            max = Math.max(max, distinctIndexes[i]);
        }

        return max + 1;
    },

    areDifferentIDs: function (id1, id2) {
        if (!id1.isNoC && !id2.isNoC || !id1.skip || id2.skip) {
            id1.skip = false;
            id2.skip = false;

            //check first name (allow aliases / non strict)
            var fnResult = IdCounter.countDistinctNames(id1.first, id2.first, false, false);

            //check middle name. middle names act like first names, so allow aliases
            var midResult = IdCounter.countDistinctNames(id1.middle, id2.middle, true, false);

            //check last names. Factor ONLY for typos (strict), and don't bother with aliases, because last names do not have them.
            var lastResult = IdCounter.countDistinctNames(id1.last, id2.last, false, true);

            return Math.max(fnResult, midResult, lastResult) > 1;

        } else {
             //since name on card parsing may get it wrong due to ambiguous names,
             //we may need to re-interpret them with contextual info from another identity

            if (id2.isNoC) {
                id2 = IdCounter.contextualReInterpretNoC(id2, id1);
            } else if (id1.isNoC) {
                id1 = IdCounter.contextualReInterpretNoC(id1, id2);
            }

            return IdCounter.areDifferentIDs(id1, id2);
        }

    },

    //re-parses identity generated from the Name On Card field with contextual information
    contextualReInterpretNoC: function (nocId, id2) {
        if (!nocId.isNoC && !id2.isNoC)
            return nocId;

        //allow re-interpretation once only to get dodgy scenarios right
        nocId.isNoC = false;

        var oldID = {
            first: nocId.first,
            middle: nocId.middle,
            last: nocId.last
        };

        // Goes over all permutations (three fields: 3! = 6).
        if (matchIDs(id2, nocId.first, nocId.middle, nocId.last)) {
            //since we haven't change anything let it be re-parsed later
            nocId.isNoC = true;
            nocId.skip = true;
        } else if (matchIDs(id2, nocId.middle, nocId.first, nocId.last)) {
            nocId.first = oldID.middle;
            nocId.middle = oldID.first;
            nocId.last = oldID.last;
        } else if (matchIDs(id2, nocId.first, nocId.last, nocId.middle)) {
            nocId.first = oldID.first;
            nocId.middle = oldID.last;
            nocId.last = oldID.middle;
        } else if (matchIDs(id2, nocId.last, nocId.first, nocId.middle)) {
            nocId.first = oldID.last;
            nocId.middle = oldID.first;
            nocId.last = oldID.middle;
        } else if (matchIDs(id2, nocId.last, nocId.middle, nocId.first)) {
            nocId.first = oldID.last;
            nocId.middle = oldID.middle;
            nocId.last = oldID.first;
        } else if (matchIDs(id2, nocId.middle, nocId.last, nocId.first)) {
            nocId.first = oldID.middle;
            nocId.middle = oldID.last;
            nocId.last = oldID.first;
        }

        return nocId;

        function matchIDs(id1, fn, mn, ln) {
            return fn.length !== 0 && ln.length !== 0
                && matchedNames(id1.first, fn) && matchedNames(id1.middle, mn) && matchedNames(id1.last, ln);

            function matchedNames(name1, name2) {
                if (name1 === name2)
                    return true;

                if (!(name1.length === 0) ^ !(name2.length === 0))
                    return true;

                if (name1.length === 1 && name2[0] === name1)
                    return true;

                if (name2.length === 1 && name1[0] === name2)
                    return true;

                return IdCounter.getAllAliases(name1).indexOf(name2) > -1;
            }
        }
    },


    countDistinctNames: function (name1, name2, isMiddle, isStrict) {
        return 1 + IdCounter.areDifferentNames(name1, name2, isMiddle, isStrict);
    },

    //checks if two names mean the same according to our CSV list.
    areDifferentNames: function (name1, name2, isMiddle, isStrict) {
        //naive check, to spare some CPU
        if (name1 === name2)
            return 0;

        //if not in strict mode, check for aliases
        if (!isStrict) {
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

            //get all the aliases of this name
            var aliases = IdCounter.getAllAliases(name1);

            //if the name is an alias of the other, return true
            if (aliases.indexOf(name2) > -1)
                return 0;
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
            if (mistakes <= 1 || checkLetterSwap(n1u, n2u, 2)) {
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

        function checkLetterSwap(s1, s2, tolerance) {
            if (s1.length > tolerance || s2.length > tolerance || s1.length !== s2.length)
                return false;

            for (var index = 0; index < s1.length; index++) {
                if (s1[index] !== s2[s2.length - 1 - index])
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
            last: lastName || "",
            isNoC: false,
            skip: false
        };

        //remove punctuation and split the first name to its components
        var fnWords = firstName.trim().replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(' ');

        if (arguments.length === 2) {
            if (fnWords.length === 1) {
                //only first name present (no middle)
                identity.first = fnWords[0];
                identity.middle = "";
            } else if (fnWords.length === 2) { //first name + middle
                //middle name exists
                //check that the first name is an actual first name.
                //because our csv contains only first names we can leverage it for this test
                if (IdCounter.isFirstName(fnWords[0]) || fnWords[1].length === 1) {
                    identity.first = fnWords[0];
                    identity.middle = fnWords[1];
                }
                else { //reverse order
                    identity.first = fnWords[1];
                    identity.middle = fnWords[0];
                }
            }
        } else { //this means we got the Name On Card case to parse.
            identity.isNoC = true;

            /*
             Possible Scenarios: (punctuation won't be available in actual cases - just for ease of read)
             - Deborah S Morgan
             - Morgan, Deborah S
             - Deborah Sophie Morgan
             - Morgan, Deborah Sophie
             - Deborah Morgan
             - Morgan Deborah
             */

            //split to middle+first and last names
            var splitNames = (function () {
                var attr = [];
                var firstsAndMids = [];
                var lastName;

                //classify names
                for (var i = 0; i < fnWords.length; i++) {
                    attr.push({
                        canBeFirstOrMiddle: false,
                        isMiddle: false,
                        canBeLast: false,
                        blackListed: false
                    });

                    if (IdCounter.isFirstName(fnWords[i]))
                        attr[i].canBeFirstOrMiddle = true;
                    if (fnWords[i].length == 1) {
                        attr[i].canBeFirstOrMiddle = false;
                        attr[i].isMiddle = true;
                    } else {
                        if (IdCounter.isLastName(fnWords[i]))
                            attr[i].canBeLast = true;
                    }
                }

                //choose first name if there is 100% middle name after it
                for (i = 1; i < attr.length; i++) {
                    if (attr[i].isMiddle) {
                        firstsAndMids.push(fnWords[i - 1]);
                        attr[i - 1].blackListed = true;
                    }
                }

                //choose last name
                for (i = 0; i < attr.length; i++) {
                    //it's surely last name if it can be last (according to the csv), cannot be first/middle and it's the first or last word in the NoC
                    if (!attr[i].blackListed && attr[i].canBeLast == true && attr[i].canBeFirstOrMiddle == false && (i == 0 || i == attr.length - 1)) {
                        lastName = fnWords[i];
                        attr[i].blackListed = true;
                        break;
                    }
                }

                if (typeof lastName == 'undefined') {
                    //no last name was chosen on the previous step, so go to worse case
                    for (i = 0; i < attr.length; i++) {
                        //choose last name that may be first or middle. Ambiguity.
                        if (!attr[i].blackListed && attr[i].canBeLast == true && (i == 0 || i == attr.length - 1)) {
                            lastName = fnWords[i];
                            attr[i].blackListed = true;
                            break;
                        }
                    }
                }

                //all the other names are first or middle by definition
                for (i = 0; i < attr.length; i++) {
                    if (!attr[i].blackListed) {
                        firstsAndMids.push(fnWords[i]);
                    }
                }

                return {
                    firstAndMiddle: firstsAndMids,
                    last: lastName
                };
            }());

            var fNames = splitNames.firstAndMiddle;

            //as you can see in the possible scenarios comment above, the first name will always be before the middle.
            identity.first = fNames[0];

            //check if there a middle name
            if (fNames.length > 1) {
                //make sure you get all middle names (if there are more than one)
                for (var i = 1; i < fNames.length; i++) {
                    identity.middle += fNames[i];
                }
            }

            //set last name
            identity.last = splitNames.last;
        }

        return identity;
    },

    //get all aliases of a name
    getAllAliases: function (name) {
        var allNicknames = [];

        //go over the lines we got from the csv
        for (var i = 0; i < IdCounter.aliases.length; i++) {
            if (IdCounter.aliases[i].indexOf(name) > -1) {
                //append them to the allNicknames variable if they match
                var nicks = IdCounter.aliases[i].split(',');
                for (var k = 0; k < nicks.length; k++) {
                    allNicknames.push(nicks[k]);
                }
            }
        }

        return allNicknames;
    },

    isFirstName: function (name) {
        if (name.length < 2)
            return false;

        //our name lists are sorted
        return IdCounter.binarySearch(IdCounter.firstNames, name) !== null || IdCounter.getAllAliases(name).length > 0;
    },

    isLastName: function (name) {
        //our name lists are sorted
        return IdCounter.binarySearch(IdCounter.lastNames, name) !== null;
    },

    binarySearch: function (array, item) {
        var left = 0;
        var right = array.length - 1;
        var middle = 0;

        while (left <= right) {
            middle = Math.floor((left + right) / 2);

            if (array[middle] > item)
                right = middle - 1;
            else if (array[middle] < item)
                left = middle + 1;
            else
                return middle
        }

        return null;
    },

    //get first names aliases from the csv
    aliases: (function () {
        var fs = require('fs');

        //read and split to lines
        var csv = fs.readFileSync('aliases.csv');

        var names = csv.toString().split('\n');

        for (var i = 0; i < names.length; i++) {
            names[i] = names[i].replace('\r', '');
            names[i] = names[i].toLowerCase();
        }

        return names;
    }()),

    firstNames: (function () {
        var fs = require('fs');

        //read and split to lines
        var csv = fs.readFileSync('first_names.csv');
        var names = csv.toString().split('\n');

        for (var i = 0; i < names.length; i++) {
            names[i] = names[i].replace('\r', '');
            names[i] = names[i].toLowerCase();
        }

        return names;
    }()),

    //get last names from the csv
    lastNames: (function () {
        var fs = require('fs');

        //read and split to lines
        var csv = fs.readFileSync('last_names.csv');
        var names = csv.toString().split('\r');

        for (var i = 0; i < names.length; i++) {
            names[i] = names[i].replace('\r', '');
            names[i] = names[i].toLowerCase();
        }
        return names;
    }())
};
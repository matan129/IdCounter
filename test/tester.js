var assert = require('assert');
var validator = require('../validator.js');

//"manual" tests
describe('\"Deborah\" name tests', function () {
    it('Deborah Egli & Debbie Egli', function () {
        assert.equal(validator.countUniqueNames('Deborah', 'Egli', 'Debbie', 'Egli', 'Debbie Egli'), 1);
    });

    it('Michele Egli & Debbie Egli (two ids)', function () {
        assert.equal(validator.countUniqueNames('Michele', 'Egli', 'Deborah', 'Egli', 'Michele Egli'), 2);
    });

    it('Deborah Egli & Deborah Egli', function () {
        assert.equal(validator.countUniqueNames('Deborah', 'Egli', 'Deborah', 'Egli', 'Deborah Egli'), 1);
    });

    it('Deborah Egni & Debbie Egli (Typo)', function () {
        assert.equal(validator.countUniqueNames('Deborah', 'Egni', 'Deborah', 'Egli', 'Deborah Egli'), 1);
    });

    it('Deborah S Egli & Debbie Egli (Shorted middle name)', function () {
        assert.equal(validator.countUniqueNames('Deborah S', 'Egli', 'Deborah', 'Egli', 'Egli Deborah'), 1);
    });
});

//Extremely ambiguous case
describe('Extremely Ambiguous Case', function () {
    it('Samuel Luther Jackson', function () {
        assert.equal(validator.countUniqueNames('Samuel L.', 'Jackson', 'Sam', 'Jackson', 'Samuel Luther Jackson'), 1);
    });
});

//random names tests
describe('3000 Random name tests', function () {
    var input;
    var data = prepareData();

    for (var i = 0; i < 1000; i++) {
        input = generateRandomTest(1, data);
        it('Random input with 1 identity: ' + input.desc, function () {
            assert.equal(validator.countUniqueNames(input.bFn, input.bLn, input.sFn, input.sLn, input.bNoC), input.idNumber);
        });
    }

    for (var i = 0; i < 1000; i++) {
        input = generateRandomTest(2, data);
        it('Random input with 2 identities: ' + input.desc, function () {
            assert.equal(validator.countUniqueNames(input.bFn, input.bLn, input.sFn, input.sLn, input.bNoC), input.idNumber);
        });
    }

    for (var i = 0; i < 1000; i++) {
        input = generateRandomTest(3, data);
        it('Random input with 3 identities: ' + input.desc, function () {
            assert.equal(validator.countUniqueNames(input.bFn, input.bLn, input.sFn, input.sLn, input.bNoC), input.idNumber);
        });
    }
});

function prepareData() {
    //read data
    var aliasesCSV = 'aliases.csv';
    var lastNamesCSV = 'last_names.csv';

    //read names fro the CSVs. fam stands for "first and middle" (names)
    var fs = require('fs');
    var famLines = fs.readFileSync(aliasesCSV).toString().split('\n');
    var lastNames = fs.readFileSync(lastNamesCSV).toString().split('\r');

    //remove control characters (like \r)
    for (var i = 0; i < famLines.length; i++) {
        famLines[i] = famLines[i].replace('\r', '');
    }

    return {
        fam: famLines,
        last: lastNames
    };
}

function generateRandomTest(idNumber, data) {
    var famLines = data.fam;
    var lastNames = data.last;

    //build identities.
    var fn1, fn2, fn3, ln1, ln2, ln3, mid1 = "", mid2 = "", mid3 = "";

    //choose first name
    var avaliableFams = famLines[randomize(0, famLines.length, true)].split(',');
    fn1 = avaliableFams[randomize(0, avaliableFams.length - 1, true)];

    if (idNumber > 1) {
        //generate distinct first name
        do {
            avaliableFams = famLines[randomize(0, famLines.length, true)].split(',');
            fn2 = avaliableFams[randomize(0, avaliableFams.length, true)];
        } while (areAliases(fn1, fn2, famLines));
    } else {
        //generate nickname
        fn2 = avaliableFams[randomize(0, avaliableFams.length, true)];
    }

    if (idNumber === 3) {
        do {
            avaliableFams = famLines[randomize(0, famLines.length, true)].split(',');
            fn3 = avaliableFams[randomize(0, avaliableFams.length, true)];
        } while (areAliases(fn1, fn3, famLines));
    } else {
        fn3 = avaliableFams[randomize(0, avaliableFams.length, true)];
    }

    //choose last name
    ln1 = lastNames[randomize(0, lastNames.length, true)];

    //generate distinct last name
    if (idNumber > 1) {
        do {
            ln2 = lastNames[randomize(0, lastNames.length, true)];
        } while (ln1 === ln2);
    } else { //use the same last name
        ln2 = ln1;
    }

    if (idNumber === 3) {
        do {
            ln3 = lastNames[randomize(0, lastNames.length, true)];
        } while (ln1 === ln3);
    } else {
        ln3 = ln2;
    }


    if (Math.random() > 0.5) {
        //give some chance for middle names to pop in
        avaliableFams = famLines[randomize(0, famLines.length, true)].split(',');
        mid1 = avaliableFams[randomize(0, avaliableFams.length, true)];

        if (Math.random() > 0.5) {
            if (Math.random() > 0.5) {
                //use identical name
                mid2 = mid1;
            } else {
                //use initial
                mid2 = mid1[0];
            }
        } else {
            if (Math.random() > 0.5) {
                //use identical name
                mid3 = mid1;
            } else {
                //use initial
                mid3 = mid1[0];
            }
        }
    }

    var input = {
        bFn: fn1 + " " + mid1,
        bLn: ln1,
        sFn: fn2 + " " + mid2,
        sLn: ln2,
        bNoC: fn3 + " " + mid3 + " " + ln3,
        desc: fn1 + " " + mid1 + " " + ln1 + ", " + fn2 + " " + mid2 + " " + ln2 + ", " + fn3 + " " + mid3 + " " + ln3,
        idNumber: idNumber
    };

    return mutateTest(input);
}

//does some modifications to the data, like generation typos
function mutateTest(input) {
    if (Math.random() > 0.5) {
        switch (randomize(1, 6, true)) {
            case 1:
                input.bFn = mutateString(input.bFn);
                break;
            case 2:
                input.bLn = mutateString(input.bLn);
                break;
            case 3:
                input.sFn = mutateString(input.sFn);
                break;
            case 4:
                input.sLn = mutateString(input.sLn);
                break;
            case 5:
                input.bNoc = mutateString(input.bNoC);
                break;
        }
    }

    return input;
}

function mutateString(str) {
    if (Math.random() > 0.5) {
        //do typo
        return doTypo(str);
    } else {
        //swap letter
        return doLetterSwap(str);
    }
}

function doTypo(str) {
    var index;

    do {
        index = randomize(0, str.length, true);
    } while (str[index] === ' ');

    //97 - 122 (including both ends) is the ASCII range for english non-capital letters
    return setCharAt(str, index, String.fromCharCode(randomize(97, 123, true)));
}

function doLetterSwap(str) {
    var index;

    do {
        index = randomize(0, str.length - 1, true);
    } while (str[index] === ' ' || str[index + 1] === ' ');

    var temp = str[index + 1];
    str = setCharAt(str, index + 1, str[index]);

    return setCharAt(str, index, temp);
}

//since js strings are immutable, re-build string in order to replace char at certain position
function setCharAt(str, index, chr) {
    if (index > str.length - 1) return str;
    return str.substr(0, index) + chr + str.substr(index + 1);
}

//determines if name is an alias of the other
function areAliases(name1, name2, names) {
    var name1nicks = getAllAliases(name1, names);
    return name1nicks.indexOf(name2) > -1
}

//generate all aliases of a name
function getAllAliases(name, nameLines) {
    var allNicknames = [];

    //go over the lines we got from the csv
    for (var i = 0; i < nameLines.length; i++) {
        if (nameLines[i].indexOf(name) > -1) {
            //append them to the allNicknames variable if they match
            var nicks = nameLines[i].split(',');
            for (var k = 0; k < nicks.length; k++) {
                allNicknames.push(nicks[k]);
            }
        }
    }

    return allNicknames;
}

//pseudo random number generator
function randomize(inclusiveMin, exclusiveMax, round) {
    if (!round)
        return Math.random() * (exclusiveMax - inclusiveMin) + inclusiveMin;
    //not normal distribution but close enough
    return Math.min(exclusiveMax - 1, (Math.round((Math.random() * (exclusiveMax - inclusiveMin) + inclusiveMin))));
}
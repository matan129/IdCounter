var assert = require('assert');
var validator = require('../validator.js');

//"manual" tests
describe('\"Deborah\" name tests', function () {
    this.timeout(30000); //TODO improve name lookup.

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


//random names tests
describe('15 Random name tests', function () {
    this.timeout(30000); //TODO improve name lookup.

    var input;
    var data = prepareData();

    for (var i = 0; i < 5; i++) {
        input = generateRandomTest(1, data);
        it('Random input with 1 identity \n ' + input.desc, function () {
            assert.equal(validator.countUniqueNames(input.bFn, input.bLn, input.sFn, input.sLn, input.bNoC), input.idNumber);
        });
    }

    for (var i = 0; i < 5; i++) {
        input = generateRandomTest(2, data);
        it('Random input with 2 identities \n ' + input.desc, function () {
            assert.equal(validator.countUniqueNames(input.bFn, input.bLn, input.sFn, input.sLn, input.bNoC), input.idNumber);
        });
    }

    for (var i = 0; i < 5; i++) {
        input = generateRandomTest(3, data);
        it('Random input with 3 identities \n ' + input.desc, function () {
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
    var fn1, fn2, fn3, ln1, ln2, ln3;

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

    /*
    if(typeof fn1 === 'undefined' || typeof fn2 === 'undefined' || typeof fn3 === 'undefined' ||
        typeof ln1 === 'undefined' || typeof ln2 === 'undefined' || typeof ln3 === 'undefined' ||
        fn1 === 'undefined' || fn2 === 'undefined' || fn3 === 'undefined' ||
        ln1 === 'undefined' || ln2 === 'undefined' || ln3 === 'undefined') {
        console.log("something fishy is going on!");
    }
    */

    
    if(Math.random() > 0.75) {
        //give some chance for letter swaps
        var rand = randomize(1,7,true);
        if(Math.random() > 0.5) {
            //do typo
            switch(rand) {
                case 1:
                    fn1  = doTypo(fn1);
                    break;
                case 2:
                    fn2  = doTypo(fn2);
                    break;
                case 3:
                    fn3  = doTypo(fn3);
                    break;
                case 4:
                    ln1  = doTypo(ln1);
                    break;
                case 5:
                    ln2  = doTypo(ln2);
                    break;
                case 6:
                    ln3  = doTypo(ln3);
                    break;
            }
        } else {
            //swap letter
            switch(rand) {
                case 1:
                    fn1  = doLetterSwap(fn1);
                    break;
                case 2:
                    fn2  = doLetterSwap(fn2);
                    break;
                case 3:
                    fn3  = doLetterSwap(fn3);
                    break;
                case 4:
                    ln1  = doLetterSwap(ln1);
                    break;
                case 5:
                    ln2  = doLetterSwap(ln2);
                    break;
                case 6:
                    ln3  = doLetterSwap(ln3);
                    break;
            }
        }
    }
    
    
    return {
        bFn: fn1,
        bLn: ln1,
        sFn: fn2,
        sLn: ln2,
        bNoC: fn3 + " " + ln3,
        desc: "-> " + fn1 + " " + ln1 + "\n -> " + fn2 + " " + ln2 + "\n -> " + fn3 + " " + ln3,
        idNumber: idNumber
    }
}


function doTypo(name) {
    var index = randomize(0,name.length,true);

    //97 - 122 (including both ends) is the ASCII range for english non-capital letters
    return setCharAt(name,index,String.fromCharCode(randomize(97,123,true)));
}

function doLetterSwap(name) {
    var index = randomize(0,name.length - 1,true);

    var temp  = name[index + 1];
    name = setCharAt(name,index + 1,name[index]);

    return setCharAt(name,index,temp);
}

//since js strings are immutable, re-build string in order to replace char at certain position
function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substr(0,index) + chr + str.substr(index+1);
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
    return Math.min(exclusiveMax - 1,(Math.round((Math.random() * (exclusiveMax - inclusiveMin) + inclusiveMin))));
}
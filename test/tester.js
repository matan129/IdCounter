var assert = require('assert');
var validator = require('../validator.js');

describe('Random name tests', function() {
    var input = generateRandomTest(1);
    it('Random input with 1 identity \n ' + input.desc,  function () {
        assert.equal(validator.countUniqueNames(input.bFn,input.bLn,input.sFn, input.sLn, input.bNoC),input.idNumber);
    });

    input = generateRandomTest(2);
    it('Random input with 2 two identities \n ' + input.desc,  function () {
        assert.equal(validator.countUniqueNames(input.bFn,input.bLn,input.sFn, input.sLn, input.bNoC),input.idNumber);
    });
});

function generateRandomTest(idNumber){
    //read data
    var firstAndMiddleCSV = "names.csv";
    var lastNamesCSV = "test\\lastNames.csv";

    //read names fro the CSVs. fam stands for "first and middle" (names)
    var fs = require('fs');
    var fams = fs.readFileSync(firstAndMiddleCSV);
    var lasts = fs.readFileSync(lastNamesCSV);

    var famLines = fams.toString().split('\n');
    var lastNames = lasts.toString().split('\r');

    //determine test configuration (use middle name, short it, etc.)
    var randomMiddle = Math.random();
    var useMiddleName = randomMiddle > 0.5;

    var randShortMiddle = Math.random();
    var shortenMiddle = randShortMiddle > 0.5;

    //build identities.
    var id1, id2, id1and2;

    if(idNumber === 1) {
        id1and2 = getRandomID(famLines, lastNames, useMiddleName, shortenMiddle, true);
    } else {
        id1and2 = getRandomID(famLines, lastNames, useMiddleName, shortenMiddle, false);
    }

    id1 = id1and2.firstId;
    id2 = id1and2.secondId;

    return {
        bFn: id1.first + " " + id1.mid,
        bLn: id1.last,
        sFn: id2.first + " " + id2.mid,
        sLn: id2.last,
        bNoC: id1.nameOnCard,
        desc: id1.first + " " + id1.mid + " " + id1.last + " " + id1.nameOnCard + "  |  " + id2.first + " " + id2.mid + " " + id2.last + " |  " + idNumber,
        idNumber: idNumber
    }
}

function getRandomID(famLines,lastNames,useMiddleName,shortenMiddle, distinctIDs){
    var fn1, fn2, mn1, mn2, ln1, ln2;
    mn1 = " ";
    mn2 = " ";
    fn1 = " ";
    fn2 = " ";
    ln1 = " ";
    ln2 = " ";

    //choose first names
    var random = randomize(0,famLines.length,true);
    var famLine = famLines[random];
    famLine = famLine.substr(0,famLine.length - 1);

    var avaliableFams = famLine.split(',');
    random = randomize(0,avaliableFams.length,true);
    fn1 = avaliableFams[random];
    fn2 = fn1;
    //generate completely different name if required.
    if(distinctIDs) {
        //make sure that it is not the same name / nickname by accident
        while(areAliases(fn1, fn2, famLines)) {
            random = randomize(0, famLines.length, true);

            famLine = famLines[random];
            famLine = famLine.substr(0,famLine.length - 1);

            avaliableFams = famLine.split(',');
            random = randomize(0, avaliableFams.length, true);
            fn2 = avaliableFams[random];
        }
    } else { //take an alias of fn1. Just take another name from the same line
        fn2 = avaliableFams[(random + 1) % avaliableFams.length]
    }

    //choose middle names
    if(useMiddleName) {
        random = randomize(0,avaliableFams.length,true);
        famLine = famLines[random];
        famLine = famLine.substr(0,famLine.length - 1);
        avaliableFams = famLine.split(',');

        random = randomize(0,avaliableFams.length,true);
        mn1 = avaliableFams[random];

        //shorten the middle name if required
        if(shortenMiddle) {
            mn1 = mn1[0];
        }

        if(distinctIDs) { //choose distinct middle name
            while (areAliases(fn1, fn2, famLines)) {
                random = randomize(0, avaliableFams.length, true);
                famLine = famLines[random];
                famLine = famLine.substr(0,famLine.length - 1);
                avaliableFams = famLine.split(',');

                random = randomize(0, avaliableFams.length, true);
                mn1 = avaliableFams[random];

                //shorten the middle name if required
                if (shortenMiddle) {
                    mn1 = mn1[0];
                }
            }
        } else { //choose an alias
            mn2 = avaliableFams[(random + 1) % avaliableFams.length]
        }
    }

    //choose last name
    random = randomize(1,lastNames.length,true);
    ln1 = lastNames[random];

    if(distinctIDs) { //choose distinct last name
        var random2 = random;
        while(random === random2) {
            var random2 = randomize(1,lastNames.length,true);
            ln2 = lastNames[random2];
        }
    } else { //no aliases for last name, obviously
        ln2 = ln1;
    }

    return {
        firstId: {
            first: fn1,
            mid: mn1,
            last: ln1,
            nameOnCard: fn1 + " " + mn1 + " " + ln1
        },
        secondId: {
            first: fn2,
            mid: mn2,
            last: ln2,
            nameOnCard: fn2 + " " + mn2 + " " + ln2
        }
    }
}

//determines if name is an alias of the other
function areAliases(name1, name2, names) {
    var name1nicks = getAllAliases(name1,names);
    return name1nicks.indexOf(name2) > - 1
}

//generate all aliases of a name
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

//pseudo random number generator
function randomize(inclusiveMin, exclusiveMax, round) {
    if(!round)
        return Math.random() * (exclusiveMax - inclusiveMin) + inclusiveMin;
    //not normal distribution but close enough
    return (Math.round(Math.random() * (exclusiveMax - inclusiveMin) + inclusiveMin));
}

//letter randomizer
function randomizeLetters(count)
{
    var text = "";
    var allowed = "abcdefghijklmnopqrstuvwxyz";

    for( var i=0; i < count; i++ )
        text += allowed.charAt(Math.floor(allowed.length * Math.random()));

    return text;
}
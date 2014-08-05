/*
 *  mongoose-fixture-config.js.js
 *  Type: Config
 *  Generated by mongoose-fixture (v0.4.1)
 *
 *  Generic configuration
 *  Please customize your mongodb, pathing, and FixtureListing
 *
 */

// Load the default object that helps manage a FixtureConfig
var FixtureConfig = require('mongoose-fixture').FixtureConfig;

// Create our fixture config with defined
// mongo-connection and file paths
var fixtureConfig = FixtureConfig({
    mongoConnection:{
        'host':'localhost',
        'port':'27017',
        'dbname':'ehr-designer'
    },
    paths:{
        schemaPath:__dirname+'/lib/models/',
        dataFixturePath:__dirname+'/lib/fixtures/'
    }
});

// Create a Listing of fixtures
var fixtures = 
[
    {
    	itemName:'UIElement',
    	schema:'element',
        data:'elements',
        collection:'elements'
    },
    {
    	itemName:'UIComponent',
    	schema:'component',
        data:'components',
        collection:'components'
    },
    {
    	itemName:'Template',
    	schema:'template',
        data:'templates',
        collection:'templates'
    },
    {
    	itemName:'ExportType',
    	schema:'exportType',
        data:'export-types',
        collection:'exporttypes'
    }
];

// load fixture listings
fixtureConfig.fixtureListings.set('all', fixtures);
fixtureConfig.fixtureListings.set('elements', [fixtures[0]]);
fixtureConfig.fixtureListings.set('components', [fixtures[1]]);
fixtureConfig.fixtureListings.set('templates', [fixtures[2]]);
fixtureConfig.fixtureListings.set('export-types', [fixtures[3]]);

// export the config
module.exports = fixtureConfig;